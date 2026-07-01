-- 결과 공개 토글: 관리자가 켜면 참여자도 순서별 집계 결과를 볼 수 있음
-- 기본은 비공개(false). 접근 자체가 멤버 전용이라 공개 대상도 멤버로 한정됨.

alter table public.events
  add column if not exists results_public boolean not null default false;
