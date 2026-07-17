# 기능 진행 상태

2026-07-17 / `redesign/wanted-ds` 브랜치 기준. 코드를 읽어 확인한 사실만 적었습니다.

## ⚠ 지금 진행 중: 원티드 디자인 시스템 전면 개편

**앱이 지금 어중간한 상태입니다.** 기능(훅·쿼리·RLS)은 두고 시각 레이어만 원티드 디자인
시스템으로 갈아엎는 중인데, 토큰·프리미티브와 **소모임 화면 하나만** 넘어갔습니다.

디자인 룰·토큰·측정값은 전부 [design.md](design.md)에 있습니다. **화면을 손대기 전에 먼저 보세요.**

> 앞서 있던 "라이트 리디자인 3단계"는 이 작업에 흡수되어 **폐기**됐습니다. 그때 쓰던
> 카테고리 틴트(teal/pink/amber)·액센트 퍼플은 더 이상 없습니다.

### ⚠ 지금 앱에 내비게이션이 없습니다

`Layout`이 탭바를 렌더하지 않습니다. 새 탭바가 **떠 있는 글래스 캡슐**이라 옛 `sticky`
탭바와 레이아웃이 달라, 옛것을 걷어내고 새것은 아직 안 붙인 상태입니다.

즉 **로그인하면 `/home`에 떨어지고 거기 빠른 메뉴 말고는 이동할 방법이 없습니다.**
`BottomNav.tsx`는 남아 있지만 `DevPreviewPage`만 import 합니다 — 실제 앱에서는 죽은 코드입니다.

이건 버그가 아니라 작업 중간 상태입니다. 탭바를 붙이면 풀립니다.

### 화면 진행

| 화면 | 상태 |
| --- | --- |
| 소모임 목록 · 상세 · 개설(3단계 페이지) · 카테고리 시트 | **완료** |
| `ui/` 프리미티브 6종 + `BackButton` | **완료** |
| 나머지 전부 | 대기 |

### 소모임 2단계 — DB 적용 완료 (2026-07-17)

