# 기능 진행 상태

2026-07-16 / `7f59774` 기준. 코드를 읽어 확인한 사실만 적었습니다.

## 기능별 상태

| 기능 | 상태 | 근거 |
| --- | --- | --- |
| 인증 (멤버/게스트/관리자) | 동작 | `authStore` + `ProtectedRoute` |
| 영수증 비용 청구 | 동작 | `/member/bill` → `BillFormPage` |
| 행사 (타임라인 + 평가) | 동작, 재구축 진행 중 | 참여자·관리자 라우트 모두 연결됨 |
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

**다만 이 기능은 iOS 앱으로 이관 예정입니다** — 커밋 `54c0d7d`의 README에 그렇게 적혀 있습니다. 즉 웹에서 되살릴 계획이 아니므로, 웹 코드는 정리(삭제) 대상에 가깝습니다. 관리자 페이지의 "재정 관리" 탭에는 "회계 장부 관리" 항목이 있지만 누르면 준비 중 안내만 뜹니다([AdminPage.tsx:131](../src/pages/admin/AdminPage.tsx:131)).

### 그 외

- `event_participants` 테이블 — "내 일정에 추가"용으로 만들었으나 조회하는 코드가 없습니다.
- `EventResultsPage` — `results_public` 토글 UI가 있지만 라우터에 없고 import되지도 않습니다.
- `@anthropic-ai/sdk` 의존성과 `VITE_ANTHROPIC_API_KEY` — `src/`에 Anthropic 호출 코드가 전혀 없습니다. 메뉴 추출 기능이 제거되면서 남은 흔적으로 보입니다. (참고: 클라이언트에서 직접 Claude API를 부르면 API 키가 노출되므로, 되살린다면 Worker 경유로 옮기는 게 맞습니다.)

## README와 실제의 차이

루트 [README.md](../README.md)가 설명하는 것 중 코드에 없는 것들입니다.

| README 서술 | 실제 |
| --- | --- |
| `src/lib/extractGps.ts`, `reverseGeocode.ts`, `extractMenus.ts` | 없음 (Worker의 `/geocode`는 있지만 호출하는 클라이언트 코드가 없음) |
| `src/hooks/useFormSubmit.ts` | 없음 |
| `pages/vote/` (투표) | 없음 |
| 게스트 청구 `/guest/form` | 없음 |
| 멤버 청구 `/member/form` | 실제 경로는 `/member/bill` |
| 메뉴 추출 (기능 3) | 코드 없음 |
| 회계 장부 작성 (기능 2) | 코드는 있으나 라우터 미연결 |

`exifr` 의존성도 남아 있지만 쓰는 코드가 없습니다. README를 실제에 맞게 손보거나, 기능을 되살리거나 — 어느 쪽이든 정리가 필요합니다.

## 알려진 정리 대상

- **마이그레이션 공백** — 행사 외 테이블에 마이그레이션이 없습니다. `npx supabase db pull`로 메울 수 있습니다. ([data-model.md](data-model.md))
- **Worker 인증 없음** — `/upload`, `/delete`가 무인증에 `Allow-Origin: *`입니다. URL만 알면 누구나 업로드·삭제할 수 있습니다.
- **디자인 토큰 혼재** — 토큰과 하드코딩 hex가 섞여 있습니다. ([conventions.md](conventions.md))
- **`event_date`가 text** — 날짜 정렬·필터를 DB에 맡길 수 없고 파싱이 `parseStartDate()`에 의존합니다.
- **회계 훅의 패칭 방식** — TanStack Query를 쓰는 다른 도메인과 달리 `useEffect` + `useState`이고 에러 처리가 없습니다.
