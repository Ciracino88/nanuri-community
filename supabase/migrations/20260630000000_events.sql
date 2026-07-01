-- 행사(이벤트) 기능: 타임라인 + 순서별 평가
-- 기존 설문(survey_*) 을 행사 모델로 대체하는 1단계 스키마
--
-- ⚠️ 주의: 아래 DROP 으로 기존 설문 데이터가 영구 삭제됩니다 (테스트 데이터 전제).

-- ─────────────────────────────────────────────
-- 0. 기존 설문 테이블 제거 (리셋)
-- ─────────────────────────────────────────────
drop table if exists public.survey_responses cascade;
drop table if exists public.surveys cascade;
drop table if exists public.survey_templates cascade;

-- ─────────────────────────────────────────────
-- 1. 행사
-- ─────────────────────────────────────────────
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  event_date  date not null,
  place_name  text,
  image_url   text,
  -- upcoming(예정) | live(진행 중) | done(종료) — 상태는 표시용, 평가 해금은 start_at 기준
  status      text not null default 'upcoming',
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. 행사 순서 (타임라인 한 칸)
-- ─────────────────────────────────────────────
create table if not exists public.event_segments (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  start_at    timestamptz not null,        -- 이 순서 시작 시각 (알림·평가 해금 기준)
  title       text not null,               -- 예: 예배, 점심 식사
  description text,
  sort        int  not null default 0,     -- 타임라인 정렬 순서
  created_at  timestamptz not null default now()
);

create index if not exists event_segments_event_id_idx
  on public.event_segments (event_id, sort);

-- ─────────────────────────────────────────────
-- 3. 순서별 평가 (익명 닉네임 방식 — 기존 survey_responses 와 동일)
-- ─────────────────────────────────────────────
create table if not exists public.segment_evaluations (
  id          uuid primary key default gen_random_uuid(),
  segment_id  uuid not null references public.event_segments(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,  -- 로그인 시 1인 1평가 dedup 용
  nickname    text,            -- 결과에 표시되는 익명 닉네임 (이름 노출 X)
  mood        smallint,        -- 1 불만족 / 2 평범 / 3 만족 (null = 코멘트만)
  comment     text,
  created_at  timestamptz not null default now(),
  -- 로그인 사용자는 순서당 1개만 (수정은 update). 비로그인(user_id null)은 중복 가능.
  unique (segment_id, user_id)
);

create index if not exists segment_evaluations_segment_id_idx
  on public.segment_evaluations (segment_id);

-- ─────────────────────────────────────────────
-- 4. RLS
-- ─────────────────────────────────────────────
alter table public.events             enable row level security;
alter table public.event_segments     enable row level security;
alter table public.segment_evaluations enable row level security;

-- 행사·순서: 누구나 조회(링크 공유), 변경은 관리자만
create policy "events read"   on public.events
  for select using (true);
create policy "segments read" on public.event_segments
  for select using (true);

create policy "events admin write" on public.events
  for all to authenticated
  using (exists (select 1 from public.user_profiles p
                 where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.user_profiles p
                      where p.id = auth.uid() and p.role = 'admin'));

create policy "segments admin write" on public.event_segments
  for all to authenticated
  using (exists (select 1 from public.user_profiles p
                 where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.user_profiles p
                      where p.id = auth.uid() and p.role = 'admin'));

-- 평가: 누구나 제출, 본인 것만 수정/삭제, 조회는 로그인 사용자(결과 집계)
create policy "evaluations insert" on public.segment_evaluations
  for insert to anon, authenticated
  with check (true);
create policy "evaluations read" on public.segment_evaluations
  for select to authenticated
  using (true);
create policy "evaluations update own" on public.segment_evaluations
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 5. Realtime (결과 실시간 집계 + 타임라인 갱신)
-- ─────────────────────────────────────────────
alter publication supabase_realtime add table public.segment_evaluations;
alter publication supabase_realtime add table public.event_segments;
