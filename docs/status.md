# 기능 진행 상태

2026-07-17 / `f7f4740` 기준. 코드를 읽어 확인한 사실만 적었습니다.

## ⚠ 지금 진행 중: 라이트 전면 리디자인 (3단계)

**앱이 지금 어중간한 상태입니다.** 다크 재디자인을 폐기하고 라이트로 전면 개편하는 중인데, 토큰·공용 컴포넌트와 9개 화면만 라이트로 넘어갔고 **나머지 페이지는 아직 다크 하드코딩이 남아 있습니다.** 흰 배경 위에 안 보이는 흰 글래스 버튼, 흰 배경에 흰 글자 같은 게 보이면 버그가 아니라 이 작업의 잔재입니다.

| 단계 | 상태 |
| --- | --- |
| 1. 디자인 토큰 | 완료 (`dfbed5b`) |
| 2. 공용 컴포넌트 | 완료 (`dfbed5b`) |
| 3. 페이지 라이트 복귀 | **진행 중** — 9화면 완료(`a55c96d`), 13개 파일 남음 |
| 4. 소모임 2단계(사진) | 대기 |

색 규칙과 토큰표는 [conventions.md](conventions.md)를 보세요. **한 줄 요약: 액센트 퍼플 = 상호작용 전용, 카테고리 틴트 = 장식·식별 전용.**

### 끝난 화면

| 화면 | 메모 |
| --- | --- |
| 게이트 · 로그인 · `LoadingScreen` | 진입 화면이라 먼저. 게이트는 제목이 흰 글자, 버튼 면이 반투명 흰색이라 흰 배경에서 거의 백지로 보였습니다 |
| 홈 · 소모임 목록 · 개설 시트 | 탭에서 바로 닿는 화면 |
| 행사 순서 · 행사 빌더 · 평가 타임라인 | 잔재가 가장 많던 셋 |

색 말고 **구조가 바뀐 것**은 셋입니다.

- 홈의 3열 `QuickAction` 그리드를 `ActionRow` 목록으로 교체하고 그 페이지 전용 컴포넌트를 삭제했습니다. 표준 리스트 아이템과 하는 일이 같았습니다.
- 홈 히어로는 행사별 색(`colorForEvent`)을 쓰지 않고 앰버 틴트로 고정했습니다. 홈에는 행사가 하나만 뜨므로 행사별로 색을 나눌 이유가 없습니다. 그래서 `lib/eventColor`는 홈이 아니라 **목록 페이지들의 문제로 남았습니다.**
- 소모임 시트와 행사 순서 시트가 껍데기를 복붙하고 있어 [`ui/BottomSheet`](../src/components/ui/BottomSheet.tsx)로 뽑았습니다.

행사 빌더의 `colorScheme: "dark"`(날짜·시각 인풋) 4곳이 사라져 네이티브 피커가 라이트로 뜹니다.

**알아둘 부수 효과**: 공용 `Button`의 `loading`을 쓰면서 시트의 "만드는 중..."·"저장 중..."이 **"처리 중..."으로 바뀌었습니다.** `Button`이 loading 중 children을 통째로 갈아끼우기 때문입니다. 문구를 살리려면 `Button`에 loading 텍스트 prop을 두는 게 맞습니다.

### 남은 파일

잔재가 많은 순입니다. 숫자는 아래 "잔재 찾는 법" 패턴의 매치 수라 대략의 규모로만 보세요.

| 파일 | 대략 |
| --- | --- |
| `bill/BillFormPage` | 22 |
| `admin/event/EventResultsPage` | 18 |
| `admin/AdminPage` | 16 |
| `event/EventListPage` | 13 |
| `components/EventInfoView` | 11 |
| `worship/WorshipSchedulePage` | 9 |
| `MemberProfileSetupPage` | 8 |
| `ProfilePage` · `components/worship/PositionSlot` | 각 5 |
| `event/EventInfoPage` | 3 |
| `GalleryPage` | 2 |
| `admin/event/EventDetailPage` · `main.tsx`(토스트 스타일) | 각 1 |

**애초에 라이트라 안 건드려도 되는 것**: 회계 3종(라우터 미연결).

`bill/BillFormPage`는 잔재가 가장 많지만 **회계와 함께 iOS 앱으로 이관될 수 있는 화면**이라, 손대기 전에 범위에 넣을지 정하는 게 좋습니다.

### 잔재 찾는 법

```
grep -rnE "#f0f2f8|#8892a0|#6b7785|#0f1117|#4a5568|#c0c8d4|#363d47|rgba\(255,\s*255,\s*255,\s*0\.|colorScheme:\s*\"dark\"|TAB_COLORS|TINT_COLORS" src/
```

