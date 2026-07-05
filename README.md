# 나누리 (Nanuri) – 청년부 커뮤니티 앱

교회 청년부의 행사(모임) 운영, 비용 청구, 찬양팀 일정을 한 곳에서 처리하는 모바일 웹 애플리케이션입니다. 관리자는 행사를 만들고 순서(세그먼트)를 구성하며, 멤버는 행사 정보를 확인하고 타임라인을 보고, 진행된 순서에 대해 익명으로 만족도를 평가할 수 있습니다.

## 주요 기능

### 1. 행사 관리 (Event)
핵심 기능입니다. 관리자는 행사를 생성하고(`EventBuilderPage`), 진행 순서를 세그먼트 단위로 구성합니다(`EventSegmentsPage`, `@dnd-kit`으로 드래그 앤 드롭 정렬). 멤버는 행사 목록(`EventListPage`)과 상세 정보(`EventInfoPage`), 시작 시각 기준으로 계산된 타임라인(`EventTimelinePage`)을 확인할 수 있습니다. 각 순서가 끝나면 3단계(불만족/평범/만족) 익명 만족도 평가를 남길 수 있고, 관리자는 이를 집계해 결과(`EventResultsPage`)로 확인합니다. 행사 상태(예정/진행중/완료)는 날짜·시작 시각·총 소요 시간을 기준으로 자동 계산됩니다.

### 2. 비용 청구
멤버가 영수증을 업로드해 비용을 청구합니다(`BillFormPage`). 이미지는 업로드 전 클라이언트에서 압축(`browser-image-compression`)된 뒤 Cloudflare Worker를 거쳐 R2에 저장됩니다.

### 3. 찬양팀 일정
포지션별(인도자, 싱어, 피아노, 어쿠스틱, 베이스, 일렉, 드럼, PPT 등) 참여 가능 여부를 멤버가 직접 등록합니다(`WorshipSchedulePage`, `PositionSlot`).

### 4. 갤러리
행사·모임 사진을 모아보는 갤러리 페이지입니다(`GalleryPage`).

### 5. 인증 및 권한
Supabase Auth 기반으로 멤버 로그인(`MemberLoginPage`)과 최초 프로필 설정(`MemberProfileSetupPage`)을 거칩니다. `ProtectedRoute`가 멤버 전용 / 관리자 전용 / 설정 미완료 라우트를 분리 제어합니다.

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| 상태 관리 | Zustand |
| 데이터 패칭 | TanStack Query, React Hook Form |
| 라우팅 | React Router v7 |
| 드래그 앤 드롭 | dnd-kit (행사 순서 정렬) |
| 애니메이션 | motion (Framer Motion) |
| Backend / DB | Supabase (Auth, Postgres) |
| 파일 저장 | Cloudflare Workers + R2 |
| 기타 | exifr, browser-image-compression, papaparse |
| 배포 | Vercel (프론트엔드), Cloudflare Workers (업로드 API) |

## 프로젝트 구조

```
src/
├── components/
│   ├── nav/                # 하단 내비게이션 관련
│   ├── ui/                 # 버튼, 인풋, 무드 평가 등 UI 프리미티브
│   ├── worship/             # PositionSlot 등 찬양팀 관련 컴포넌트
│   ├── BackButton.tsx
│   ├── BottomNav.tsx
│   ├── ConfirmDialog.tsx
│   ├── EventInfoView.tsx
│   ├── Layout.tsx
│   ├── LoadingScreen.tsx / LoadingSpinner.tsx
│   ├── PageContainer.tsx / PageHero.tsx
│   └── ProtectedRoute.tsx
├── constants/               # banks, theme(TAB_COLORS), worship 관련 상수
├── hooks/
│   ├── useAccountingCategories.ts / useAccountingReport.ts  # (미연결)
│   ├── useCalendar.ts
│   ├── useEvents.ts          # 행사 목록/상세/타임라인/결과 쿼리
│   ├── useReceiptUpload.ts
│   ├── useToggleAvailability.ts
│   └── useWorshipSchedule.ts
├── lib/
│   ├── supabase.ts            # Supabase 클라이언트
│   ├── supabaseList.ts
│   ├── uploadReceipt.ts       # 영수증 압축 + Worker 업로드
│   ├── deleteImage.ts
│   ├── eventColor.ts / eventStatus.ts / eventTime.ts  # 행사 상태/타임라인 계산
│   ├── mood.ts                 # 3단계 만족도 정의 및 집계
│   └── generateNickname.ts     # 게스트 닉네임 생성
├── pages/
│   ├── auth/                  # GatePage, MemberLoginPage
│   ├── admin/
│   │   ├── AdminPage.tsx        # 행사 관리 / 재정 관리 탭
│   │   └── event/               # EventBuilder, EventDetail, EventSegments, EventResults
│   ├── event/                  # EventListPage, EventInfoPage, EventTimelinePage
│   ├── accounting/               # (미사용, iOS 앱으로 이관 예정) List/Detail/Report
│   ├── bill/                    # BillFormPage
│   ├── worship/                 # WorshipSchedulePage
│   ├── GalleryPage.tsx
│   ├── HomePage.tsx
│   ├── ProfilePage.tsx
│   └── MemberProfileSetupPage.tsx
├── router/                   # React Router 라우트 정의
├── store/                     # Zustand 전역 상태 (인증)
└── types/                     # event.ts, worship.ts

worker/                        # Cloudflare Worker (영수증 업로드/삭제 API)
supabase/
├── config.toml
└── migrations/                # events, event_segments, event 관련 스키마 마이그레이션
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 아래 값을 채워주세요.

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_CF_WORKER_URL=
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 빌드 / 미리보기

```bash
npm run build
npm run preview
```

## Cloudflare Worker

영수증 업로드/삭제를 담당하는 별도 백엔드입니다. `worker/wrangler.toml`을 환경에 맞게 설정한 뒤 배포합니다.

```bash
cd worker
npx wrangler deploy
```

## 배포

- 프론트엔드: Vercel (`vercel.json`에 SPA rewrite 설정 포함)
- API: Cloudflare Workers

## 관련 프로젝트

회계·재정 관리 기능은 별도의 iOS 앱(Swift)으로 분리되어 있습니다. 해당 저장소는 비공개(private)로 관리 중입니다.

## 라이선스

비공개 프로젝트입니다. (별도 라이선스 명시 전까지 무단 배포/사용을 금합니다.)
