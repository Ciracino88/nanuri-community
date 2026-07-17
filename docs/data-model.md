# 데이터 모델

## 마이그레이션 현황 ⚠️

`supabase/migrations/`에는 **행사와 소모임 테이블만** 있습니다. `user_profiles`, `bills`, `worship_*`은 코드에서 쓰지만 `create table`이 없어 원격 DB에만 존재합니다(`user_profiles`는 권한을 조이는 마이그레이션만 있고 테이블 정의는 없습니다). 즉 이 저장소만으로는 DB를 처음부터 재현할 수 없습니다. 아래 스키마 중 마이그레이션이 없는 테이블은 코드의 쿼리에서 역으로 추정한 것이라 실제와 다를 수 있습니다.

```bash
# 원격 스키마를 파일로 내려받아 이 공백을 메울 수 있습니다
npx supabase db pull
```

## 테이블

### 행사 (마이그레이션 있음 — 근거: `20260701000000_events_v2.sql`)

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

**`segment_evaluations`** — 순서별 익명 평가

| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| `id` | uuid PK | |
| `segment_id` | uuid → `event_segments` | CASCADE |
| `user_id` | uuid → `auth.users` | ON DELETE SET NULL |
| `nickname` | text | 익명 표시용 |
| `mood` | smallint | 1 불만족 / 2 평범 / 3 만족 |
| `comment` | text | |

`unique (segment_id, user_id)` — 한 사람이 한 순서에 하나의 평가만.

⚠ **평가 기능은 폐기됐습니다**([status.md](status.md)). 이 테이블을 읽고 쓰는 코드가 이제 없습니다 —
테이블·정책·Realtime 퍼블리케이션만 DB 에 남아 있습니다. 되살릴 계획이 없다면 마이그레이션으로
정리하는 게 맞습니다.

**`event_participants`** — "내 일정에 추가"

`unique (event_id, user_id)`. **현재 코드 어디에서도 조회하지 않습니다** — 테이블만 남아 있습니다.

### 소모임 (마이그레이션 있음 — 근거: `20260716020000_gatherings.sql`)

**`gatherings`**

| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| `id` | uuid PK | |
| `title` | text NOT NULL | |
| `gathering_at` | timestamptz NOT NULL | 모이는 시각. **행사와 달리 날짜+시각 한 컬럼** |
| `place_name` | text | |
| `description` | text | |
| `emoji` | text | 없으면 코드에서 아이콘으로 폴백 |
| `created_by` | uuid → `auth.users` | CASCADE. 개설자일 뿐 리더가 아님 |
| `closed_at` | timestamptz | 참여 신청 마감. null이면 모집 중 |
| `created_at` | timestamptz `now()` | |

인덱스: `(gathering_at desc)`, `(created_by)`

**행사(`events`)를 확장하지 않고 별도 테이블로 간 이유**가 마이그레이션 주석에 남아 있습니다. `events`는 admin 전용이라 한 테이블에 합치면 멤버가 `kind='event'`로 행사를 만드는 권한 승격 경로가 열리고(RLS는 행만 막고 컬럼은 못 막습니다), `events.event_date`가 text인 부채도 그대로 상속하게 됩니다.

`closed_at`은 **참여 신청만** 닫습니다. 사진(2단계)·정산(3단계)은 모임이 끝난 뒤에도 열려 있어야 하기 때문입니다. 상태(모집 중/마감/종료) 판정은 DB가 아니라 `lib/gatheringTime.ts`의 `computeGatheringStatus()`가 시각을 비교해 계산합니다.

**`gathering_participants`** — 참여

`unique (gathering_id, user_id)` — 한 사람이 한 소모임에 한 번만. 인덱스는 `(gathering_id)`, `(user_id)`.

`capacity`(정원)와 `attended`(출석)는 **의도적으로 없습니다.** 정원이 없으면 동시 신청 경합 문제가 통째로 사라지고, 번개에서는 참여 = 신청이라 사후 출석 체크가 성격에 맞지 않습니다.

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

