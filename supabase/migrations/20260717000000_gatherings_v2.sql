-- 소모임 2단계: 성격(원데이/챌린지) · 카테고리 · 썸네일 · 리더 위임 · 후기
--
-- ⚠️ 파괴적 마이그레이션이다. 20260716020000_gatherings.sql 의 두 테이블을 지우고 새로 만든다.
--    소모임 테이블은 2026-07-16 에 생겼고 이 파일은 하루 뒤다. 실데이터가 없다는 전제 위에서만
--    정당하다. 소모임에 실데이터가 쌓인 뒤에는 이 방식을 반복하지 말 것 (events_v2 와 같은 이유).
--    db push 전에 반드시 --dry-run 으로 목록을 확인한다. events_v2 가 같이 밀리면 행사가 날아간다.
--
-- 왜 ALTER 가 아니라 재생성인가:
--   컬럼 rename + FK 재정의 + NOT NULL 해제 + 컬럼 5개 + 정책 8개 중 4개 재작성이다.
--   그리고 옛 파일의 전제("1회성 번개", "개설자는 리더가 아니다", "고정 멤버십·회차 없음")가
--   전부 뒤집혔다. ALTER 를 얹으면 그 주석이 파일 맨 위에 거짓말로 남는다.
--
-- 옛 모델에서 바뀐 것:
--   - 개설자는 이제 리더다. 자리가 넘어간다 (created_by → leader_id, 불변 아님).
--   - 모임이 사람보다 오래 산다. 리더가 탈퇴해도 모임은 남는다 (cascade → set null).
--   - 소모임에 성격이 생겼다. 챌린지는 기한이 없어 시간으로 끝나지 않는다.
--
-- 여전히 없는 것과 그 이유:
--   - capacity: 빼면 동시 신청 경합 문제가 통째로 사라진다.
--   - attended: 참여 = 신청.
--   - 회차: 챌린지 장소가 매번 바뀌는 건 place_name 덮어쓰기 + 누가 언제 고쳤나로 버틴다.
--     진짜 회차가 필요해지면 그때 테이블을 붙인다.

drop table if exists public.gathering_participants cascade;
drop table if exists public.gatherings cascade;

