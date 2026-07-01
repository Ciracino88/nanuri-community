-- 시간 모델 변경: 순서별 절대시각 → "모이는 시각 + 순서별 소요시간"
--
-- 이미 20260630000000_events.sql 를 적용한 DB 위에 변경분만 올리는 마이그레이션.
-- (테이블/RLS/Realtime 은 그대로 두고 컬럼만 조정 — 데이터 보존)

-- 1. events: 모이는 시각 추가
alter table public.events
  add column if not exists start_time time;

-- 2. event_segments: 절대시각(start_at) 제거 → 소요분(duration_min)
alter table public.event_segments
  drop column if exists start_at;

alter table public.event_segments
  add column if not exists duration_min int not null default 30;