`#f0f2f8`(글자) `#8892a0`/`#6b7785`/`#4a5568`/`#c0c8d4`/`#363d47`(보조 글자) `rgba(255,255,255,0.0x)`(글래스 면·테두리) `#0f1117`(배경) `colorScheme: "dark"`가 잔재입니다. `nav/creatures.tsx`의 매치 한 건은 주석이라 오탐입니다.

**위 표의 숫자는 이 명령과 같은 패턴입니다.** 색 코드를 빼고 세면 실제보다 적게 나오니 패턴을 줄이지 마세요.

### 3단계 완료 조건

`TINT_COLORS`(구 `TAB_COLORS`) 호출부를 카테고리 틴트 토큰으로 옮기고 [`constants/theme.ts`](../src/constants/theme.ts)에서 삭제하는 것까지가 3단계입니다. 남은 호출부 6개 — `lib/eventColor`, `AdminPage`, `GalleryPage`, `EventResultsPage`, `EventListPage`, `BillFormPage`.

**`lib/eventColor`는 맨 마지막에 손대세요.** `colorForEvent(id)`가 **hex 문자열**을 돌려주는데 라이트에서 필요한 건 배경/글자 짝(`bg-teal-subtle`+`text-teal-strong`)입니다. 반환값을 틴트 **이름**으로 바꿔야 하고([`constants/tints.ts`](../src/constants/tints.ts)의 `Tint`), 그러면 이걸 쓰는 목록 페이지들이 한꺼번에 깨집니다. 그 페이지들을 먼저 정리한 뒤 한 번에 바꾸세요.

### 화면 확인하는 법

바꾼 화면은 눈으로 확인할 수 있습니다. **Claude in Chrome** 확장이 연결돼 있으면 스크린샷이 되고, 로그인된 세션을 그대로 쓰므로 보호된 화면도 보입니다.

반대로 게이트·로그인은 **로그인돼 있으면** 홈으로 리다이렉트돼 볼 수 없습니다. 방향이 반대인 두 문제라 개발 전용 미리보기를 뒀습니다 — [`src/pages/dev/DevPreviewPage.tsx`](../src/pages/dev/DevPreviewPage.tsx)가 `main.tsx`에서 앱 라우터 **대신** 마운트되고, `authStore`와 쿼리 캐시를 원하는 상태로 꾸며 띄웁니다. `import.meta.env.DEV` 게이트라 프로덕션 번들에는 들어가지 않습니다.

현재 화면: `nav`(탭별 활성 상태) · `gate` · `login` · `home` · `home-empty` · `gatherings` · `segments` · `builder` · `timeline`. 경로 없이 `/__dev/`로 가면 목록이 뜹니다. `SCREENS` 레지스트리에 추가하면 늘어납니다.

목 데이터를 추가할 때 주의할 점 셋:

- **`Seed`가 `staleTime: Infinity`를 같이 박는 게 핵심입니다.** 캐시에 심기만 하면, 훅에 `staleTime`이 없는 쿼리(`useEventList`)는 마운트하자마자 재조회하고 로그인이 없어 **빈 배열이 성공으로** 돌아오면서 목 데이터를 조용히 덮어씁니다. 화면이 계속 "빈 상태"로 보이면 십중팔구 이겁니다.
- 상대 시각 데이터(소모임 `gathering_at`, 행사 `event_date`/`start_time`)는 **오늘 기준으로 만드세요.** 고정 날짜로 두면 시간이 지나 전부 "종료"로 굳어 모집 중 카드나 타임라인의 "LIVE 진행중"을 못 봅니다.
- `useParams`로 `:id`를 읽는 페이지(행사 3종)는 `MemoryRouter` 안에 **`Routes`/`Route`까지** 세워야 합니다. `initialEntries`만 주면 params가 빈 객체입니다.

**스크린샷 함정 둘**:

1. 화면마다 등장 애니메이션(`initial={{ opacity: 0 }}`)이 있어 **첫 장이 빈 화면·반투명으로 찍힙니다.** 한 번 더 찍으세요. 빈 화면을 보고 "렌더가 안 된다"고 진단하지 마세요.
2. 창 크기가 스크린샷 사이에 바뀔 수 있습니다. 클릭 좌표는 **바로 직전 장** 기준으로 잡으세요 — 좌표가 밀리면 모달 바깥을 눌러 시트가 닫힙니다.

## 기능별 상태

