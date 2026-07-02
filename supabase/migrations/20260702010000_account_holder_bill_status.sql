-- 청구서 계좌 예금주(폼에서 입력·프로필 저장)
alter table user_profiles add column if not exists account_holder text;

-- 청구서 상태(승인/대기 등) — 웹은 읽기만, 승인 처리는 네이티브 admin 앱
alter table bills add column if not exists status text default '대기';