코드에서 쓰지 않는 테이블도 남아 있습니다: `bible_words`, `event_budget_items`, `event_items`, `event_registrations`, `event_tasks`, `finance_*`, `event_participants`.

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
| `gatherings` | 로그인 사용자 전체 | **멤버만** insert, 수정·삭제는 개설자만 |
| `gathering_participants` | 로그인 사용자 전체 | 본인 것만 insert/delete, **마감 전에만** |

**"멤버"는 `to authenticated`로 판별할 수 없습니다.** 익명 게스트도 `authenticated` 롤을 받기 때문입니다. 대신 `user_profiles` 행의 존재로 판별합니다(게스트는 이 행을 만들지 않습니다) — `events`의 admin 체크와 같은 패턴입니다.

```sql
exists (select 1 from public.user_profiles p where p.id = auth.uid())
```

참여 조회를 **열어 둔 것은 의도적입니다.** `event_participants`의 "본인 것만 조회" 패턴을 복사하면 참여자 아이콘에 자기 자신만 보입니다 — 소모임은 누가 오는지 보는 게 핵심입니다. 노출되는 건 `user_id`뿐이고 이름·아바타는 `public_profiles` 뷰로만 나갑니다.

마감(`closed_at`) 후에는 참여 취소도 막힙니다. 마감은 명단을 확정하는 행위이고 3단계 정산이 그 명단 위에 붙기 때문입니다. `update` 정책은 아예 없습니다 — 참여는 있거나(insert) 없거나(delete) 둘 뿐입니다.

## ⚠ 알려진 구멍: `worship_availability`

2026-07-16 원격 DB 점검에서 확인했습니다. UPDATE 정책이 둘인데 하나가 `qual = (auth.uid() is not null)`이고 **PERMISSIVE 정책은 OR로 합쳐지므로**, 로그인한 누구나 남의 참여 행을 수정할 수 있습니다.

**그냥 지우면 안 됩니다 — 이 느슨함이 load-bearing입니다.** [`useToggleAvailability`](../src/hooks/useToggleAvailability.ts#L73)의 "교체" 기능이 **의도적으로** 남의 행을 `available: false`로 바꿉니다(같은 포지션에 이미 등록된 사람이 있으면 확인을 받고 교체). 정책만 조이면 교체가 깨집니다.

해결안은 느슨한 정책을 지우고 `using (본인 or 같은 팀)` + `with check (user_id = auth.uid() or available = false)`로 좁히는 것입니다(남의 행은 **내리는 것만** 허용). 살아있는 기능이라 테스트가 동반돼야 합니다. 미착수.

## Realtime

`supabase_realtime` 퍼블리케이션에 `segment_evaluations`, `event_segments`, `event_participants`, `gatherings`, `gathering_participants`가 등록돼 있습니다(뒤의 둘은 `20260716020000_gatherings.sql`에서 추가).

구독하는 곳은 세 군데입니다.

- [`useGatherings.ts`](../src/hooks/useGatherings.ts) — 채널 `gatherings_feed`, 소모임 개설·참여 현황
- [`useWorshipSchedule.ts`](../src/hooks/useWorshipSchedule.ts) — 채널 `worship_availability_${year}_${month}`, 찬양팀 참여 현황

두 훅 모두 이벤트를 받으면 해당 쿼리 캐시를 무효화합니다.

행사 결과(`event_results_${id}`) 구독은 평가 기능과 함께 사라졌습니다 — 퍼블리케이션에는
`segment_evaluations` 등이 그대로 등록돼 있지만 구독하는 코드가 없습니다.

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

`events_v2`는 앞선 테이블을 `drop ... cascade`로 지우고 새로 만듭니다. 테스트 데이터를 전제로 한 파괴적 마이그레이션이므로, 실데이터가 쌓인 뒤 같은 방식을 반복하면 안 됩니다.

> **`db push` 전에 반드시 `--dry-run`으로 목록을 먼저 보세요.** 이력 테이블(`supabase_migrations.schema_migrations`)은 2026-07-16 `migration repair`로 `20260716020000`까지 동기화됐지만, 그 전에는 SQL 에디터로 수동 적용해와서 이력이 비어 있었고 `db push`가 **9개 전부를 밀려고 했습니다.** 그중 `events_v2`가 위의 파괴적 마이그레이션입니다.