소모임이 **성격(원데이/챌린지) · 카테고리(멤버가 직접 만듦) · 썸네일 · 리더 위임 · 후기**로 확장됐습니다.
설계 근거는 전부 [data-model.md](data-model.md#소모임-마이그레이션-있음--근거-20260717000000_gatherings_v2sql)에 있습니다.

`20260717000000_gatherings_v2.sql` 을 **원격에 적용했습니다.** `migration list` 기준 로컬 10 개가
원격과 모두 일치하고 `db push --dry-run` 이 "up to date" 입니다. 드롭 대상이던 옛 `gatherings` ·
`gathering_participants` 에 실데이터가 없다는 건 push 전에 대시보드에서 확인했습니다.
`events_v2` 는 이미 적용돼 있어 push 목록에 끼지 않았습니다 — 행사 데이터는 무사합니다.

> **앞으로 `db push` 할 때도 `--dry-run` 을 먼저 보세요.** 이 저장소에는 `drop cascade` 후
> 재생성하는 파괴적 마이그레이션이 둘(`events_v2` · `gatherings_v2`) 있습니다. 이미 적용됐으니
> 정상이라면 목록에 안 뜨지만, 뜬다면 **데이터가 날아간다는 신호**입니다.

#### DB 비밀번호 다루는 법

`db push`·`db pull` 은 `SUPABASE_DB_PASSWORD` 를 요구합니다. `.env.local` 에 있습니다
(`.gitignore` 의 `.env*` 에 걸려 커밋되지 않습니다). **셸이 읽어서 CLI 에 넘기는 이 패턴으로만**
씁니다:

```bash
set -a; . ./.env.local; set +a; npx supabase db push --dry-run
```

⚠️ **파일을 열거나 값을 출력하지 마세요** — `cat`·`echo`·에디터·`set -x` 전부. 값이
파일 → 셸 → supabase 프로세스로만 흐르면 어디에도 안 남지만, 한 번이라도 출력하면 프로덕션 DB
평문 비밀번호가 터미널 기록·에이전트 대화 로그에 남습니다. 안전하게 둔 걸 꺼내서 덜 안전한 곳에
복사하는 셈입니다. AI 에이전트에게 시킬 때 특히 그렇습니다 — 컨텍스트가 요약되고 저장됩니다.

적용 후 **소모임 화면 동작을 직접 확인했습니다** — 개설·참여·후기가 새 스키마 위에서 돕니다.

다만 **자동 테스트는 없습니다.** 아래 둘은 사람 손으로 만들기 어려운 경로라 아직 실제로 밟힌
적이 없을 수 있습니다. 나중에 이상하면 여기부터 의심하세요.

- **리더 승계 트리거** — 리더가 모임을 나가거나 admin 이 계정을 지울 때 도는데, 후자는 FK 액션
  두 개(`set null` · `cascade`)의 순서가 보장되지 않는 경합 위에 있습니다.
- **재귀 차단** — `gathering_leader_vacated` 의 `when` 조건이 끊습니다. 조건을 손대면 무한 재귀입니다.

(로컬 `supabase db reset` 은 못 돌립니다 — 이 작업 환경에 psql/Docker 가 없습니다.)

> **push 전에 후기 INSERT 정책 버그를 하나 고쳤습니다.** 서브쿼리 안에서 `gathering_id` 를
> 수식 없이 쓰고 있었는데, `gathering_participants` 에 같은 이름의 컬럼이 있어 안쪽 스코프가
> 이깁니다 — `gp.gathering_id = gp.gathering_id` 라는 항등식이 되어 정책이 "아무 모임에나
> 참가자면 통과"로 무너집니다. `gathering_reviews.gathering_id` 로 수식해서 고쳤습니다.
> **RLS 서브쿼리에서 바깥 컬럼은 항상 테이블명으로 수식하세요.** 바로 위 participants insert
> 정책이 무사한 건 서브쿼리가 `gatherings g`(컬럼명이 `id`)라 이름이 겹치지 않아서일 뿐입니다.

아직 UI 가 없는 것:

- **리더 위임** — `transfer_gathering_leader` RPC 와 [`useTransferGatheringLeader`](../src/hooks/useGatheringRpc.ts)는 있는데 참가자 고르는 화면이 없습니다.
- **종료·삭제** — `ended_at` 컬럼과 정책은 있는데 리더가 누를 버튼이 없습니다. 삭제 확인 다이얼로그는 "참여자 N명, 후기 M개가 함께 삭제됩니다"를 보여줘야 합니다(후기 CASCADE).
- **후기 수정** — [`useUpdateReview`](../src/hooks/useGatheringReviews.ts)는 있고 화면은 삭제만 붙었습니다.

남은 화면을 잔재가 많은 순으로. 숫자는 아래 두 패턴의 매치 수라 대략의 규모로만 보세요.

| 파일 | 옛 토큰 | 다크 잔재 |
| --- | --- | --- |
| `admin/event/EventBuilderPage` | 32 | — |
| `event/EventTimelinePage` | 27 | — |
| `admin/event/EventSegmentsPage` | 24 | — |
| `bill/BillFormPage` | — | 22 |
| `admin/AdminPage` | — | 16 |
| `event/EventListPage` | — | 13 |
| `components/EventInfoView` | — | 11 |
| `HomePage` | 11 | — |
| `worship/WorshipSchedulePage` | — | 9 |
| `MemberProfileSetupPage` | — | 8 |
| `ConfirmDialog` | 5 | — |
| `ProfilePage` · `components/worship/PositionSlot` | — | 각 5 |
| `auth/MemberLoginPage` | 4 | — |
| `event/EventInfoPage` | — | 3 |
| `auth/GatePage` · `LoadingSpinner` · `BottomNav` · `BackButton` | 각 2 | — |
| `LoadingScreen` · `admin/event/EventDetailPage` · `main.tsx` | 각 1 | 각 1 |

**두 종류가 섞여 있습니다.** 다크 잔재는 폐기된 다크 재디자인의 하드코딩 hex라 흰 배경에서
안 보이거나 뒤집혀 보입니다. 옛 토큰은 그 다음 라이트 리디자인의 것이라 보이긴 합니다.

```bash
# 다크 잔재
grep -rnE "#f0f2f8|#8892a0|#6b7785|#0f1117|#4a5568|#c0c8d4|#363d47|rgba\(255,\s*255,\s*255,\s*0\.|colorScheme:\s*\"dark\"" src/

# 옛 토큰
grep -rnE "text-fg|bg-card|bg-surface|bg-sunken|text-accent|bg-accent|rounded-tile|rounded-panel|shadow-card|shadow-lift|shadow-accent|text-caption[^0-9]|text-body[^0-9]|text-heading|text-emphasis|text-micro|text-title[^0-9]|text-display|text-info|text-danger|text-success|border-line[^-]|bg-inverse" src/
```

`index.css`의 17건은 폐기 예정 블록 자체라 오탐입니다. `nav/creatures.tsx`의 다크 매치 한 건은
주석이라 오탐입니다.

### 옛 토큰 블록 지우는 법

`@theme` 안에 폐기 예정 블록이 남아 있습니다. 화면을 새로 그릴 때마다 하나씩 걷어내고
마지막 페이지가 끝나면 블록째 지웁니다.

⚠ **토큰을 지워도 빌드는 통과합니다.** Tailwind 가 클래스를 조용히 안 만들 뿐이라 화면이
무스타일로 뜹니다. 그래서 한 번에 못 지우고 페이지 단위로 옮깁니다.

⚠ **그 블록이 파일 뒤쪽이라 새 토큰을 덮을 수 있습니다.** 실제로 옛 `--radius-card`(20)가
새 값(16)을 덮고 있었습니다. 같은 이름을 양쪽에 두지 마세요.

## 화면 확인하는 법

바꾼 화면은 눈으로 확인할 수 있습니다. **Claude in Chrome** 확장이 연결돼 있으면 스크린샷이
되고, 로그인된 세션을 그대로 쓰므로 보호된 화면도 보입니다. 앱 안의 브라우저 도구로
`localhost:5173` 을 직접 열어도 됩니다.

반대로 게이트·로그인은 **로그인돼 있으면** 홈으로 리다이렉트돼 볼 수 없습니다. 방향이 반대인
두 문제라 개발 전용 미리보기를 뒀습니다 — [`src/pages/dev/DevPreviewPage.tsx`](../src/pages/dev/DevPreviewPage.tsx)가
`main.tsx`에서 앱 라우터 **대신** 마운트되고, `authStore`와 쿼리 캐시를 원하는 상태로 꾸며
띄웁니다. `import.meta.env.DEV` 게이트라 프로덕션 번들에는 들어가지 않습니다.

현재 화면: `nav` · `gate` · `login` · `home` · `home-empty` · `gatherings` · `segments` ·
`builder` · `timeline`. 경로 없이 `/__dev/`로 가면 목록이 뜹니다.

목 데이터를 추가할 때 주의할 점 셋:

- **`Seed`가 `staleTime: Infinity`를 같이 박는 게 핵심입니다.** 캐시에 심기만 하면, 훅에
  `staleTime`이 없는 쿼리(`useEventList`)는 마운트하자마자 재조회하고 로그인이 없어
  **빈 배열이 성공으로** 돌아오면서 목 데이터를 조용히 덮어씁니다. 화면이 계속 "빈 상태"로
  보이면 십중팔구 이겁니다.
- **화면이 읽는 쿼리를 다 심어야 합니다.** 소모임 화면은 홈을 흡수하면서 행사도 읽는데,
  소모임만 심어두면 "다가오는 행사" 카드가 조용히 안 뜹니다.
- 상대 시각 데이터(소모임 `gathering_at`, 행사 `event_date`/`start_time`)는 **오늘 기준으로
  만드세요.** 고정 날짜로 두면 시간이 지나 전부 "종료"로 굳습니다.
- `useParams`로 `:id`를 읽는 페이지(행사 3종)는 `MemoryRouter` 안에 **`Routes`/`Route`까지**
  세워야 합니다. `initialEntries`만 주면 params가 빈 객체입니다.

**스크린샷 함정 둘**:

1. 화면마다 등장 애니메이션(`initial={{ opacity: 0 }}`)이 있어 **첫 장이 빈 화면·반투명으로
   찍힙니다.** 한 번 더 찍으세요. 빈 화면을 보고 "렌더가 안 된다"고 진단하지 마세요.
2. 창 크기가 스크린샷 사이에 바뀔 수 있습니다. 클릭 좌표는 **바로 직전 장** 기준으로 잡으세요.
   요소 참조(`read_page` → `ref`)나 셀렉터로 누르는 게 더 안전합니다.

**DOM 을 잴 때 함정 하나 더**: 상태가 바뀐 직후 값을 읽으면 React 커밋 전이거나
`transition-colors` 전환 중이라 **옛 값이 잡힙니다.** 실제로 에러 테두리를 버그로 오진할
뻔했습니다. 넉넉히 기다리고 재세요.

## 기능별 상태

| 기능 | 상태 | 근거 |
| --- | --- | --- |
| 인증 (멤버/게스트/관리자) | 동작 | `authStore` + `ProtectedRoute` |
| 영수증 비용 청구 | 동작 | `/member/bill` → `BillFormPage` |
| 행사 (타임라인) | 동작 | 참여자·관리자 라우트 모두 연결됨 |
| 소모임 | **2단계 동작** | 개설·참여·후기·카테고리 생성까지 확인. 리더 위임·종료·후기 수정은 훅만 있고 UI 부재(위 참고). 사진·정산·템플릿은 미착수 |
| 찬양팀 일정 | 동작 | `/worship`, Realtime 반영 |
| 하단 탭바 | **없음** | 위 참고. 글래스 캡슐로 재구현 예정 |
| 순서별 평가 | **폐기** | 아래 참고 |
| 갤러리 | **폐기** | 준비 중 안내만 렌더하던 빈 껍데기라 삭제 |
| 회계 리포트 | **폐기** | 아래 참고 |
| 통계 | 라우트 제거됨 | 커밋 `d6134e7` |
| 메뉴판 → Claude 메뉴 추출 | **코드 없음** | 의존성까지 제거함 |
| 게스트 청구 폼 | **없음** | `/guest/form` 라우트 부재 |
| 웹 푸시 알림 | 미구현 | 관련 코드 없음 |

## 폐기된 기능

### 순서별 평가

**UI 는 원래 없었습니다.** `EventTimelinePage`에 평가 화면이 없는데 훅(`useEventTimeline`,
`useEventResults`)과 타입만 남아 있었고, 유일한 소비자였던 `EventResultsPage`는 라우터에
연결조차 안 돼 있었습니다. 이 문서가 오래도록 "타임라인 + 평가 동작"이라고 적어둔 건
**사실이 아니었습니다.**

훅·타입·`lib/mood`·`MoodRating`·`results_public` 플래그를 전부 정리했습니다.
**`segment_evaluations` 테이블과 Realtime 퍼블리케이션은 DB 에 그대로 있습니다** —
되살릴 일이 없다면 마이그레이션으로 정리하는 게 맞습니다.

### 회계 리포트

세 페이지와 훅 둘이 있었지만 라우터에 없었고, **쿼리하던 `accounting_*` 테이블이 원격 DB 에
존재하지 않았습니다**(대신 `finance_*` 가 있어 이름이 바뀐 뒤 코드가 안 따라간 것으로 보입니다).
게다가 iOS 앱으로 이관 예정이라 웹에서 되살릴 계획이 없어 삭제했습니다.
관리자 페이지의 "회계 장부 관리" 항목은 누르면 준비 중 안내만 뜹니다.

## 미연결(고아) 코드

- **`/home` · `/admin` 라우트** — 살아 있지만 탭바가 없어 UI 로 닿을 수 없습니다. `/home`은
  로그인 착지점이라 그나마 보이고, `/admin`은 진입로가 없습니다. 홈은 소모임에 흡수될
  예정이고(행사 카드는 이미 옮겼습니다) 관리자는 내정보에서 진입시킬 계획입니다.
- **`BottomNav.tsx`** — `DevPreviewPage`만 씁니다.
- `event_participants` 테이블 — "내 일정에 추가"용으로 만들었으나 조회하는 코드가 없습니다.

## 알려진 정리 대상

- **마이그레이션 공백** — 행사·소모임 외 테이블에 마이그레이션이 없습니다.
  `npx supabase db pull`로 메울 수 있습니다. ([data-model.md](data-model.md))
- **Worker 인증 없음** — `/upload`, `/delete`가 무인증에 `Allow-Origin: *`입니다.
  URL만 알면 누구나 업로드·삭제할 수 있습니다.
- **`worship_availability` RLS** — 로그인한 누구나 남의 참여 행을 수정할 수 있습니다. 다만 이
  느슨함을 "교체" 기능이 쓰고 있어 그냥 지우면 깨집니다.
  ([data-model.md](data-model.md#-알려진-구멍-worship_availability))
- **`line-solid` 대비 1.19** — 인풋 테두리가 흰 면에서 거의 안 보입니다(WCAG 1.4.11 은 3:1
  요구). 원티드 원본값이라 미해결로 뒀습니다. ([design.md](design.md))
- **`event_date`가 text** — 날짜 정렬·필터를 DB 에 맡길 수 없고 파싱이 `parseStartDate()`에
  의존합니다.
- **린트 4건** — `ConfirmDialog`·`main.tsx`·`EventBuilderPage`에 있으며 리디자인 이전부터
  있던 것들입니다(`npm run lint`).
