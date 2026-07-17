# 데이터 모델

## 마이그레이션 현황 ⚠️

`supabase/migrations/`에는 **행사와 소모임 테이블만** 있습니다. `user_profiles`, `bills`, `worship_*`은 코드에서 쓰지만 `create table`이 없어 원격 DB에만 존재합니다(`user_profiles`는 권한을 조이는 마이그레이션만 있고 테이블 정의는 없습니다). 즉 이 저장소만으로는 DB를 처음부터 재현할 수 없습니다. 아래 스키마 중 마이그레이션이 없는 테이블은 코드의 쿼리에서 역으로 추정한 것이라 실제와 다를 수 있습니다.

```bash
# 원격 스키마를 파일로 내려받아 이 공백을 메울 수 있습니다
npx supabase db pull
```

## 테이블

### ~~행사~~ 삭제됨 (마이그레이션: `20260701000000_events_v2.sql` 생성 → `20260717030000_drop_event_tables.sql` 삭제)

> **행사 기능은 코드·테이블 모두 제거됐습니다**([status.md](status.md#행사)). 코드는 8a5c1ac 에서,
> `events`·`event_segments` 테이블은 2026-07-17
> [`20260717030000_drop_event_tables.sql`](../supabase/migrations/20260717030000_drop_event_tables.sql)로
> 지웠습니다(원격의 9건은 전부 테스트 데이터였습니다). 아래 스키마는 기록용입니다.

**`events`**

| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| `id` | uuid PK | |
| `title` | text NOT NULL | |
| `event_date` | date NOT NULL | 이후 마이그레이션에서 **text로 변경**됨 (아래 참고) |
| `start_time` | time | 모이는 시각. 순서별 시작 시각 계산의 기준 |
| `place_name` | text | |
| `image_url` | text | 포스터 |
| `banner_url` | text | `20260702000000_event_banner.sql`에서 추가 |
| `emoji` | text | 대표 이모지 |
| `description` | text | |
| `details` | jsonb `[]` | 상세표 `[{ label, value }]` |
| `results_public` | boolean `false` | 참여자에게 평가 결과 공개 여부. **코드에서는 제거됨** — 평가 기능 폐기([status.md](status.md)). 컬럼은 DB 에 남아 있음 |

`event_date`는 `20260701020000_event_date_text.sql`에서 text가 되었습니다. `"2021.05.20"` 또는 `"2021.05.20~2021.05.22"`처럼 기간 표기를 허용하기 위한 것으로, 파싱은 `lib/eventTime.ts`의 `parseStartDate()`가 담당합니다(`~` 앞의 시작일만 사용). 날짜 정렬·비교를 DB에 맡길 수 없다는 뜻이기도 합니다.

**`event_segments`** — 행사 순서(타임라인)

| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| `id` | uuid PK | |
| `event_id` | uuid → `events` | ON DELETE CASCADE |
| `duration_min` | int `30` | 소요 시간(분). 절대 시각이 아닌 **길이**로 저장 |
| `title` | text NOT NULL | |
| `description` | text | |
| `sort` | int `0` | 순서 |

인덱스: `(event_id, sort)`

**~~`segment_evaluations`~~ 삭제됨** — 순서별 익명 평가. 기능이 폐기돼([status.md](status.md)) 읽고 쓰는
코드가 없어졌고, 2026-07-17 [`20260717020000_drop_dead_tables.sql`](../supabase/migrations/20260717020000_drop_dead_tables.sql)로
테이블·정책·Realtime 퍼블리케이션을 정리했습니다.

**~~`event_participants`~~ 삭제됨** — "내 일정에 추가"용으로 만들었으나 조회하는 코드가 한 번도
없어 같은 마이그레이션으로 지웠습니다.

### 소모임 (마이그레이션 있음 — 근거: `20260717000000_gatherings_v2.sql`)

> 이 스키마는 원격에 적용돼 있습니다(`db push` 완료). 아래 서술이 현재 원격의 사실입니다.

**`gatherings`**

| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| `id` | uuid PK | |
| `kind` | text NOT NULL `'oneday'` | `'oneday'` \| `'challenge'`. 상태 계산 규칙을 고르는 스위치 |
| `title` | text NOT NULL | |
| `description` | text | |
| `gathering_at` | timestamptz | 모이는 시각. **챌린지는 null** (아래 참고) |
| `place_name` | text | 참가자 누구나 수정 가능 (RPC 로만) |
| `place_updated_by` | uuid → `auth.users` | SET NULL. 마지막에 고친 사람 |
| `place_updated_at` | timestamptz | |
| `category_id` | uuid → `gathering_categories` | SET NULL — 카테고리가 지워져도 소모임은 남는다 |
| `thumbnail_url` | text | 없으면 카테고리 이모지, 그것도 없으면 기본 아이콘 |
| `leader_id` | uuid → `auth.users` | **SET NULL**. 개설자이자 리더. **불변이 아님 — 넘어간다** |
| `closed_at` | timestamptz | 참여 신청 마감. 종료가 아님 |
| `ended_at` | timestamptz | 종료 |
| `created_at` | timestamptz `now()` | |

인덱스: `(gathering_at desc nulls first)` — 챌린지가 상단, `(leader_id)`, `(kind)`, `(category_id)`

**`emoji` 컬럼은 없습니다.** 1단계에는 있었습니다 — 썸네일도 카테고리도 없던 시절 카드의 유일한 시각 식별자였기 때문입니다. 둘 다 생긴 지금은 한 소모임에 이모지가 두 번 붙는 꼴이라(아이콘 ☕ + 카테고리 ☕️ 카페) 같은 걸 두 번 고르게 하는 셈이었습니다. 이모지 고르기는 **카테고리를 만들 때**로 옮겼습니다.

**`gathering_categories`** — 카테고리

| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| `id` | uuid PK | |
| `emoji` | text NOT NULL | 썸네일 없는 카드의 아이콘이 된다 |
| `label` | text NOT NULL **unique** | 같은 이름을 두 번 못 만든다 |
| `created_by` | uuid → `auth.users` | SET NULL |

**멤버가 직접 만들 수 있어서 테이블입니다.** 처음엔 코드 상수(`constants/gatheringCategories.ts`)였습니다 — 이모지·라벨이 어차피 코드에 있어야 하니 DB 에도 목록을 두면 두 진실이 갈라진다는 이유로 check 제약도 안 걸었습니다. 사용자 생성이 들어오면서 그 논리가 무너졌고, 이제 **DB 가 목록의 유일한 주인이고 코드는 읽기만 합니다.** 기본 8개는 마이그레이션이 심습니다.

`update`·`delete` 정책은 **주지 않습니다.** 남이 쓰고 있는 카테고리를 만든 사람이 지우거나 이름을 바꾸면 그걸 단 소모임들이 통째로 흔들립니다. 만들면 남습니다.

#### 난립을 삭제로 풀지 않습니다

자유 생성이라 "카페"·"커피"·"카페모임"이 각각 생길 수 있고, 그러면 필터 칩 행이 무한히 길어져 필터로서 쓸모가 없어집니다.

**목록 필터 칩은 소모임이 실제로 달린 카테고리만 띄웁니다**(`usedCategories`). 아무도 안 쓰는 카테고리는 저절로 안 보이므로 삭제·정리 로직이 아예 필요 없습니다. 걸러봐야 빈 목록이라 필터의 목적상 그게 맞기도 합니다. 개설 화면에서는 전부 보여줍니다 — 거기서는 고르는 게 목적이니까요.

**행사(`events`)를 확장하지 않고 별도 테이블로 간 이유**가 1단계 마이그레이션 주석에 남아 있습니다. `events`는 admin 전용이라 한 테이블에 합치면 멤버가 `kind='event'`로 행사를 만드는 권한 승격 경로가 열리고(RLS는 행만 막고 컬럼은 못 막습니다), `events.event_date`가 text인 부채도 그대로 상속하게 됩니다.

#### 성격(`kind`)이 태그가 아닌 이유

**원데이**는 한 번 모이는 번개고, **챌린지**는 기한 없이 지속되는 모임입니다(성경 통독반, 저녁 마라톤).

챌린지에는 "모이는 시각"이 없습니다. 그래서 `gathering_at`이 nullable 이고, check 제약으로 못 박혀 있습니다 — 원데이는 반드시 있고 챌린지는 반드시 없습니다. 1단계의 `not null`을 그대로 뒀다면 통독반이 `gathering_at`을 지나는 순간 자동으로 "종료"가 됩니다(다음 날 끝나버립니다).

**그래서 `kind`는 카테고리 값으로 뺄 수 없습니다.** 카테고리(☕️ 카페)는 표시만 하는 텍스트라 아무 동작도 안 바꾸지만, `kind`는 어느 상태 규칙을 쓸지 고르는 스위치입니다.

| | 원데이 | 챌린지 |
| --- | --- | --- |
| `done` (종료) | `gathering_at` 지남 — **시간이** 끝낸다 | `ended_at` — **사람이** 끝낸다 |
| `closed` (마감) | `closed_at` — 명단 확정 | `closed_at` — 진도 때문에 더 안 받음 |
| `open` | 그 외 | 그 외 |

`ended_at`이 챌린지 쪽에서 `gathering_at`의 자리를 대신하는 대칭 구조입니다. 덕분에 `closed_at`의 뜻("신청 마감")을 `kind` 별로 재해석하지 않아도 됩니다 — 같은 컬럼이 행마다 다른 뜻이 되면 반드시 물립니다.

상태 판정은 DB 가 아니라 `lib/gatheringTime.ts`의 `computeGatheringStatus()`가 계산합니다.

#### 리더는 넘어간다 (`leader_id`)

1단계의 `created_by`는 "개설자일 뿐 리더가 아님"이었고 **불변**이었습니다. 둘 다 뒤집혔습니다. 개설자 = 리더고, 자리가 넘어갑니다. 그래서 이름도 바뀌었습니다 — `created_by`가 불변이라는 건 거의 모든 개발자가 무의식적으로 까는 전제라, 넘어가는 컬럼에 그 이름을 두면 누군가 `where created_by = auth.uid()`를 "내가 만든 모임"으로 읽고 틀린 결과를 받습니다.

**`on delete cascade` → `set null` 이 이 변경의 핵심입니다.** 1단계에서는 리더가 계정을 지우면 소모임 행이 삭제되고, `gathering_participants`가 `gatherings`를 CASCADE 로 물고 있어 참여자 기록까지 함께 날아갔습니다. 두 시간짜리 번개에서는 합리적이었지만 **무기한 챌린지에서는 정반대**입니다 — 통독반 반년치가 한 사람 탈퇴로 증발합니다. 모임이 리더보다 오래 살아야 합니다.

**`gathering_participants`** — 참여

`unique (gathering_id, user_id)` — 한 사람이 한 소모임에 한 번만. 인덱스는 `(gathering_id, created_at)`, `(user_id)`. 앞의 인덱스에 `created_at`이 붙은 건 **리더 승계 순서**(가장 먼저 들어온 사람)를 받기 위해서입니다.

`capacity`(정원)와 `attended`(출석)는 **의도적으로 없습니다.** 정원이 없으면 동시 신청 경합 문제가 통째로 사라지고, 참여 = 신청이라 사후 출석 체크가 성격에 맞지 않습니다.

**`gathering_reviews`** — 후기

| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| `gathering_id` | uuid → `gatherings` | CASCADE |
| `user_id` | uuid → `auth.users` | **SET NULL** — 후기는 멤버십이 아니라 기록이라 사람이 떠나도 남는다 |
| `content` | text NOT NULL | |

`user_id`가 참여(CASCADE)와 다른 이유는 성격이 달라서입니다 — 안 오는 사람이 명단에 남을 이유는 없지만, 후기는 쓴 사람이 떠나도 남는 글입니다. `segment_evaluations`가 같은 선택을 했습니다.

한 사람이 여러 개 쓸 수 있습니다(unique 제약 없음). 무기한 챌린지에서는 후기가 회차마다 쌓이는 게 자연스럽기 때문입니다.

⚠ 리더가 소모임을 삭제하면 후기도 CASCADE 로 함께 사라집니다 — **남이 쓴 글이 리더 손에 지워집니다.** 확인 다이얼로그에서 "참여자 N명, 후기 M개가 함께 삭제됩니다"를 보여줘야 합니다.

**`gathering_review_likes`** — 후기 좋아요

| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| `review_id` | uuid → `gathering_reviews` | CASCADE. `user_id` 와 함께 **복합 PK** |
| `user_id` | uuid → `auth.users` | **CASCADE** — 후기(SET NULL)와 다르다 |

`user_id` 가 후기(SET NULL)와 반대로 CASCADE 인 이유는 성격이 달라서입니다 — 후기는 사람이 떠나도 남는 **기록**이지만, 좋아요는 살아있는 **반응** 신호라 계정이 사라지면 의미가 없습니다(참여 `gathering_participants` 와 같은 선택). `(review_id, user_id)` 복합 PK 가 "한 사람이 한 후기에 좋아요 하나"를 강제하므로 unique 제약을 따로 걸지 않고, 중복 insert 는 `upsert(ignoreDuplicates)` 로 조용히 무시됩니다.

좋아요 테이블에는 `gathering_id` 가 없습니다(후기가 이미 모임에 매여 있으므로 비정규화하지 않았습니다). 그래서 조회는 후기 id 목록으로 `.in("review_id", ...)` 하고, Realtime 은 모임으로 필터하지 못해 어느 모임의 좋아요든 해당 모임 후기 쿼리를 다시 부릅니다 — 교회 규모에선 무시할 만한 비용입니다([`useGatheringReviews`](../src/hooks/useGatheringReviews.ts) 참고).

#### 리더 승계 — 규칙이 앱이 아니라 DB 에 있는 이유

리더가 사라지는 경로는 둘이고 **성격이 다릅니다.**

1. **모임 나가기** — 앱이 부릅니다. `gathering_participants` 행이 지워집니다.
2. **계정 삭제(admin)** — FK 액션이라 **DB 가 자동으로 하고 앱 코드를 안 거칩니다.**

규칙을 앱에 두면 2번이 그냥 지나가 리더 없는 모임이 남습니다. 앱에 탈퇴 기능은 없지만(2026-07-17 확인) admin 이 대시보드에서 사람을 지우는 경로는 실재합니다. 그래서 `ensure_gathering_leader()` 함수 하나에 규칙을 모으고 두 경로가 같은 함수로 들어오게 했습니다.

- 리더가 나가면 **가장 먼저 들어온 참가자**가 이어받습니다.
- 아무도 안 남으면 **삭제가 아니라 종료**(`ended_at`)입니다. 아무도 없다는 건 "이 모임 안 함"이지 "이 모임 없었음"이 아니고, 삭제하면 후기까지 증발합니다.

**함수 안의 `auth.users` 존재 확인이 load-bearing 입니다.** admin 이 사용자를 지우면 FK 액션 두 개가 같은 문장에서 발동합니다 — `gatherings.leader_id → set null`, `gathering_participants.user_id → cascade`. **둘의 순서는 보장되지 않습니다.** `gatherings`가 먼저 처리되면 트리거가 도는 시점에 지워지는 중인 사람의 참가자 행이 아직 살아 있어서, 하필 그 사람을 새 리더로 승격시킵니다.

트리거 재귀는 `when (new.leader_id is null and old.leader_id is not null)` 조건이 끊습니다.

#### RPC — 컬럼을 좁혀야 하는 쓰기

**RLS 는 행만 막고 컬럼은 못 막습니다.** `gatherings` UPDATE 를 참가자에게 열면 `place_name`만이 아니라 제목·`kind`·`ended_at`까지 바꿀 수 있습니다 — 남의 모임을 임의로 종료시킬 수 있다는 뜻입니다. `user_profiles` 작업에서 컬럼 단위 REVOKE 가 조용히 무시된 전례도 있습니다(아래 참고).

그래서 UPDATE 정책은 리더로 잠근 채 두고, 좁은 쓰기는 **함수 본문이 컬럼을 물리적으로 한정**합니다.

| 함수 | 누가 | 무엇을 |
| --- | --- | --- |
| `update_gathering_place(id, place)` | 참가자 누구나 | `place_name` + `place_updated_by/at` |
| `transfer_gathering_leader(id, new)` | 리더만 | `leader_id` — **넘겨받는 사람이 참가자인지 검사** |

위임을 RPC 로 뺀 이유가 하나 더 있습니다. 1단계 정책이 `with check (created_by = auth.uid())`로 **위임을 의도적으로 막고 있었는데**, 이걸 그냥 풀면 리더가 `leader_id`를 참가자도 멤버도 아닌 아무 uuid 로 던져놓고 모임을 유기할 수 있습니다.

`gathering_managers` 같은 **매니저 테이블은 만들지 않았습니다.** 리더가 하나고 그 자리가 넘어가는 모델이면 필요가 없습니다. `gathering_participants`에 `role` 컬럼을 넣는 것도 피했습니다 — 그러면 권한 부여가 곧 UPDATE 인데, 그 테이블에 UPDATE 정책이 열리는 순간 RLS 가 컬럼을 못 막아 **참가자가 자기 `role`을 스스로 리더로 올릴 수 있습니다.**

#### 챌린지 장소가 매번 바뀌는 문제

챌린지는 장소가 회차마다 바뀝니다(오늘 한강, 다음 주 올림픽공원). 지금은 `place_name` **덮어쓰기 + 누가 언제 고쳤나**로 버팁니다. 마지막에 쓴 사람이 이기지만, `place_updated_by/at`이 책임 소재는 남깁니다.

"매번 바뀐다"에는 **회차 개념이 숨어 있습니다.** 회차 테이블까지 가는 건 지금 과합니다 — 진짜 필요해지면 그때 붙입니다.

### 그 외 (마이그레이션 없음 — 2026-07-16 원격 DB 조회로 확인)

| 테이블 | 사용처 | 비고 |
| --- | --- | --- |
| `user_profiles` | `authStore`, RLS admin 판정 | `id`, `name`, `account_number`, `bank_name`, `role`, `officer_role`, `position[]`, `avatar_url`, `team`, `phone`, `created_at`. `role` 기본값 `'member'` |
| `bills` | `BillFormPage` | 비용 청구 내역 |
| `worship_schedules` | `useWorshipSchedule` | `date` (unique) — 주일 날짜 |
| `worship_availability` | `useWorshipSchedule`, `useToggleAvailability` | `schedule_id`, `user_id`, `position`, `available` |

**`accounting_*` 테이블은 DB 에 존재하지 않습니다.** 이 이름으로 쿼리하던 `pages/accounting/`과
회계 훅들은 삭제됐습니다([status.md](status.md)) — 원격에는 `finance_ledgers`, `finance_reports`,
`finance_splits`, `finance_transactions` 가 있어 이름이 바뀐 뒤 코드가 안 따라간 것으로 보입니다.
회계는 iOS 앱으로 이관 예정이라 웹에서 되살릴 계획이 없습니다.

코드에서 쓰지 않지만 원격에 **살아있는 데이터가 있어 남긴** 테이블: `bible_words`(8172행),
`event_items`(19행·계속 수정됨), `event_tasks`(12행), `finance_*`. 이 저장소가 안 쓸 뿐 다른
시스템(회계는 iOS 앱, 나머지도 별도 행사 시스템으로 추정)이 관리하는 남의 데이터입니다.

⚠ **웹이 안 쓴다는 것만으로 drop 하지 마세요.** 대시보드 `pg_stat_user_tables`로 행 수·누적
쓰기(`n_tup_ins/upd/del`)를 보고, 정말 비어 있고(행 0 + 누적 쓰기 0) 참조 FK 도 없는 것만
지웁니다. 지금까지 그 기준으로 지운 것:

| 마이그레이션 | 지운 테이블 | 근거 |
| --- | --- | --- |
| `20260717020000_drop_dead_tables.sql` | `segment_evaluations`·`event_participants` | 웹 전용, 폐기 확정 |
| `20260717030000_drop_event_tables.sql` | `events`·`event_segments` | 행사 기능 제거, 9행은 테스트 데이터 |
| `20260718000000_drop_empty_event_tables.sql` | `event_budget_items`·`event_registrations` | 행 0 + 누적 쓰기 0 + 참조 FK 없음 |

모든 public 테이블에 RLS는 켜져 있습니다.

`role`은 `user_profiles`의 text 컬럼이고 `'admin'` 값이 관리자를 뜻합니다. RLS 정책 다수가 이 컬럼을 참조하므로 사실상 권한 체계의 뿌리입니다.

## user_profiles 권한 (2026-07-16 강화)

`role`·`officer_role`은 `anon`/`authenticated` 어느 쪽에도 쓰기 권한이 없습니다. 이 컬럼을 코드에서 쓰지 않고, 역할 변경은 대시보드(postgres)에서 합니다. 예전에는 아무 멤버나 자기 `role`을 `admin`으로 바꿀 수 있었습니다.

**컬럼 권한을 다룰 때 주의**: 이 테이블에는 테이블 단위 권한(`arwdDxtm`)이 부여돼 있어 **컬럼 단위 REVOKE가 조용히 무시됩니다.** 테이블 단위로 회수한 뒤 컬럼별로 재부여해야 합니다.

타인의 이름·아바타는 `public_profiles` 뷰(`id, name, avatar_url, position, team`)로만 읽습니다. `user_profiles` 직접 조회는 본인 행으로 제한되며, 계좌·연락처는 그 경로로만 나갑니다. 뷰는 `security_invoker = off`(기본값)라 소유자 권한으로 실행되어 밑단 RLS를 우회하고 컬럼으로만 노출을 제한합니다.

전체 조회 정책(`로그인 유저 프로필 조회`)은 `qual = true`라 로그인한 누구나 — **익명 게스트 포함**(Supabase 익명 로그인도 `authenticated` 롤을 받습니다) — 전원의 계좌·연락처를 읽을 수 있었습니다. `20260716010000_restrict_profile_select.sql`로 **2026-07-16에 제거 완료**되었습니다.

## RLS 정책 (행사)

| 테이블 | 조회 | 쓰기 |
| --- | --- | --- |
| `events` | 누구나 (`using (true)`) | admin만 |
| `event_segments` | 누구나 | admin만 |
| `event_participants` | 본인 것만 | 본인 것만 insert/delete |
| `segment_evaluations` | 로그인 사용자 전체 | 누구나 insert, **수정은 본인 것만** |

admin 판정은 모든 정책에서 같은 서브쿼리를 씁니다.

```sql
exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')
```

주의할 점 두 가지입니다. 평가는 `insert ... with check (true)`라 로그인만 했으면 아무 `user_id`로도 넣을 수 있고, 조회도 로그인 사용자 전체에게 열려 있어 **DB 수준에서는 익명성이 보장되지 않습니다**(익명성은 UI에서 닉네임만 보여주는 방식으로 구현). 그리고 `events`/`event_segments`는 인증 없이도 읽힙니다.

## RLS 정책 (소모임)

| 테이블 | 조회 | 쓰기 |
| --- | --- | --- |
| `gathering_categories` | 로그인 사용자 전체 | **멤버만** insert. **수정·삭제 없음** |
| `gatherings` | 로그인 사용자 전체 | **멤버만** insert, 수정·삭제는 **리더만** |
| `gathering_participants` | 로그인 사용자 전체 | 본인 것만 insert(**마감·종료 전에만**) / delete(**언제든**) |
| `gathering_reviews` | 로그인 사용자 전체 | **참가자만** insert, 수정·삭제는 본인 것만 |
| `gathering_review_likes` | 로그인 사용자 전체 | **멤버만** insert(본인 것만), delete 는 본인 것만. **수정 없음** |

**"멤버"는 `to authenticated`로 판별할 수 없습니다.** 익명 게스트도 `authenticated` 롤을 받기 때문입니다. 대신 `user_profiles` 행의 존재로 판별합니다(게스트는 이 행을 만들지 않습니다) — `events`의 admin 체크와 같은 패턴입니다.

```sql
exists (select 1 from public.user_profiles p where p.id = auth.uid())
```

참여 조회를 **열어 둔 것은 의도적입니다.** `event_participants`의 "본인 것만 조회" 패턴을 복사하면 참여자 아이콘에 자기 자신만 보입니다 — 소모임은 누가 오는지 보는 게 핵심입니다. 노출되는 건 `user_id`뿐이고 이름·아바타는 `public_profiles` 뷰로만 나갑니다.

`update` 정책은 아예 없습니다 — 참여는 있거나(insert) 없거나(delete) 둘 뿐입니다. 이게 `role` 컬럼을 넣지 않은 이유이기도 합니다(위 참고).

#### 나가기는 언제든 됩니다 — 1단계에서 뒤집힌 것

1단계는 **마감 후 탈퇴를 막았습니다.** 근거는 "마감이 정산 명단을 확정하고 3단계 정산이 그 위에 붙는다"였습니다. 그 근거가 없어졌습니다.

3단계 정산은 **청구할 사람을 건별로 선택해서 자기 명단을 갖습니다**(아래 "3단계 정산" 참고). 정산이 스냅샷을 뜨면 나중에 누가 나가든 정산은 유지되므로, 사람을 붙잡아 둘 이유가 없습니다.

챌린지에서는 애초에 성립하지 않았습니다. **무기한 모임에는 명단을 확정할 시점이 없습니다** — 3월에 마감해도 7월 유니폼 정산의 명단이 되지 못합니다(그 사이 사람이 바뀝니다). 마감으로 탈퇴를 막아도 정산은 안 지켜지고 감옥만 남았습니다.

마감에 남은 뜻은 양쪽 다 **"신청 그만 받기"** 하나뿐이고, 그건 나가기를 막을 근거가 아닙니다.

> 원데이에는 사회적 근거가 남긴 합니다 — 열 명이라고 식당 예약했는데 마감 후 셋이 빠지면 곤란합니다. 다만 버튼을 막는다고 그 사람들이 오는 건 아니라 데이터 문제로 풀지 않기로 했습니다.

## 3단계 정산 — 설계만, 미구현

**테이블도 코드도 없습니다.** 여기 적는 이유는 [나가기 정책](#rls-정책-소모임)이 이 설계를 전제로 느슨해졌기 때문입니다. 구현하기 전에 이 항목이 바뀌면 그 정책도 다시 봐야 합니다.

(`bills`는 **교회에 비용을 청구**하는 별개 기능입니다. 멤버끼리 나눠 내는 것과 다릅니다.)

### 모양

1. 리더가 정산 폼을 작성할 때 **청구할 사람을 선택**한다
2. 선택한 사람들에게 할당된 금액이 청구된다

**이 선택이 곧 스냅샷입니다.** 정산 건이 자기 명단을 들고 있으니 나중에 누가 나가든 정산은 유지됩니다.

### 왜 모임 명단이 아니라 건별 스냅샷인가

원데이는 **모임 하나 = 정산 하나**입니다. 열 명이 모여 밥 먹고 그 자리에서 나눠 냅니다. 그래서 "명단을 확정한다"가 의미가 있었습니다.

챌린지는 성립하지 않습니다. 교재는 3월에 사고 유니폼은 7월에 사는데 그 사이 사람들이 계속 들락날락합니다. **교재값은 "통독반 참가자 전원"이 아니라 "3월에 교재 산 사람들"끼리 나누는 겁니다.** 모임 명단으로는 이걸 표현할 수 없습니다.

> 원데이의 "마감 후 탈퇴 금지"도 사실 정산을 지키는 어설픈 방법이었습니다 — 사람을 붙잡아 두는 걸로 명단을 고정하는 것이니까요. 원데이는 두 시간 뒤 끝나서 부작용이 안 보였을 뿐입니다.

### 구현 전에 정해야 할 것

- **`paid_by`가 리더와 별개로 필요합니다.** 통독반 교재를 총무가 샀는데 리더가 정산을 만들면 돈은 총무 계좌로 가야 합니다.
- **청구받은 사람의 이름을 스냅샷으로 떠야 합니다**(`name text`). 후기는 `user_id` SET NULL 로 익명화돼도 되지만 정산은 **"누가 안 냈는지"가 핵심**이라 계정이 지워졌다고 누군지 사라지면 안 됩니다.
- **입금 확인 주체.** `paid_at`을 낸 사람이 체크하는지 받은 사람이 확인하는지에 따라 신뢰 모델이 완전히 달라집니다. 계좌번호는 이미 `user_profiles`에 있지만 실제 송금은 앱 밖에서 일어납니다.
- **정산은 소모임 상세 밖에서도 보여야 합니다.** 나간 사람도 자기 청구는 봐야 합니다.
- **[회계의 iOS 이관 결정](#그-외-마이그레이션-없음--2026-07-16-원격-db-조회로-확인)과 어디서 만나는지.** 아직 안 정해졌습니다.

⚠ 이 영역에는 **안 쓰일 기능을 미리 만들었다가 통째로 폐기한 전례**(`segment_evaluations`)가 있습니다. 정산이 실제로 필요해질 때 짓는 것을 권합니다.

## ⚠ 알려진 구멍: `worship_availability`

2026-07-16 원격 DB 점검에서 확인했습니다. UPDATE 정책이 둘인데 하나가 `qual = (auth.uid() is not null)`이고 **PERMISSIVE 정책은 OR로 합쳐지므로**, 로그인한 누구나 남의 참여 행을 수정할 수 있습니다.

**그냥 지우면 안 됩니다 — 이 느슨함이 load-bearing입니다.** [`useToggleAvailability`](../src/hooks/useToggleAvailability.ts#L73)의 "교체" 기능이 **의도적으로** 남의 행을 `available: false`로 바꿉니다(같은 포지션에 이미 등록된 사람이 있으면 확인을 받고 교체). 정책만 조이면 교체가 깨집니다.

해결안은 느슨한 정책을 지우고 `using (본인 or 같은 팀)` + `with check (user_id = auth.uid() or available = false)`로 좁히는 것입니다(남의 행은 **내리는 것만** 허용). 살아있는 기능이라 테스트가 동반돼야 합니다. 미착수.

## Realtime

`supabase_realtime` 퍼블리케이션에 `gatherings`, `gathering_participants`, `gathering_categories`, `gathering_reviews`(`20260717000000_gatherings_v2.sql`에서 등록), `gathering_review_likes`(`20260717010000_gathering_review_likes.sql`), `worship_availability`가 등록돼 있습니다. `drop table cascade`로 지우면 퍼블리케이션에서도 빠지므로, 재생성하는 테이블은 다시 넣어야 합니다.

구독하는 곳은 세 군데이고, 모두 이벤트를 받으면 해당 쿼리 캐시를 무효화합니다.

- [`useGatherings.ts`](../src/hooks/useGatherings.ts) — 채널 `gatherings_feed`, 소모임 개설·참여 현황
- [`useGatheringReviews.ts`](../src/hooks/useGatheringReviews.ts) — 채널 `gathering_reviews_${id}`, 후기와 좋아요(좋아요는 `gathering_id` 필터가 없어 무필터로 구독)
- [`useWorshipSchedule.ts`](../src/hooks/useWorshipSchedule.ts) — 채널 `worship_availability_${year}_${month}`, 찬양팀 참여 현황

행사·평가 관련 테이블(`events`·`event_segments`·`segment_evaluations`·`event_participants`)은
모두 삭제돼 퍼블리케이션에서도 빠졌습니다.

## 마이그레이션 이력

| 파일 | 내용 |
| --- | --- |
| `20260630000000_events.sql` | 행사 최초 스키마 |
| `20260630010000_event_duration_model.sql` | 절대 시각 → 소요시간(`duration_min`) 모델로 전환 |
| `20260630020000_event_results_public.sql` | `results_public` 추가 |
| `20260701000000_events_v2.sql` | **전체 리셋 후 재생성** (상세표 + 참여 도입) |
| `20260701020000_event_date_text.sql` | `event_date` date → text |
| `20260702000000_event_banner.sql` | `banner_url` 추가 |
| `20260716000000_harden_user_profiles.sql` | 자가 권한 승격 차단 (`role` 쓰기 회수) |
| `20260716010000_restrict_profile_select.sql` | 전체 프로필 조회 정책 제거 (계좌 노출 차단) |
| `20260716020000_gatherings.sql` | 소모임 1단계 — 테이블·RLS·Realtime |
| `20260717000000_gatherings_v2.sql` | 소모임 2단계 — **전체 리셋 후 재생성** (성격·카테고리 테이블·썸네일·리더 위임·후기). **미적용** |

`events_v2`와 `gatherings_v2`는 앞선 테이블을 `drop ... cascade`로 지우고 새로 만듭니다. 테스트 데이터를 전제로 한 파괴적 마이그레이션이므로, 실데이터가 쌓인 뒤 같은 방식을 반복하면 안 됩니다.

`gatherings_v2`가 ALTER 가 아닌 이유는 바뀌는 양입니다 — 컬럼 rename + FK 재정의 + NOT NULL 해제 + 컬럼 5개 + 정책 8개 중 4개 재작성이고, 무엇보다 1단계 파일의 전제("1회성 번개", "개설자는 리더가 아니다", "고정 멤버십·회차 없음")가 **전부 뒤집혔습니다.** ALTER 를 얹으면 그 주석이 파일 맨 위에 거짓말로 남습니다. 소모임 테이블이 만들어진 다음 날이라 실데이터가 없다는 전제 위에서만 정당하며, **이게 마지막 기회입니다** — 실데이터가 쌓이면 다시는 못 합니다.

> **`db push` 전에 반드시 `--dry-run`으로 목록을 먼저 보세요.** 이력 테이블(`supabase_migrations.schema_migrations`)은 2026-07-16 `migration repair`로 `20260716020000`까지 동기화됐지만, 그 전에는 SQL 에디터로 수동 적용해와서 이력이 비어 있었고 `db push`가 **9개 전부를 밀려고 했습니다.** 그중 `events_v2`가 위의 파괴적 마이그레이션입니다.