| 기능 | 상태 | 근거 |
| --- | --- | --- |
| 인증 (멤버/게스트/관리자) | 동작 | `authStore` + `ProtectedRoute` |
| 영수증 비용 청구 | 동작 | `/member/bill` → `BillFormPage` |
| 행사 (타임라인 + 평가) | 동작, 재구축 진행 중 | 참여자·관리자 라우트 모두 연결됨 |
| 소모임(번개) | **1단계만 동작** | 개설·참여 토글·참여자 아이콘 realtime (`6967f59`). 사진·정산·템플릿은 미착수 |
| 찬양팀 일정 | 동작 | `/worship`, Realtime 반영 |
| 갤러리 | **준비 중 안내만** | `GalleryPage`가 "준비 중인 기능입니다" 문구만 렌더 |
| 회계 리포트 | **라우터에 미연결** | 아래 참고 |
| 통계 | 라우트 제거됨 | 커밋 `d6134e7` |
| 메뉴판 → Claude 메뉴 추출 | **코드 없음** | 아래 참고 |
| 게스트 청구 폼 | **없음** | `/guest/form` 라우트 부재 |
| 웹 푸시 알림 | 미구현 | 관련 코드 없음 |

## 미연결(고아) 코드

### 회계 리포트

`pages/accounting/`에 세 페이지(`AccountingListPage`, `AccountingDetailPage`, `AccountingReportPage`)와 훅 두 개(`useAccountingCategories`, `useAccountingReport`)가 온전히 남아 있지만, **라우터에 등록돼 있지 않고 어디서도 import하지 않습니다.**

게다가 **이 코드가 쿼리하는 `accounting_*` 테이블은 원격 DB에 존재하지 않습니다**(2026-07-16 확인). 대신 `finance_*` 테이블(`finance_ledgers`, `finance_reports`, `finance_splits`, `finance_transactions`)이 있어 이름이 바뀐 뒤 코드가 따라가지 않은 것으로 보입니다. 즉 라우터에 연결만 해서는 동작하지 않습니다.

**다만 이 기능은 iOS 앱으로 이관 예정입니다** — 커밋 `54c0d7d`의 README에 그렇게 적혀 있습니다. 즉 웹에서 되살릴 계획이 아니므로, 웹 코드는 정리(삭제) 대상에 가깝습니다. 관리자 페이지의 "재정 관리" 탭에는 "회계 장부 관리" 항목이 있지만 누르면 준비 중 안내만 뜹니다([AdminPage.tsx](../src/pages/admin/AdminPage.tsx#L131)).

### 그 외

- `event_participants` 테이블 — "내 일정에 추가"용으로 만들었으나 조회하는 코드가 없습니다.
- `EventResultsPage` — `results_public` 토글 UI가 있지만 라우터에 없고 import되지도 않습니다.
- `@anthropic-ai/sdk` 의존성과 `VITE_ANTHROPIC_API_KEY` — `src/`에 Anthropic 호출 코드가 전혀 없습니다. 메뉴 추출 기능이 제거되면서 남은 흔적으로 보입니다. (참고: 클라이언트에서 직접 Claude API를 부르면 API 키가 노출되므로, 되살린다면 Worker 경유로 옮기는 게 맞습니다.)
- `exifr` 의존성 — 쓰는 코드가 없습니다.

## 알려진 정리 대상

- **마이그레이션 공백** — 행사 외 테이블에 마이그레이션이 없습니다. `npx supabase db pull`로 메울 수 있습니다. ([data-model.md](data-model.md))
- **Worker 인증 없음** — `/upload`, `/delete`가 무인증에 `Allow-Origin: *`입니다. URL만 알면 누구나 업로드·삭제할 수 있습니다.
- **`worship_availability` RLS** — 로그인한 누구나 남의 참여 행을 수정할 수 있습니다. 다만 이 느슨함을 "교체" 기능이 쓰고 있어 그냥 지우면 깨집니다. ([data-model.md](data-model.md#-알려진-구멍-worship_availability))
- **디자인 토큰 혼재** — 폐기된 다크 재디자인의 하드코딩 hex가 페이지에 남아 있습니다. 위 "라이트 전면 리디자인 3단계"가 이걸 걷어내는 작업입니다. ([conventions.md](conventions.md))
- **`event_date`가 text** — 날짜 정렬·필터를 DB에 맡길 수 없고 파싱이 `parseStartDate()`에 의존합니다.
- **회계 훅의 패칭 방식** — TanStack Query를 쓰는 다른 도메인과 달리 `useEffect` + `useState`이고 에러 처리가 없습니다.
- **린트 5건** — `BottomNav`·`ConfirmDialog`·`main.tsx`·`EventBuilderPage`에 있으며 리디자인 이전부터 있던 것들입니다(`npm run lint`).
