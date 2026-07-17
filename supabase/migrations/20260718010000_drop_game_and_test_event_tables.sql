-- 폐기된 게임 기능·테스트 행사 데이터 정리.
--
-- 소유주(저장소 오너) 확인:
--   • bible_words(8172행) — 예전 게임 기능용 데이터. 게임 기능이 폐기돼 더 안 쓴다.
--   • event_items(19행)·event_tasks(12행) — 전부 테스트 데이터. 날려도 된다.
--
-- 이 저장소 코드는 셋 다 참조하지 않는다(grep 0건). 계열의 빈 테이블
-- (event_budget_items·event_registrations)은 20260718000000 에서 이미 지웠다.
--
-- cascade 로 지운다 — 이 셋을 참조하는 FK·인덱스·정책이 있으면 함께 정리된다
-- (cascade 는 남의 테이블 '행'을 지우진 않고 의존 '객체'만 정리한다).

drop table if exists public.event_items cascade;
drop table if exists public.event_tasks cascade;
drop table if exists public.bible_words cascade;
