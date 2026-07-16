# 코드 규칙과 재사용 카탈로그

새로 만들기 전에 여기 있는 걸 먼저 찾아보세요.

## 디자인 토큰

[src/index.css](../src/index.css)의 `@theme` 블록에 Tailwind 4 토큰이 정의돼 있습니다. `--color-fg` → `text-fg`처럼 클래스로 바로 쓰입니다.

| 그룹 | 토큰 |
| --- | --- |
| 글자 | `fg-strong`, `fg`, `fg-muted`, `fg-faint` |
| 표면 | `surface`, `card`, `sunken`, `inverse` |
| 선 | `line-soft`, `line`, `line-strong` |
| **액센트** | `accent` — `-subtle`(틴트 배경) / `-soft`(테두리) / 기본 / `-strong`(눌림·틴트 위 글자) |
| 의미 | `info`, `danger`, `warning`, `success` — 각각 `-subtle`(배경) / `-soft`(테두리) / 기본 / `-strong`(틴트 위 제목) |
| 카테고리 | `teal`, `pink`, `amber` — 각각 `-subtle` / 기본 / `-strong`. 클래스 짝은 [`constants/tints.ts`](../src/constants/tints.ts) |
| 모서리 | `rounded-tile`(16) / `-field`(14) / `-card`(20) / `-panel`(24). 버튼·칩은 `rounded-full` |
| 그림자 | `shadow-card` / `shadow-lift`(탭바·시트·모달) / `shadow-accent`(퍼플 CTA) |
| 타입 | `text-caption`, `text-body` 등 (line-height 동반) |

접미사 규칙이 일관됩니다. `subtle`은 배경, `soft`는 테두리, 기본은 본체 색, `strong`은 틴트 배경 위 제목용 진한 색입니다.

### 색을 고르는 규칙

**앱 전체에서 이 한 줄이 제일 중요합니다.**

- **액센트 퍼플 = 상호작용 전용.** 버튼, 활성 탭, 선택 상태, 링크. 누를 수 있는 것에만.
- **카테고리 틴트 = 장식·식별 전용.** 리스트 아이콘 타일, 히어로 틴트. 누를 수 없는 것에만.

이 둘을 섞으면 화면이 산만해집니다. 퍼플 계열이 카테고리 틴트에 없는 것도 액센트와 충돌하기 때문입니다.

틴트는 **배경과 글자를 짝으로** 바꿉니다. 배경만 틴트로 깔고 글자색을 안 바꾸면 대비가 깨져서, 짝을 [`constants/tints.ts`](../src/constants/tints.ts)에 묶어뒀습니다 — 아이콘 타일은 `TINT_TILE`, 번호·라벨처럼 더 진해야 하는 자리는 `TINT_STRONG`. 목록에서 순번마다 색을 돌리려면 `tintByIndex(i)`를 쓰세요(**위치에 따른 장식이지 항목의 의미가 아닙니다**).

면은 테두리가 아니라 **`shadow-card`로 띄워서** 분리합니다.

`fg-faint`는 **장식·비활성 아이콘 전용**입니다. 흰 배경 대비가 4.5:1에 못 미쳐서 본문 텍스트에 쓰면 안 됩니다. 보조 텍스트는 `fg-muted`까지입니다.

**입력 필드(`input`/`textarea`)는 반드시 16px**입니다. iOS Safari가 16px 미만이면 포커스 시 화면을 자동 확대합니다. 줄이지 마세요.

### 진행 중인 마이그레이션

**라이트 전면 리디자인 3단계 진행 중**입니다 (1단계 토큰 · 2단계 공용 컴포넌트 완료, 3단계는 진입 3화면만 완료). 폐기된 다크 재디자인의 잔재가 페이지에 남아 있습니다 — `#f0f2f8`, `#8892a0`, `rgba(255,255,255,0.05)` 같은 인라인 스타일이 그것이고, **흰 배경에서 안 보이거나 뒤집혀 보입니다.** 보이면 토큰으로 걷어내세요. 남은 파일 목록과 검색 패턴은 [status.md](status.md)에 있습니다.

