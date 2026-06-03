## 환경 변수

프로젝트 루트에 `.env` 파일을 생성하고 아래 값을 입력하세요.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_CF_WORKER_URL=
```

## 시작하기

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 배포

- **Web**: Vercel
- **이미지 스토리지**: Cloudflare Workers + R2
- **Database**: Supabase
