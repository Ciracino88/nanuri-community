# 코드 규칙과 재사용 카탈로그

새로 만들기 전에 여기 있는 걸 먼저 찾아보세요.

**색·타입·반경·그림자 같은 디자인 규칙은 여기 없습니다** — [design.md](design.md)로 갔습니다.
이 문서는 "어떤 부품이 이미 있는가"와 "코드를 어떻게 쓰는가"만 다룹니다.

## 공용 컴포넌트

| 컴포넌트 | 용도 |
| --- | --- |
| `Layout` | 보호 라우트의 셸. **탭바를 렌더하지 않습니다** ([status.md](status.md)) |
| `ProtectedRoute` | 인증·권한 가드 ([routing.md](routing.md)) |
| `BottomNav` | 옛 하단 5탭. **`DevPreviewPage`만 씁니다** — 앱에서는 죽은 코드 |
| `BackButton` | 뒤로가기 — 페이지마다 제각각이던 걸 통일한 공용 버전 |
| `PageContainer` | 페이지 래퍼 |
| `LoadingScreen` / `LoadingSpinner` | 전체 화면 / 인라인 로딩. `LoadingScreen`은 `LoadingSpinner`를 감싸기만 합니다 — 스피너를 또 만들지 마세요 |
| `ConfirmDialog` | `confirmDialog()` 명령형 호출로 확인 모달 |
| `worship/PositionSlot` | 찬양팀 포지션 슬롯 |

### `ui/` 프리미티브

`Button`, `TextField`, `TextArea`, `SelectField`, `ActionRow`, `BottomSheet`.
**여섯 다 원티드로 이식됐습니다** — 아직 안 그린 옛 화면에도 새 인풋·버튼이 이미 뜹니다.
섞여 보이는 건 버그가 아니라 이 순서 때문입니다.

- **`ActionRow`가 앱 표준 리스트 아이템입니다** — 아이콘 타일 + 제목/설명 + 화살표.
  **목록 UI를 새로 만들지 말고 이걸 쓰세요.** 리스트가 정갈해 보이는 건 아이콘이 아니라
  왼쪽 사각형이 같은 크기로 반복되기 때문입니다. 타일 색은 하나뿐입니다(카테고리 색 폐기).
- `Button` variant는 `primary` / `outline` / `danger`. **한 화면에 `primary`는 하나만** 둡니다.
  `loading`을 주면 스피너가 붙고 문구는 남습니다 — 다른 문구를 쓰려면 `loadingText`를 주세요.
- `TextField`/`TextArea`/`SelectField`는 **주제(라벨) → 인풋 → 메시지(헬퍼)** 3단 구조입니다.
  `error`를 주면 빨간 테두리 + (!) 아이콘 + 빨간 문구가 같이 뜹니다 — **색 하나에 의미를
  걸지 않는 게 의도**입니다. `helper`는 `error`가 있으면 가려집니다.
- **`SelectField`는 `multiple`로 다중 선택이 됩니다** — `multiple`을 주면 `value`/`onChange`가
  `string[]`로 바뀌는 판별 유니온입니다(안 주면 기존 단일 선택 그대로). 다중일 때 트리거는 고른
  값을 **선택 순서대로 ` & `로 이어** 보여주고(예: `어쿠스틱 & 싱어1`), 목록은 골라도 안 닫힙니다.
  프로필 편집의 포지션 선택이 이걸 씁니다.
- **`BottomSheet`가 아래에서 올라오는 시트의 껍데기입니다** (딤·손잡이·제목·닫기).
  안쪽 폼만 children으로 넣으세요. **`AnimatePresence` 안에서 조건부로 렌더해야** 닫힘
  애니메이션이 돕니다.

## 훅