-- ─────────────────────────────────────────────
-- 0. 카테고리
-- ─────────────────────────────────────────────
-- 멤버가 직접 만들 수 있어서 테이블이다.
--
-- 처음엔 코드 상수로 뒀었다(constants/gatheringCategories.ts) — 이모지·라벨이 어차피 코드에
-- 있어야 하니 DB 에도 목록을 두면 두 진실이 갈라진다는 이유였다. 사용자가 만들 수 있게 되면서
-- 그 논리가 무너졌다. 이제 DB 가 목록의 유일한 주인이고 코드는 읽기만 한다.
--
-- ⚠️ 자유 생성이라 "카페"·"커피"·"카페모임"이 난립할 수 있다. 삭제·정리 로직으로 풀지 않는다 —
--    목록 필터 칩은 **소모임이 실제로 달린 카테고리만** 띄운다. 아무도 안 쓰는 건 저절로
--    안 보이고, 어차피 걸러봐야 빈 목록이라 필터의 목적상 그게 맞다.
create table public.gathering_categories (
  id         uuid primary key default gen_random_uuid(),
  emoji      text not null,
  label      text not null unique,             -- unique: 같은 이름 두 번 못 만든다
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 기본값. 여기서 심고 나면 코드는 이 목록을 하드코딩하지 않는다.
insert into public.gathering_categories (emoji, label) values
  ('☕️', '카페'), ('🍽️', '식사'), ('🏃', '운동'), ('📖', '스터디'),
  ('🎬', '문화'), ('🚗', '나들이'), ('🤝', '봉사'), ('🎲', '기타');

-- ─────────────────────────────────────────────
-- 1. 소모임
-- ─────────────────────────────────────────────
create table public.gatherings (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null default 'oneday',   -- 'oneday' | 'challenge'
  title         text not null,
  description   text,

  -- 원데이는 모이는 시각이 있다. 챌린지는 기한이 없어 null 이다.
  -- 옛 스키마는 not null 이었다. 그대로 두면 챌린지가 gathering_at 을 지나는 순간
  -- 자동으로 "종료"가 된다 — 통독반이 다음 날 끝나버린다.
  gathering_at  timestamptz,

  -- 챌린지는 장소가 매번 바뀐다. 참가자 누구나 고칠 수 있다(update_gathering_place RPC).
  -- 마지막에 쓴 사람이 이기므로, 책임 소재만 남긴다.
  place_name       text,
  place_updated_by uuid references auth.users(id) on delete set null,
  place_updated_at timestamptz,

  -- 카테고리가 지워져도 소모임은 남는다.
  category_id   uuid references public.gathering_categories(id) on delete set null,

  -- 없으면 카테고리 이모지, 그것도 없으면 기본 아이콘으로 떨어진다.
  --
  -- emoji 컬럼은 없다. 1단계에는 있었다 — 썸네일도 카테고리도 없던 시절 카드의 유일한 시각
  -- 식별자였기 때문이다. 둘 다 생긴 지금은 한 소모임에 이모지가 두 번 붙는 꼴이라(아이콘 ☕ +
  -- 카테고리 ☕️ 카페) 같은 걸 두 번 고르게 하는 셈이었다. 이모지 고르기는 카테고리를
  -- **만들 때**로 옮겼다 — 새 카테고리에는 이모지가 필요하다.
  thumbnail_url text,

  -- ⚠️ set null 이다. cascade 로 두면 리더가 계정을 지우는 순간 소모임 행이 삭제되고,
  --    gathering_participants 가 gatherings 를 cascade 로 물고 있어 참여자 기록까지 함께 날아간다.
  --    두 시간짜리 번개일 땐 합리적이었지만 무기한 챌린지에서는 정반대다.
  --    모임이 리더보다 오래 살아야 한다.
  leader_id     uuid references auth.users(id) on delete set null,

  closed_at     timestamptz,                      -- 참여 신청 마감. 종료가 아니다.
  ended_at      timestamptz,                      -- 종료. 챌린지는 시간으로 안 끝나서 이 컬럼이 필요하다.
  created_at    timestamptz not null default now(),

  constraint gatherings_kind_check check (kind in ('oneday', 'challenge')),
  -- 원데이에 시각이 없으면 상태를 계산할 수 없다. 챌린지에 시각이 있으면 기한이 생겨 정의가 깨진다.
  constraint gatherings_at_matches_kind check (
    (kind = 'oneday'    and gathering_at is not null) or
    (kind = 'challenge' and gathering_at is null)
  )
);

-- 상태 판정 (lib/gatheringTime.ts):
--   done   원데이 = gathering_at 지남 / 챌린지 = ended_at 있음
--   closed closed_at 있음 (양쪽 공통, 신청만 닫힘)
--   open   그 외
-- ended_at 이 챌린지 쪽에서 gathering_at 의 자리를 대신하는 대칭 구조다.
-- 덕분에 closed_at 의 뜻("신청 마감")을 kind 별로 재해석하지 않아도 된다.

create index gatherings_at_idx       on public.gatherings (gathering_at desc nulls first);
create index gatherings_leader_idx   on public.gatherings (leader_id);
create index gatherings_kind_idx     on public.gatherings (kind);
create index gatherings_category_idx on public.gatherings (category_id);

-- ─────────────────────────────────────────────
-- 2. 참여
-- ─────────────────────────────────────────────
create table public.gathering_participants (
  id           uuid primary key default gen_random_uuid(),
  gathering_id uuid not null references public.gatherings(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (gathering_id, user_id)
);

-- created_at 이 리더 승계 순서를 정한다(가장 먼저 들어온 사람). 인덱스가 그 정렬을 받는다.
create index gathering_participants_gathering_idx on public.gathering_participants (gathering_id, created_at);
create index gathering_participants_user_idx      on public.gathering_participants (user_id);

-- ─────────────────────────────────────────────
-- 3. 후기
-- ─────────────────────────────────────────────
create table public.gathering_reviews (
  id           uuid primary key default gen_random_uuid(),
  gathering_id uuid not null references public.gatherings(id) on delete cascade,
  -- set null 이다. 후기는 멤버십이 아니라 기록이라 사람이 떠나도 남는다.
  -- (참여는 cascade 가 맞다 — 안 오는 사람이 명단에 남을 이유가 없다.)
  -- segment_evaluations 가 같은 선택을 했다.
  user_id      uuid references auth.users(id) on delete set null,
  content      text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);

create index gathering_reviews_gathering_idx on public.gathering_reviews (gathering_id, created_at desc);

-- ─────────────────────────────────────────────
-- 4. 리더 승계
-- ─────────────────────────────────────────────
-- 리더가 사라지는 경로는 둘이고 성격이 다르다.
--   1) 모임 나가기      — 앱이 부른다. gathering_participants 행이 지워진다.
--   2) 계정 삭제(admin) — FK 액션이라 DB 가 자동으로 하고 앱 코드를 안 거친다.
-- 규칙을 앱에 두면 2번이 그냥 지나가 리더 없는 모임이 남는다. 그래서 DB 에 박는다.

