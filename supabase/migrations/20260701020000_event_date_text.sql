-- event_date를 문자열로 변경 (단일 "2021.05.20" / 기간 "2021.05.20~2021.05.22")
-- 상태·타임라인은 문자열에서 시작 날짜를 파싱해서 사용.

alter table public.events
  alter column event_date type text using to_char(event_date, 'YYYY.MM.DD');
