# 코드 규칙과 재사용 카탈로그

새로 만들기 전에 여기 있는 걸 먼저 찾아보세요.

## 디자인 토큰

[src/index.css](../src/index.css)의 `@theme` 블록에 Tailwind 4 토큰이 정의돼 있습니다. `--color-fg` → `text-fg`처럼 클래스로 바로 쓰입니다.

| 그룹 | 토큰 |
| --- | --- |
| 글자 | `fg-strong`, `fg`, `fg-muted`, `fg-faint` |
| 표면 | `surface`, `card`, `sunken`, `inverse` |
| 선 | `line-soft`, `line`, `line-strong` |
| 의미 | `info`, `danger`, `warning`, `success` — 각각 `-subtle`(배경) / `-soft`(테두리) / 기본 / `-strong`(틴트 위 제목) |
| 카테고리 | `purple`, `teal`, `pink`, `amber` — 각각 `-subtle` / `-strong` |
| 타입 | `text-caption`, `text-body` 등 (line-height 동반) |

접미사 규칙이 일관됩니다. `subtle`은 배경, `soft`는 테두리, 기본은 본체 색, `strong`은 틴트 배경 위 제목용 진한 색입니다.

**마이그레이션 진행 중**입니다. 토큰과 하드코딩된 hex가 섞여 있고, 특히 다크 재디자인을 거친 페이지들(`BillFormPage` 등)에는 `#f0f2f8`, `#8892a0` 같은 인라인 스타일이 많습니다. 새 코드는 토큰을 쓰고, 기존 코드를 만질 때 점진적으로 옮기세요.

`constants/theme.ts`의 `TAB_COLORS`는 별개입니다. 탭바·로딩 스피너·페이지 액센트에서 쓰는 탭별 브랜드 색이고, 페이지 상단에서 `const ACCENT = TAB_COLORS.home` 식으로 받아 쓰는 관례가 있습니다.

## 공용 컴포넌트

| 컴포넌트 | 용도 |
| --- | --- |
| `Layout` | 보호 라우트의 셸 (하단 탭 포함) |
| `ProtectedRoute` | 인증·권한 가드 ([routing.md](routing.md)) |
| `BottomNav` | 하단 5탭. 캐릭터 아이콘 + 마우스 추적 |
| `BackButton` | 뒤로가기 — **페이지마다 제각각이던 걸 통일한 공용 버전** |
| `PageContainer` / `PageHero` | 페이지 래퍼 / 상단 히어로 |
| `LoadingScreen` / `LoadingSpinner` | 전체 화면 / 인라인 로딩 |
| `ConfirmDialog` | `confirmDialog()` 명령형 호출로 확인 모달 |
| `EventInfoView` | 행사 정보 표시. 관리자 상세와 참여자 정보 페이지가 공유 |
| `worship/PositionSlot` | 찬양팀 포지션 슬롯 |

`ui/` 프리미티브: `Button`, `TextField`, `SelectField`, `TextArea`, `ActionRow`, `MoodRating`.

## 훅

| 훅 | 용도 |
| --- | --- |
| `useEvents` | 행사 전반. 쿼리 키는 `eventKeys` 객체에 모음 |
| `useWorshipSchedule` | 월별 주일 일정 + Realtime |
| `useToggleAvailability` | 포지션 참여 토글 (낙관적 캐시 갱신 + 중복 시 교체 확인) |
| `useCalendar` | 달력 월 이동 상태 (`useReducer`) |
| `useReceiptUpload` | 파일 선택 + 미리보기 URL 수명 관리 (`revokeObjectURL` 포함) |
| `useAccountingCategories` / `useAccountingReport` | 회계 (미연결 페이지에서 사용) |

## 유틸

| 파일 | 내용 |
| --- | --- |
| `lib/supabase.ts` | Supabase 클라이언트 (단일 인스턴스) |
| `lib/supabaseList.ts` | `fetchList<T>(table, { orderBy, ascending, filter })` 범용 조회 |
| `lib/uploadReceipt.ts` | 압축 + Worker 업로드 → URL |
| `lib/deleteImage.ts` | Worker 경유 R2 삭제 |
| `lib/eventTime.ts` | `formatClock`, `parseStartDate`, `totalDuration`, `buildTimeline` |
| `lib/eventStatus.ts` | `computeEventStatus` → `upcoming` / `live` / `done`, `EVENT_STATUS_LABEL` |
| `lib/eventColor.ts` | `colorForEvent(id)` — id 해시로 팔레트 색 고정 배정 |
| `lib/mood.ts` | `MOODS`, `MOOD_BY_VALUE`, `aggregateMoods` — 3단계 만족도 단일 정의 |
| `lib/generateNickname.ts` | 게스트 랜덤 닉네임 (형용사+동물+이모지) |

### 행사 시간 계산

세그먼트는 절대 시각이 아니라 **소요 시간(분)** 으로 저장됩니다. 시작 시각은 `buildTimeline()`이 `start_time`부터 앞 순서들의 길이를 누적해 계산하고, 각 순서에 `start`/`end`/`status`를 붙여 돌려줍니다. 순서를 재배치하거나 길이를 바꾸면 뒤 순서 시각이 전부 자동으로 따라옵니다.

`start_time`이나 파싱 가능한 날짜가 없으면 시각은 `null`이고 상태는 `upcoming`으로 떨어집니다. 시간 관련 표시가 필요하면 페이지에서 직접 계산하지 말고 이 함수들을 쓰세요.

## 코드 규칙

- 주석과 UI 문자열은 한국어입니다.
- 페이지는 도메인별 폴더(`pages/<domain>/`)로 묶습니다. 관리자 페이지는 `pages/admin/` 아래에 둡니다.
- 파일 상단 경로 주석(`// src/router/index.tsx`)은 일부 파일에만 있습니다 — 일관된 규칙이 아닙니다.
- 애니메이션은 `motion/react`, 토스트는 `react-hot-toast`, 아이콘은 `lucide-react`(+ 일부 `@heroicons/react`)를 씁니다.
- 이모지 아이콘 문자열(`ti-mood-happy` 등)이 `lib/mood.ts`에 있습니다.
