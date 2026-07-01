-- 행사 v2: 정보 상세(이모지·상세표) + "내 일정에 추가"(참여) 도입
--
-- ⚠️ 기존 행사 데이터를 전부 리셋합니다 (테스트 데이터 전제).
-- 흐름: 행사 목록 → 상세(정보+상세표+내 일정에 추가) → 참여자 평가 타임라인

-- ─────────────────────────────────────────────
-- 0. 리셋
-- ─────────────────────────────────────────────
drop table if exists public.segment_evaluations cascade;
drop table if exists public.event_participants   cascade;
drop table if exists public.event_segments       cascade;
drop table if exists public.events               cascade;

-- ─────────────────────────────────────────────
-- 1. 행사
-- ─────────────────────────────────────────────
create table public.events (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  event_date     date not null,
  start_time     time,                              -- 모이는 시각 (순서 시작 시각 계산 기준)
  place_name     text,
  image_url      text,                              -- 포스터
  emoji          text,                              -- 대표 이모지 (프리셋에서 선택, 없으면 폴백)
  description    text,                              -- 한 줄/짧은 설명
  details        jsonb not null default '[]'::jsonb, -- 상세표: [{ "label": "대상", "value": "전교인" }, ...]
  results_public boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. 행사 순서 (타임라인)
-- ─────────────────────────────────────────────
create table public.event_segments (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  duration_min int  not null default 30,            -- 소요 시간(분)
  title        text not null,
  description  text,
  sort         int  not null default 0,
  created_at   timestamptz not null default now()
);

create index event_segments_event_id_idx on public.event_segments (event_id, sort);

-- ─────────────────────────────────────────────
-- 3. 내 일정에 추가 (참여)
-- ─────────────────────────────────────────────
create table public.event_participants (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)                        -- 한 사람이 한 행사에 한 번만
);

create index event_participants_user_idx  on public.event_participants (user_id);
create index event_participants_event_idx on public.event_participants (event_id);

-- ─────────────────────────────────────────────
-- 4. 순서별 평가 (익명 닉네임)
-- ─────────────────────────────────────────────
create table public.segment_evaluations (
  id          uuid primary key default gen_random_uuid(),
  segment_id  uuid not null references public.event_segments(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  nickname    text,
  mood        smallint,          -- 1 불만족 / 2 평범 / 3 만족
  comment     text,
  created_at  timestamptz not null default now(),
  unique (segment_id, user_id)
);

create index segment_evaluations_segment_id_idx on public.segment_evaluations (segment_id);

-- ─────────────────────────────────────────────
-- 5. RLS
-- ─────────────────────────────────────────────
alter table public.events              enable row level security;
alter table public.event_segments      enable row level security;
alter table public.event_participants  enable row level security;
alter table public.segment_evaluations enable row level security;

-- 행사·순서: 누구나 조회, 변경은 관리자
create policy "events read"   on public.events         for select using (true);
create policy "segments read" on public.event_segments for select using (true);

create policy "events admin write" on public.events
  for all to authenticated
  using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "segments admin write" on public.event_segments
  for all to authenticated
  using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- 참여: 본인 것만 조회/추가/삭제
create policy "participants read own"   on public.event_participants
  for select to authenticated using (user_id = auth.uid());
create policy "participants insert own" on public.event_participants
  for insert to authenticated with check (user_id = auth.uid());
create policy "participants delete own" on public.event_participants
  for delete to authenticated using (user_id = auth.uid());

-- 평가: 로그인 사용자 제출/조회, 본인 것만 수정
create policy "evaluations insert" on public.segment_evaluations
  for insert to authenticated with check (true);
create policy "evaluations read"   on public.segment_evaluations
  for select to authenticated using (true);
create policy "evaluations update own" on public.segment_evaluations
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 6. Realtime
-- ─────────────────────────────────────────────
alter publication supabase_realtime add table public.segment_evaluations;
alter publication supabase_realtime add table public.event_segments;
alter publication supabase_realtime add table public.event_participants;
