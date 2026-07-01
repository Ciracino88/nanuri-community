-- 행사 배너 이미지(상세 헤더용)를 포스터와 별도로 저장
alter table events add column if not exists banner_url text;
