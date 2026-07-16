-- 소모임(번개) 1단계: 개설 + 참여 토글 + 참여자 아이콘 realtime
--
-- 성격: 1회성 번개("예배 끝나고 카페 갈 사람"). 멤버 누구나 개설하고 자유롭게 참여한다.
-- 개설자는 creator 일 뿐 리더가 아니다. 고정 멤버십·회차 개념이 없다.
--
-- events 를 확장하지 않고 별도 테이블로 가는 이유:
--   1) events 는 admin-only 다. 한 테이블에 합치면 멤버가 kind='event' 로 행사를 만드는
--      권한 승격 경로가 열린다. RLS 는 행만 막고 컬럼은 막지 못한다.
--   2) events.event_date 가 기간 표기용 text 라 그 부채를 그대로 상속하게 된다.
--      여기서는 gathering_at timestamptz 를 쓴다.
--
-- 없는 것과 그 이유:
--   - capacity: 시나리오에 없고, 빼면 동시 신청 경합/트리거 문제가 통째로 사라진다.
--   - attended: 참여 = 신청. 사후 출석 체크는 번개의 성격이 아니다.

-- ─────────────────────────────────────────────
-- 1. 소모임
-- ─────────────────────────────────────────────
create table public.gatherings (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  gathering_at timestamptz not null,              -- 모이는 시각 (날짜+시각 한 컬럼)
  place_name  text,
  description text,
  emoji       text,                               -- 대표 이모지 (없으면 코드에서 폴백)
  created_by  uuid not null references auth.users(id) on delete cascade,
  closed_at   timestamptz,                        -- 참여 신청 마감. null 이면 모집 중.
  created_at  timestamptz not null default now()
);

-- closed_at 은 "참여 신청"만 닫는다. 사진(2단계)·정산(3단계)은 종료 후에도 열려 있어야 한다.
-- 소모임이 끝나는 것과 정산이 끝나는 것은 수명이 다르다.

create index gatherings_at_idx      on public.gatherings (gathering_at desc);
create index gatherings_creator_idx on public.gatherings (created_by);

-- ─────────────────────────────────────────────
-- 2. 참여
-- ─────────────────────────────────────────────
create table public.gathering_participants (
  id           uuid primary key default gen_random_uuid(),
  gathering_id uuid not null references public.gatherings(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (gathering_id, user_id)                  -- 한 사람이 한 소모임에 한 번만
);

create index gathering_participants_gathering_idx on public.gathering_participants (gathering_id);
create index gathering_participants_user_idx      on public.gathering_participants (user_id);

-- ─────────────────────────────────────────────
-- 3. RLS
-- ─────────────────────────────────────────────
alter table public.gatherings             enable row level security;
alter table public.gathering_participants enable row level security;

-- 멤버 판별: user_profiles 행이 있으면 멤버다.
-- 익명 게스트도 authenticated 롤을 받으므로(Supabase 익명 로그인) to authenticated 만으로는
-- 부족하다. 익명 게스트는 user_profiles 행을 만들지 않는다.
-- 이 서브쿼리는 "본인 프로필 조회"(auth.uid() = id) 정책으로 자기 행을 볼 수 있어 동작한다.
-- events 의 admin 체크와 같은 패턴.

-- 소모임: 로그인 사용자 조회, 멤버 개설, 개설자만 수정·삭제
create policy "gatherings read" on public.gatherings
  for select to authenticated using (true);

create policy "gatherings insert member" on public.gatherings
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (select 1 from public.user_profiles p where p.id = auth.uid())
  );

-- with check 에도 created_by = auth.uid() 를 걸어 개설자를 남에게 넘기지 못하게 한다.
create policy "gatherings update creator" on public.gatherings
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "gatherings delete creator" on public.gatherings
  for delete to authenticated
  using (created_by = auth.uid());

-- 참여: 조회는 열어 둔다.
-- ⚠️ event_participants 의 "본인 것만 조회"(user_id = auth.uid()) 패턴을 복사하면 안 된다.
--    그러면 참여자 아이콘에 자기 자신만 보인다. 소모임은 누가 오는지 보는 게 핵심이다.
--    노출되는 건 user_id 뿐이고, 이름·아바타는 public_profiles 뷰로만 나간다.
create policy "gathering participants read" on public.gathering_participants
  for select to authenticated using (true);

-- 참여 신청: 본인 것만, 멤버만, 마감 전에만
create policy "gathering participants insert own" on public.gathering_participants
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.user_profiles p where p.id = auth.uid())
    and exists (
      select 1 from public.gatherings g
      where g.id = gathering_id and g.closed_at is null
    )
  );

-- 참여 취소: 본인 것만, 마감 전에만.
-- 마감 후 취소를 막는 이유: 마감은 명단을 확정하는 행위다. 3단계 정산이 이 명단 위에 붙는데,
-- 마감 뒤에도 빠질 수 있으면 정산 대상이 흔들린다.
create policy "gathering participants delete own" on public.gathering_participants
  for delete to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.gatherings g
      where g.id = gathering_id and g.closed_at is null
    )
  );

-- update 정책은 주지 않는다. 참여는 있거나(insert) 없거나(delete) 둘 뿐이다.

-- ─────────────────────────────────────────────
-- 4. Realtime
-- ─────────────────────────────────────────────
alter publication supabase_realtime add table public.gatherings;
alter publication supabase_realtime add table public.gathering_participants;
