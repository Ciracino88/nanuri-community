# 라우팅과 권한

라우트 정의: [src/router/index.tsx](../src/router/index.tsx) · 가드: [src/components/ProtectedRoute.tsx](../src/components/ProtectedRoute.tsx)

> `/__dev/*`는 이 라우터에 없습니다. [main.tsx](../src/main.tsx)가 개발 서버에서만 `RouterProvider` **대신** [`DevPreviewPage`](../src/pages/dev/DevPreviewPage.tsx)를 마운트하는 별도 분기입니다 — 라우터 바깥이어야 미리보기가 `MemoryRouter`로 경로와 인증 상태를 꾸밀 수 있기 때문입니다(라우터는 중첩이 안 됩니다). 자세한 용도는 [status.md](status.md)의 "화면 확인하는 법"을 보세요.

## 라우트 목록

### 공개

| 경로 | 페이지 | 설명 |
| --- | --- | --- |
| `/` | `GatePage` | 진입점. 멤버 로그인/게스트 선택 |
| `/member/login` | `MemberLoginPage` | 멤버 로그인 |

### 멤버 전용 (`memberOnly` + `Layout`)

| 경로 | 페이지 | 설명 |
| --- | --- | --- |
| `/home` | `HomePage` | 홈 |
| `/member/bill` | `BillFormPage` | 영수증 비용 청구 |
| `/gatherings` | `GatheringListPage` | 소모임(번개) 목록·개설 |
| `/events` | `EventListPage` | 행사 목록 |
| `/event/:id` | `EventInfoPage` | 행사 정보 |
| `/event/:id/timeline` | `EventTimelinePage` | 타임라인 + 순서별 평가 |
| `/profile` | `ProfilePage` | 내 정보 |
| `/gallery` | `GalleryPage` | 갤러리 (준비 중 안내만 표시) |
| `/worship` | `WorshipSchedulePage` | 찬양팀 일정 |

### 프로필 설정 (`memberOnly` + `setupPage`)

| 경로 | 페이지 |
| --- | --- |
| `/member/setup` | `MemberProfileSetupPage` |

`setupPage` 플래그는 프로필 미완성 검사를 건너뛰기 위한 것입니다. 이게 없으면 설정 페이지 자신이 무한 리다이렉트에 빠집니다.

### 관리자 전용 (`memberOnly` + `adminOnly`)

| 경로 | 페이지 | 설명 |
| --- | --- | --- |
| `/admin` | `AdminPage` | 관리자 홈 |
| `/admin/events/new` | `EventBuilderPage` | 행사 생성 |
| `/admin/events/:id` | `EventDetailPage` | 행사 상세 |
| `/admin/events/:id/edit` | `EventBuilderPage` | 행사 수정 (생성과 같은 컴포넌트) |
| `/admin/events/:id/segments` | `EventSegmentsPage` | 순서(세그먼트) 편집 |

## 가드 규칙

`ProtectedRoute`는 위에서부터 순서대로 검사하며, 먼저 걸리는 조건이 이깁니다.

1. `isLoading` → `LoadingScreen` (세션 복원 중 깜빡임 방지)
2. `!user` → `/`
3. `memberOnly && isAnonymous` → `/` (게스트 차단)
4. `adminOnly && role !== "admin"` → `/home`
5. `!setupPage && !adminOnly && memberOnly && 프로필 이름 없음` → `/member/setup`

4번과 5번의 상호작용에 주의하세요. `adminOnly` 라우트는 프로필 완성 검사를 건너뛰므로, 관리자는 이름 없이도 관리자 페이지에 들어갈 수 있습니다.

권한의 근거는 `authStore`의 `userProfile.role`이며, 이 값은 `user_profiles` 테이블에서 옵니다. 클라이언트 상태이므로 **UI 가드일 뿐 보안 경계가 아닙니다.** 실제 차단은 RLS의 admin 정책이 합니다([data-model.md](data-model.md) 참고).

## 익명(게스트) 로그인

Supabase 익명 로그인을 쓰며 `user.is_anonymous`로 구분합니다. 현재 라우터에 게스트가 들어갈 수 있는 보호 라우트는 없습니다 — 모든 `Layout` 하위가 `memberOnly`입니다. 게스트용 청구 폼(`/guest/form`)은 과거에 있었으나 지금은 없습니다.

## 하단 탭

[src/components/BottomNav.tsx](../src/components/BottomNav.tsx)가 다섯 칸을 렌더합니다.

```
홈 · 소모임 · (갤러리 | 관리자) · 찬양팀 · 내정보
```

두 번째 칸은 원래 행사였지만 소모임에 자리를 내줬습니다 (행사보다 빈도가 높다는 판단). `/events` 라우트는 그대로라 **행사는 홈에서만 진입**합니다.

세 번째 칸은 `role === "admin"`이면 갤러리 대신 관리자 탭으로 바뀝니다. 각 탭은 `nav/creatures.tsx`의 캐릭터 아이콘을 갖고, 마우스를 따라 눈동자가 움직이며 랜덤하게 깜빡입니다.

색은 **활성=액센트 퍼플, 비활성=회색**입니다. 탭별로 색이 달랐던 옛 방식은 폐기됐습니다. 비활성 탭은 `color` prop 자체를 회색으로 넘기는데, 캐릭터 눈동자가 이 prop을 쓰기 때문에 퍼플을 항상 넘기면 비활성 탭에도 퍼플 눈동자가 남아 "퍼플=상호작용" 규칙이 깨지기 때문입니다.