| 훅 | 용도 |
| --- | --- |
| `useGatherings` / `useCreateGathering` | 소모임 목록 + Realtime, 개설. 쿼리 키는 `gatheringKeys` |
| `useCreateCategory` | 소모임 카테고리 생성 (멤버가 직접 만듭니다) |
| `useToggleGatheringJoin` | 소모임 참여 토글 |
| `useGatheringReviews` | 후기 조회(좋아요 포함)·작성·수정·삭제·좋아요 토글(`useToggleReviewLike`). 쿼리 키는 `reviewKeys` |
| `useGatheringRpc` | `useUpdateGatheringPlace`(참가자 누구나) · `useTransferGatheringLeader`(리더만) |
| `useWorshipSchedule` | 월별 주일 일정 + Realtime |
| `useToggleAvailability` | 포지션 참여 토글 (낙관적 캐시 갱신 + 중복 시 교체 확인) |
| `useCalendar` | 달력 월 이동 상태 (`useReducer`) |
| `useReceiptUpload` | 파일 선택 + 미리보기 URL 수명 관리 (`revokeObjectURL` 포함) |

## 유틸

| 파일 | 내용 |
| --- | --- |
| `lib/supabase.ts` | Supabase 클라이언트 (단일 인스턴스) |
| `lib/supabaseList.ts` | `fetchList<T>(table, { orderBy, ascending, filter })` 범용 조회 |
| `lib/uploadReceipt.ts` | 압축 + Worker 업로드 → URL |
| `lib/deleteImage.ts` | Worker 경유 R2 삭제 |
| `lib/gatheringTime.ts` | `computeGatheringStatus`, **`formatGatheringWhen`**, `formatGatheringAt`, `defaultGatheringAt`, `localInputToISO` |
| `lib/generateNickname.ts` | 게스트 랜덤 닉네임 (형용사+동물+이모지) |

## 상수

| 파일 | 내용 |
| --- | --- |
| `constants/theme.ts` | `ACCENT`(Primary) · `MUTED`. **Tailwind 클래스를 못 쓰는 자리(인라인 `style`, SVG `fill`)에서만** 씁니다 |
| `constants/layout.ts` | `PAGE_BOTTOM_PAD` — 떠 있는 탭바에 가리지 않도록 페이지가 확보하는 하단 여백 |
| `constants/banks.ts` · `constants/worship.ts` | 은행 목록 · 포지션 목록 |

## 소모임 시간 — `formatGatheringWhen`을 쓰세요

`formatGatheringAt(iso)`가 아니라 **`formatGatheringWhen(gathering)`** 이 화면이 부를 함수입니다.
챌린지는 `gathering_at`이 `null`이라(기한이 없는 게 챌린지의 정의) `formatGatheringAt`에 그대로
넘기면 `Invalid Date`입니다. `formatGatheringWhen`이 그 분기를 한 번만 처리해 "무기한"을 돌려줍니다.

`computeGatheringStatus`도 같은 이유로 **레코드 전체**를 받습니다 — 원데이는 `gathering_at`이,
챌린지는 `ended_at`이 종료를 정합니다([data-model.md](data-model.md)).

## 코드 규칙

- 주석과 UI 문자열은 한국어입니다.
- 굵기는 `font-semibold`(600) 기준, 헤드라인은 `font-bold`(700).
- 페이지는 도메인별 폴더(`pages/<domain>/`)로 묶습니다. 관리자 페이지는 `pages/admin/` 아래.
- 파일 상단 경로 주석(`// src/router/index.tsx`)은 일부 파일에만 있습니다 — 일관된 규칙이 아닙니다.
- 애니메이션은 `motion/react`, 토스트는 `react-hot-toast`, 아이콘은 `lucide-react`
  (+ 일부 `@heroicons/react`)를 씁니다.
- `npm run build`는 `tsc -b` 후 `vite build`라 **타입 에러가 있으면 빌드가 실패**합니다.
  다만 **CSS 토큰이 없어지는 건 타입 에러가 아니라** 조용히 통과합니다([design.md](design.md)).
