-- 리디자인으로 폐기된 기능이 쓰던 죽은 테이블 정리.
--
-- 이 둘만 지운다. 원격에 안 쓰이는 테이블이 더 있지만(bible_words, event_budget_items,
-- event_items, event_registrations, event_tasks, finance_*), 성격이 다르다:
--   • finance_* 는 회계 데이터로 iOS 앱으로 이관 예정이다 — 웹이 안 쓸 뿐 남의 것이라 안 지운다.
--   • 나머지는 소유주·데이터가 불명이라(이 저장소 이전부터 원격에 존재) 대시보드로 행 수를
--     확인하기 전엔 손대지 않는다.
-- 아래 둘은 웹 전용이었고 폐기가 문서로 확정돼 있어서만 지운다.

-- 순서별 평가. UI 는 원래 없었고 훅·타입까지 리디자인에서 정리됐다. 이 테이블을 읽고 쓰는
-- 코드가 이제 없다(docs/status.md '폐기된 기능', docs/data-model.md). Realtime 퍼블리케이션에
-- 올라가 있었는데, drop 하면 Postgres 가 퍼블리케이션 멤버십도 자동으로 뺀다.
drop table if exists public.segment_evaluations cascade;

-- "내 일정에 추가"용으로 만들었으나 조회하는 코드가 한 번도 없었다(docs/status.md '미연결 코드').
drop table if exists public.event_participants cascade;