create function public.ensure_gathering_leader(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur uuid;
  nxt uuid;
begin
  select leader_id into cur from public.gatherings where id = p_id;
  -- 가드: 모임이 이미 없다. 모임 삭제 → 참여 cascade → 아래 트리거가 여길 다시 부른다.
  if not found then return; end if;

  -- 현재 리더가 유효하면(살아 있고 아직 참가자면) 손대지 않는다.
  -- 남이 나갔을 때도 이 트리거가 돌기 때문에 이 조기 반환이 대부분의 호출을 처리한다.
  if cur is not null
     and exists (select 1 from auth.users u where u.id = cur)
     and exists (select 1 from public.gathering_participants gp
                  where gp.gathering_id = p_id and gp.user_id = cur)
  then return; end if;

  -- 가장 먼저 들어온 참가자에게 넘긴다.
  -- ⚠️ auth.users 존재 확인이 핵심이다. admin 이 사용자를 지우면 FK 액션 두 개가 같은 문장에서
  --    발동한다 — gatherings.leader_id → set null, gathering_participants.user_id → cascade.
  --    둘의 순서는 보장되지 않는다. gatherings 가 먼저면 이 시점에 지워지는 중인 사람의
  --    참가자 행이 아직 살아 있어서, 하필 그 사람을 새 리더로 승격시킨다.
  select gp.user_id into nxt
    from public.gathering_participants gp
   where gp.gathering_id = p_id
     and exists (select 1 from auth.users u where u.id = gp.user_id)
   order by gp.created_at
   limit 1;

  if nxt is null then
    -- 아무도 안 남았다 = "이 모임 안 함"이지 "이 모임 없었음"이 아니다.
    -- 삭제하면 후기까지 증발한다. 종료로 남긴다.
    update public.gatherings
       set leader_id = null, ended_at = coalesce(ended_at, now())
     where id = p_id;
  else
    update public.gatherings set leader_id = nxt where id = p_id;
  end if;
end $$;

revoke all on function public.ensure_gathering_leader(uuid) from public, anon, authenticated;

-- 경로 1: 나가기
create function public.on_participant_left()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.ensure_gathering_leader(old.gathering_id);
  return null;
end $$;

create trigger gathering_participant_left
  after delete on public.gathering_participants
  for each row execute function public.on_participant_left();

-- 경로 2: 계정 삭제로 leader_id 가 null 이 됐을 때.
-- when 조건의 is distinct from 이 재귀를 끊는다 — 위 함수가 leader_id 를 다시 쓰지만
-- null → null 은 distinct 가 아니라 두 번째로는 발동하지 않는다.
create function public.on_leader_vacated()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.ensure_gathering_leader(new.id);
  return null;
end $$;

create trigger gathering_leader_vacated
  after update of leader_id on public.gatherings
  for each row
  when (new.leader_id is null and old.leader_id is not null)
  execute function public.on_leader_vacated();

-- ─────────────────────────────────────────────
-- 5. RPC — 컬럼을 좁혀야 하는 쓰기
-- ─────────────────────────────────────────────
-- RLS 는 행만 막고 컬럼은 못 막는다. gatherings UPDATE 를 참가자에게 열면 place_name 만이 아니라
-- 제목·kind·ended_at 까지 바꿀 수 있다 — 남의 모임을 임의로 종료시킬 수 있다는 뜻이다.
-- 그래서 UPDATE 정책은 리더로 잠근 채 두고, 좁은 쓰기는 함수 본문이 컬럼을 물리적으로 한정한다.

create function public.update_gathering_place(p_gathering_id uuid, p_place text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.gathering_participants
                  where gathering_id = p_gathering_id and user_id = auth.uid())
  then raise exception '참가자만 장소를 수정할 수 있습니다'; end if;

  update public.gatherings
     set place_name = p_place,
         place_updated_by = auth.uid(),
         place_updated_at = now()
   where id = p_gathering_id;
end $$;

-- 위임. gatherings 의 update 정책이 with check (leader_id = auth.uid()) 로 잠겨 있어
-- 일반 UPDATE 로는 넘길 수 없다(옛 스키마가 의도적으로 막아둔 것을 그대로 유지한다).
-- 여기서만 뚫되, 넘겨받는 사람이 참가자인지 검사한다 —
-- 안 그러면 리더가 아무 uuid 로 던져놓고 모임을 유기할 수 있다.
create function public.transfer_gathering_leader(p_gathering_id uuid, p_new_leader uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.gatherings
                  where id = p_gathering_id and leader_id = auth.uid())
  then raise exception '리더만 위임할 수 있습니다'; end if;

  if not exists (select 1 from public.gathering_participants
                  where gathering_id = p_gathering_id and user_id = p_new_leader)
  then raise exception '참가자에게만 위임할 수 있습니다'; end if;

  update public.gatherings set leader_id = p_new_leader where id = p_gathering_id;
end $$;

grant execute on function public.update_gathering_place(uuid, text)      to authenticated;
grant execute on function public.transfer_gathering_leader(uuid, uuid)   to authenticated;

-- ─────────────────────────────────────────────
-- 6. RLS
-- ─────────────────────────────────────────────
alter table public.gathering_categories   enable row level security;
alter table public.gatherings             enable row level security;
alter table public.gathering_participants enable row level security;
alter table public.gathering_reviews      enable row level security;

-- 카테고리: 멤버 누구나 만든다(소모임 개설과 같은 문턱).
-- update·delete 정책은 주지 않는다 — 남이 쓰고 있는 카테고리를 만든 사람이 지우거나
-- 이름을 바꾸면 그 카테고리를 단 소모임들이 통째로 흔들린다. 만들면 남는다.
-- 안 쓰이는 카테고리는 필터 칩에서 저절로 빠지므로 지울 이유도 없다.
create policy "gathering categories read" on public.gathering_categories
  for select to authenticated using (true);

create policy "gathering categories insert member" on public.gathering_categories
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (select 1 from public.user_profiles p where p.id = auth.uid())
  );

