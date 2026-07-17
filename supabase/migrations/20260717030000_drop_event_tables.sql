-- 행사 테이블 정리.
--
-- 행사 기능(코드)은 8a5c1ac 에서 전부 제거됐다(docs/status.md '행사'). 읽고 쓰는 코드가
-- 없어져 이 테이블들은 남의 것도 아니고(웹 전용이었다) 다른 앱도 안 쓴다. 원격에 있던 9건은
-- 전부 테스트 데이터라 백업 없이 버린다.
--
-- event_segments 가 events 를 FK 로 참조하므로 자식부터 지운다. Realtime 퍼블리케이션에
-- 올라가 있었는데, drop 하면 Postgres 가 멤버십도 자동으로 뺀다.

drop table if exists public.event_segments cascade;
drop table if exists public.events cascade;
