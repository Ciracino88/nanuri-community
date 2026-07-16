-- 프로필 전체 조회 차단 (계좌·연락처 노출 마무리)
--
-- ⚠️ 선행 조건: useWorshipSchedule 이 public_profiles 뷰를 읽도록 바뀐 코드가 **배포된 뒤**에 적용할 것.
--    배포 전에 적용하면 찬양팀 시트에서 본인 아이콘만 보인다(타인 프로필이 안 읽힘).
--    뷰와 권한은 20260716000000_harden_user_profiles.sql 에서 이미 만들어 둔다.
--
-- 이 정책이 qual = true 라서 로그인한 누구나(익명 게스트 포함) 전원의
-- account_number·bank_name·phone 을 읽을 수 있었다.
-- 제거하면 "본인 프로필 조회"(auth.uid() = id) 만 남아 자기 행만 보이고,
-- 이름·아바타는 public_profiles 뷰로만 나간다.

drop policy if exists "로그인 유저 프로필 조회" on public.user_profiles;
