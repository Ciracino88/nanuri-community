-- user_profiles 권한 강화
--
-- 배경: 2026-07-16 점검에서 확인된 두 가지 문제.
--
--   1) 자가 권한 승격 — 아무 멤버나 자기 행의 role 을 'admin' 으로 바꿔 관리자가 될 수 있었다.
--      "본인 프로필 수정" 정책이 자기 행 수정을 허용하고(auth.uid() = id),
--      authenticated 에 role 컬럼 UPDATE 권한이 있고, 막는 트리거가 없었다.
--      RLS 는 행만 막고 컬럼은 막지 못한다.
--      events·bills 의 admin 정책이 전부 이 컬럼을 신뢰하므로 관리자 체계 전체가 무력화됐다.
--
--   2) 계좌·연락처 노출 — "로그인 유저 프로필 조회" 정책이 qual = true 라
--      로그인한 누구나 전원의 account_number·bank_name·phone 을 읽을 수 있었다.
--      익명 게스트도 포함된다 (Supabase 익명 로그인은 authenticated 롤을 받는다).
--
-- 주의: user_profiles 에는 테이블 단위 권한(arwdDxtm)이 부여돼 있다.
--       테이블 단위 권한은 모든 컬럼을 포함하므로 컬럼 단위 REVOKE 는 조용히 무시된다.
--       반드시 테이블 단위로 회수한 뒤 컬럼별로 다시 부여해야 한다.

-- ─────────────────────────────────────────────
-- 1. 자가 권한 승격 차단
-- ─────────────────────────────────────────────
revoke insert, update on public.user_profiles from anon, authenticated;

-- role·officer_role 을 뺀 나머지만 재부여.
-- id 는 upsert(ON CONFLICT DO UPDATE)가 갱신 대상에 포함시키므로 UPDATE 에도 필요하다.
-- "본인 프로필 수정" 정책의 검사식(auth.uid() = id)이 새 행에도 적용되므로
-- id 를 남의 것으로 바꾸는 건 여전히 차단된다.
grant insert (id, name, team, position, bank_name, account_number, phone, avatar_url)
  on public.user_profiles to authenticated;

grant update (id, name, team, position, bank_name, account_number, phone, avatar_url)
  on public.user_profiles to authenticated;

-- anon(미로그인)에는 재부여하지 않는다. 프로필 생성·수정은 로그인 후에만 일어난다.
-- role·officer_role 은 어느 롤에도 주지 않는다. 코드에서 이 두 컬럼을 쓰는 곳이 없고,
-- 역할 변경은 대시보드(postgres)에서 한다.

-- ─────────────────────────────────────────────
-- 2. 공개 프로필 뷰 (계좌 노출 차단의 준비 단계)
-- ─────────────────────────────────────────────
-- 이름·아바타는 서로 보여야 하므로(찬양팀 시트 등) 최소 컬럼만 뷰로 공개한다.
-- security_invoker = off (기본값) → 뷰가 소유자(postgres) 권한으로 실행되어
-- 밑단 RLS 를 우회하고, 노출 범위는 뷰의 컬럼 목록으로 제한된다.
-- account_number·bank_name·phone·role 은 뷰에 없으므로 조회 경로가 사라진다.
create or replace view public.public_profiles as
  select id, name, avatar_url, position, team
  from public.user_profiles;

alter view public.public_profiles set (security_invoker = off);

grant select on public.public_profiles to authenticated;

-- 여기까지는 전부 추가·축소만 하므로 현재 배포된 앱은 그대로 동작한다.
-- 실제 계좌 노출 차단(전체 조회 정책 제거)은 코드가 이 뷰를 쓰도록 배포된 뒤
-- 20260716010000_restrict_profile_select.sql 에서 한다.
