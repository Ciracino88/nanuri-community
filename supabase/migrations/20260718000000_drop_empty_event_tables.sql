-- 비어 있는 옛 행사 테이블 정리.
--
-- event_budget_items · event_registrations 둘 다 행 0, 누적 insert/update/delete 0 이고
-- (2026-07-18 대시보드 pg_stat_user_tables 확인) 이 둘을 FK 로 참조하는 테이블도 없다.
-- 만들어만 두고 한 번도 안 쓴 빈 껍데기라 지운다.
--
-- ⚠ 같은 event_* 계열이라도 event_items(19행·계속 수정됨)·event_tasks(12행)는 남긴다 —
-- 살아있는 데이터가 있고, 이 저장소 코드가 안 쓸 뿐 다른 시스템(iOS 회계 앱으로 추정)이
-- 관리하는 것으로 보인다. bible_words(8172행)도 마찬가지로 남의 데이터라 안 건드린다.

drop table if exists public.event_budget_items;
drop table if exists public.event_registrations;
