-- 모집 마감 개념을 DB 로 못 박는다 (코드 정의는 b9e5bd9 에서 정리됨).
--
-- 상태는 open · done 둘뿐이고, "모집 마감"은 별도 상태가 아니라 성격(kind)이 알아서 정한다:
--   - 원데이:  모집 마감 = gathering_at. 지나면 done 이라 가입이 저절로 닫힌다.
--   - 챌린지:  자유 가입/탈퇴라 마감 개념 자체가 없다. done(ended_at) 전까지 늘 열려 있다.
--
-- 이 마이그레이션이 하는 두 가지:
--
-- 1) closed_at 컬럼 삭제
--    옛 "참여 신청 마감" 컬럼. 늘 null 이라 실제로 뜬 적이 없고 어떤 코드도 읽지 않는다.
--    정산이 건별 스냅샷을 뜨므로 명단을 얼릴 이유가 사라졌다(data-model.md 참여 정책 참고).
--
-- 2) 원데이 가입 마감을 RLS 로 강제
--    지금까지 원데이 가입 마감은 UI 에서만 막았다(시각 지나면 done 이라 버튼이 사라짐).
--    가입 insert 정책은 ended_at 만 봐서, 시각이 지난 원데이도 DB 는 여전히 insert 를 허용했다.
--    정책에 (kind = 'challenge' or gathering_at > now()) 가드를 더해 DB 로 못 박는다.

-- 정책이 closed_at 을 참조하므로 컬럼을 지우기 전에 먼저 재생성한다.
drop policy "gathering participants insert own" on public.gathering_participants;

create policy "gathering participants insert own" on public.gathering_participants
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.user_profiles p where p.id = auth.uid())
    and exists (
      select 1 from public.gatherings g
       where g.id = gathering_id
         and g.ended_at is null
         -- 원데이는 모이는 시각 전까지만, 챌린지는 언제든 (done 전까지).
         and (g.kind = 'challenge' or g.gathering_at > now())
    )
  );

alter table public.gatherings drop column closed_at;