`constants/theme.ts`는 Tailwind 클래스를 못 쓰는 자리(인라인 `style`, SVG `fill`)용입니다. `ACCENT`와 `MUTED`만 쓰세요. **`TINT_COLORS`(구 `TAB_COLORS`)는 deprecated** — 3단계에서 호출부를 카테고리 틴트 토큰으로 옮기고 삭제할 예정입니다. 페이지 상단에서 `const ACCENT = TAB_COLORS.home` 식으로 받아 쓰던 관례도 같이 없앱니다.

## 공용 컴포넌트

| 컴포넌트 | 용도 |
| --- | --- |
| `Layout` | 보호 라우트의 셸 (하단 탭 포함) |
| `ProtectedRoute` | 인증·권한 가드 ([routing.md](routing.md)) |
| `BottomNav` | 하단 5탭. 캐릭터 아이콘 + 마우스 추적 |
| `BackButton` | 뒤로가기 — **페이지마다 제각각이던 걸 통일한 공용 버전** |
| `PageContainer` / `PageHero` | 페이지 래퍼 / 상단 히어로 |
| `LoadingScreen` / `LoadingSpinner` | 전체 화면 / 인라인 로딩. `LoadingScreen`은 `LoadingSpinner`를 감싸기만 합니다 — 스피너를 또 만들지 마세요 |
| `ConfirmDialog` | `confirmDialog()` 명령형 호출로 확인 모달 |
| `EventInfoView` | 행사 정보 표시. 관리자 상세와 참여자 정보 페이지가 공유 |
| `worship/PositionSlot` | 찬양팀 포지션 슬롯 |

`ui/` 프리미티브: `Button`, `TextField`, `SelectField`, `TextArea`, `ActionRow`, `BottomSheet`, `MoodRating`.

- **`ActionRow`가 앱 표준 리스트 아이템입니다** — 틴트 타일 + 제목/설명 + 화살표. **목록 UI를 새로 만들지 말고 이걸 쓰세요.** 리스트가 정갈해 보이는 건 아이콘이 아니라 왼쪽 틴트 사각형이 같은 크기로 반복되기 때문입니다.
- `Button` variant는 `primary`(퍼플 pill) / `dark`(보조 액션) / `outline` / `danger`. 위계가 이 순서고, **한 화면에 `primary`는 하나만** 둡니다. `loading`을 주면 children이 **"처리 중..."으로 통째로 갈립니다** — 문구를 따로 두고 싶으면 `loading`을 쓰지 마세요.
- **`BottomSheet`가 아래에서 올라오는 시트의 껍데기입니다** (딤·손잡이·제목·닫기). 안쪽 폼만 children으로 넣으세요. **`AnimatePresence` 안에서 조건부로 렌더해야** 닫힘 애니메이션이 돕니다.

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
- 굵기는 `font-semibold`(600) 기준, 헤드라인은 `font-bold`(700). 굵은 한글 헤드라인이 새 디자인의 인상을 만듭니다. (구 규칙이던 "굵기 2단계만, bold 금지"는 폐기됐습니다.)
- 페이지는 도메인별 폴더(`pages/<domain>/`)로 묶습니다. 관리자 페이지는 `pages/admin/` 아래에 둡니다.
- 파일 상단 경로 주석(`// src/router/index.tsx`)은 일부 파일에만 있습니다 — 일관된 규칙이 아닙니다.
- 애니메이션은 `motion/react`, 토스트는 `react-hot-toast`, 아이콘은 `lucide-react`(+ 일부 `@heroicons/react`)를 씁니다.
- 이모지 아이콘 문자열(`ti-mood-happy` 등)이 `lib/mood.ts`에 있습니다.