-- 멤버 판별: user_profiles 행이 있으면 멤버다.
-- 익명 게스트도 authenticated 롤을 받으므로 to authenticated 만으로는 부족하다.

create policy "gatherings read" on public.gatherings
  for select to authenticated using (true);

create policy "gatherings insert member" on public.gatherings
  for insert to authenticated
  with check (
    leader_id = auth.uid()
    and exists (select 1 from public.user_profiles p where p.id = auth.uid())
  );

-- with check 에도 leader_id = auth.uid() 를 유지한다. 위임은 RPC 로만 한다.
create policy "gatherings update leader" on public.gatherings
  for update to authenticated
  using (leader_id = auth.uid())
  with check (leader_id = auth.uid());

create policy "gatherings delete leader" on public.gatherings
  for delete to authenticated
  using (leader_id = auth.uid());

-- 참여 조회는 열어 둔다. "본인 것만" 패턴을 복사하면 참여자 아이콘에 자기만 보인다.
create policy "gathering participants read" on public.gathering_participants
  for select to authenticated using (true);

create policy "gathering participants insert own" on public.gathering_participants
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.user_profiles p where p.id = auth.uid())
    and exists (select 1 from public.gatherings g
                 where g.id = gathering_id and g.closed_at is null and g.ended_at is null)
  );

