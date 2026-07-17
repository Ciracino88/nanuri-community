# CLAUDE.md

나누리(Nanuri) — 교회 커뮤니티 앱. React + TypeScript + Vite, Supabase(Postgres·Auth·Realtime),
Tailwind v4, TanStack Query, Zustand, motion/react.

## 먼저 읽을 것

**[docs/README.md](docs/README.md)가 문서 인덱스입니다.** 이 프로젝트는 설계 근거를 `docs/`에
의도적으로 관리합니다 — 방치된 문서가 아니니 추측하기 전에 찾아보세요.

작업 성격별로 시작점이 다릅니다.

| 하려는 일 | 먼저 볼 것 |
| --- | --- |
| **화면을 손댄다** | [docs/design.md](docs/design.md) — 필수. 아래 참고 |
| 부품을 만든다 | [docs/conventions.md](docs/conventions.md) — 이미 있는 걸 또 만들지 않기 위해 |
| DB·RLS를 건드린다 | [docs/data-model.md](docs/data-model.md) |
| 지금 상태가 궁금하다 | [docs/status.md](docs/status.md) |

### 화면 작업 전 design.md를 보는 이유

값마다 **"원티드 확인값"인지 "우리 값"인지** 구분해 두었습니다. 그게 판단 근거입니다.

**코드 주석보다 design.md가 상위 근거입니다.** 실제로 `ui/Button.tsx` 주석이 "플로팅 버튼은
알약 예외"라는 근거 없는 규칙을 만들어 뒀고, design.md(칩·배지·아바타만 `rounded-full`)가
맞았습니다. 코드와 문서가 어긋나면 대개 코드가 틀린 쪽입니다.

## 지금 앱이 어중간한 상태입니다

원티드 디자인 시스템 전면 개편이 진행 중입니다. **소모임 화면과 하단 탭바만** 새 디자인으로
넘어갔고 나머지 화면은 대기입니다. 그래서 탭으로 이동하면 옛 디자인 화면이 뜨는데 버그가
아닙니다 — [docs/README.md](docs/README.md#먼저-읽을-것)에 설명이 있습니다.

하단 탭바는 **떠 있는 글래스 캡슐**로 붙였습니다(소모임·찬양팀·내정보). 화면 하단에 캡슐이
떠서 콘텐츠 위에 겹치므로, 새 화면을 그릴 땐 `PAGE_BOTTOM_PAD`로 하단을 비우세요
([docs/design.md](docs/design.md) 하단 탭바 참고).

## 명령

```bash
npm run dev      # Vite 개발 서버 (5173)
npm run build    # tsc -b && vite build — 타입 에러면 실패
npm run lint     # eslint. 기존 4건(에러 3·경고 1)이 남아 있습니다 — 리디자인 이전부터입니다
```

⚠ **CSS 토큰이 없어지는 건 타입 에러가 아닙니다.** Tailwind가 클래스를 조용히 안 만들 뿐이라
빌드는 통과하고 화면만 무스타일로 뜹니다.

## 이 작업 환경의 제약

**Docker도 psql도 없습니다.** `supabase db reset`·`db dump`가 안 돌아갑니다.

⚠ `db dump`는 Docker가 없으면 **빈 파일을 남기고 실패**합니다. 그 파일을 세면 "0행"이 나와
"데이터 없음"으로 오독하기 쉽습니다. 원격 데이터 확인이 필요하면 대시보드 SQL 에디터를
쓰세요.

### DB 비밀번호

`db push`·`db pull`은 `SUPABASE_DB_PASSWORD`를 요구합니다. `.env.local`에 있습니다
(`.gitignore`의 `.env*`에 걸립니다). **셸이 읽어 CLI에 넘기는 이 패턴으로만** 씁니다:

```bash
set -a; . ./.env.local; set +a; npx supabase db push --dry-run
```

**파일을 열거나 값을 출력하지 마세요** — `cat`·`echo`·`set -x` 전부. 한 번이라도 출력하면
프로덕션 DB 평문 비밀번호가 터미널 기록과 에이전트 대화 로그에 남습니다. AI 에이전트에게
시킬 때 특히 그렇습니다 — 컨텍스트가 요약되고 저장됩니다.

### db push 전에

**`--dry-run`을 먼저 보세요.** 이 저장소엔 `drop cascade` 후 재생성하는 파괴적 마이그레이션이
둘(`events_v2` · `gatherings_v2`) 있습니다. 둘 다 적용됐으니 정상이면 목록에 안 뜹니다 —
**뜬다면 데이터가 날아간다는 신호입니다.**

## 코드 규칙

주석과 UI 문자열은 **한국어**입니다. 나머지는 [docs/conventions.md](docs/conventions.md).

## 문서를 같이 갱신하세요

코드를 바꿨으면 해당 문서도 고칩니다. 특히 [docs/status.md](docs/status.md)가 가장 빨리 낡습니다.
**"적용됨/미적용" 같은 시점 서술은 드리프트하니 문서를 믿지 말고 확인하세요** — 실제로
status.md가 이미 적용된 마이그레이션을 "미적용"이라고 한 채 남아 있었습니다.
