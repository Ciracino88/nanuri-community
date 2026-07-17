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
| 소모임 (+ 개설 시트) | **완료** |
| `ui/` 프리미티브 6종 | **완료** |
| 나머지 전부 | 대기 |

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
| 소모임(번개) | **1단계만 동작** | 개설·참여 토글·참여자 아이콘 realtime. 사진·정산·템플릿은 미착수 |
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
