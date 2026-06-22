# 나누리 (Nanuri) – 청년부 비용 청구서 작성 앱

교회 청년부의 회계 관리, 비용 청구, 설문/투표, 예배 일정 공유를 한 곳에서 처리하는 웹 애플리케이션입니다. 멤버는 영수증을 찍어 비용을 청구하고, 관리자(회계)는 청구 내역을 정리해 회계 리포트를 생성합니다.

## 주요 기능

- **비용 청구 (Bill)**: 멤버 본인 청구(`/member/form`)와 게스트 청구(`/guest/form`)를 분리 지원
- **영수증 처리**: 업로드 전 클라이언트에서 이미지 압축(`browser-image-compression`) 후 Cloudflare Worker + R2로 저장
- **회계 리포트**: 청구 내역을 기간별 리포트로 집계, 카테고리별 합계 제공, CSV 내보내기(`papaparse`) 지원
- **설문 / 투표**: 관리자가 설문을 만들어 배포하고 결과를 집계, 멤버 투표 기능 별도 제공
- **예배 일정**: 예배 일정 페이지 제공
- **메뉴판 인식**: 메뉴판 이미지를 업로드하면 Claude API(Anthropic SDK)로 메뉴 항목을 자동 추출
- **위치 정보 처리**: 사진 EXIF에서 GPS 좌표 추출 후 Cloudflare Worker를 통한 역지오코딩
- **인증/권한**: Supabase Auth 기반, 멤버 전용 / 게스트 전용 / 관리자 전용 라우트를 `ProtectedRoute`로 분리 제어
- **익명 닉네임 생성**: 게스트용 랜덤 닉네임(형용사+동물+이모지) 자동 생성

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| 상태 관리 | Zustand |
| 데이터 패칭 | TanStack Query, React Hook Form |
| 라우팅 | React Router v7 |
| Backend / DB | Supabase (Auth, Postgres) |
| 파일 저장 | Cloudflare Workers + R2 |
| AI | Anthropic Claude API (메뉴 추출) |
| 기타 | exifr (EXIF 파싱), browser-image-compression, papaparse |
| 배포 | Vercel (프론트엔드), Cloudflare Workers (업로드/지오코딩 API) |

## 프로젝트 구조

```
src/
├── components/        # 공용 컴포넌트 (Navbar, ProtectedRoute, LoadingScreen 등)
│   └── ui/             # 버튼, 인풋, 캐러셀 등 UI 프리미티브
├── hooks/              # 데이터 패칭/도메인 로직 커스텀 훅
│   ├── useAccountingCategories.ts
│   ├── useAccountingReport.ts
│   ├── useActiveSurveys.ts
│   ├── useFormSubmit.ts
│   ├── useReceiptUpload.ts
│   └── useWorshipSchedule.ts
├── lib/                 # 외부 연동 / 유틸리티
│   ├── supabase.ts        # Supabase 클라이언트
│   ├── uploadReceipt.ts    # 영수증 압축 + Worker 업로드
│   ├── extractGps.ts       # 이미지 EXIF GPS 추출
│   ├── reverseGeocode.ts   # 좌표 → 주소 변환 (Worker 경유)
│   ├── extractMenus.ts     # Claude API로 메뉴판 이미지 → 메뉴 목록 추출
│   └── generateNickname.ts # 게스트 닉네임 생성
├── pages/
│   ├── auth/             # 로그인 / 게이트 페이지
│   ├── bill/             # 멤버/게스트 비용 청구 폼
│   ├── accounting/       # 회계 리포트 목록/상세/생성
│   ├── survey/           # 설문 생성/배포/응답/결과
│   ├── vote/             # 투표 목록/응답
│   └── worship/          # 예배 일정
├── router/              # React Router 라우트 정의
└── store/               # Zustand 전역 상태 (인증)

worker/                  # Cloudflare Worker (영수증 업로드/삭제, 역지오코딩 API)
supabase/                 # Supabase 프로젝트 설정 (config.toml)
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 아래 값을 채워주세요.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ANTHROPIC_API_KEY=
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

영수증 업로드/삭제와 역지오코딩을 담당하는 별도 백엔드입니다. `worker/wrangler.toml`을 환경에 맞게 설정한 뒤 배포합니다.

```bash
cd worker
npx wrangler deploy
```

## 배포

- 프론트엔드: Vercel (`vercel.json`에 SPA rewrite 설정 포함)
- API: Cloudflare Workers

## 라이선스

비공개 프로젝트입니다. (별도 라이선스 명시 전까지 무단 배포/사용을 금합니다.)