-- 나가기는 언제든 된다. 마감 후에도.
--
-- 옛 스키마는 마감 후 탈퇴를 막았다. 근거는 "마감이 정산 명단을 확정한다"였다.
-- 그 근거가 없어졌다 — 정산(3단계)은 청구할 사람을 건별로 선택해서 자기 명단을 갖는다.
-- 정산이 스냅샷을 뜨면 나중에 누가 나가든 정산은 유지되므로, 사람을 붙잡아 둘 이유가 없다.
--
-- 챌린지에서는 원래부터 성립하지 않았다. 무기한 모임에 명단을 확정할 시점이 없고,
-- 3월에 마감해도 7월 유니폼 정산의 명단이 되지 못한다 — 그 사이 사람이 바뀐다.
-- 마감을 막아도 정산은 안 지켜지고 감옥만 남았다.
--
-- 마감에 남은 뜻은 양쪽 다 "신청 그만 받기" 하나뿐이고, 그건 나가기를 막을 근거가 아니다.
create policy "gathering participants delete own" on public.gathering_participants
  for delete to authenticated
  using (user_id = auth.uid());

-- update 정책은 주지 않는다. 참여는 있거나(insert) 없거나(delete) 둘 뿐이다.
-- 리더 자리를 gathering_participants.role 로 만들지 않은 이유도 이것이다 —
-- update 를 열면 RLS 가 컬럼을 못 막아 참가자가 자기 role 을 리더로 올릴 수 있다.

-- 후기: 참가자만 쓴다. 조회는 열려 있고, 수정·삭제는 본인 것만.
create policy "gathering reviews read" on public.gathering_reviews
  for select to authenticated using (true);

-- ⚠️ 서브쿼리 안에서 gathering_id 를 수식 없이 쓰면 안 된다. gathering_participants 에 같은 이름의
--    컬럼이 있어서 안쪽 스코프가 이긴다 — gp.gathering_id = gp.gathering_id 라는 항등식이 되고,
--    정책이 "아무 모임에나 참가자면 통과"로 무너진다. 바깥 테이블을 명시적으로 수식한다.
--    (위 participants insert 정책은 서브쿼리가 gatherings g 라 같은 이름이 없어서 무사하다.)
create policy "gathering reviews insert participant" on public.gathering_reviews
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.gathering_participants gp
                 where gp.gathering_id = gathering_reviews.gathering_id
                   and gp.user_id = auth.uid())
  );

create policy "gathering reviews update own" on public.gathering_reviews
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "gathering reviews delete own" on public.gathering_reviews
  for delete to authenticated
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 7. Realtime
-- ─────────────────────────────────────────────
alter publication supabase_realtime add table public.gatherings;
alter publication supabase_realtime add table public.gathering_participants;
alter publication supabase_realtime add table public.gathering_reviews;
-- 카테고리도 넣는다. 누가 새 카테고리를 만들면 다른 사람 개설 화면의 목록에 바로 떠야 한다.
alter publication supabase_realtime add table public.gathering_categories;
