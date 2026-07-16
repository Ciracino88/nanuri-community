# 데이터 모델

## 마이그레이션 현황 ⚠️

`supabase/migrations/`에는 **행사 관련 테이블만** 있습니다. `user_profiles`, `bills`, `worship_*`, `accounting_*`은 코드에서 쓰지만 마이그레이션 파일이 없어 원격 DB에만 존재합니다. 즉 이 저장소만으로는 DB를 처음부터 재현할 수 없습니다. 아래 스키마 중 행사 외 테이블은 코드의 쿼리에서 역으로 추정한 것이라 실제와 다를 수 있습니다.

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
| `results_public` | boolean `false` | 참여자에게 결과 공개 여부 |

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

**`event_participants`** — "내 일정에 추가"

`unique (event_id, user_id)`. **현재 코드 어디에서도 조회하지 않습니다** — 테이블만 남아 있습니다.

### 그 외 (마이그레이션 없음 — 2026-07-16 원격 DB 조회로 확인)

| 테이블 | 사용처 | 비고 |
| --- | --- | --- |
| `user_profiles` | `authStore`, RLS admin 판정 | `id`, `name`, `account_number`, `bank_name`, `role`, `officer_role`, `position[]`, `avatar_url`, `team`, `phone`, `created_at`. `role` 기본값 `'member'` |
| `bills` | `BillFormPage` | 비용 청구 내역 |
| `worship_schedules` | `useWorshipSchedule` | `date` (unique) — 주일 날짜 |
| `worship_availability` | `useWorshipSchedule`, `useToggleAvailability` | `schedule_id`, `user_id`, `position`, `available` |

**`accounting_categories` / `accounting_reports` / `accounting_transactions`는 DB에 존재하지 않습니다.** `pages/accounting/`와 회계 훅들이 이 이름으로 쿼리하지만 원격에는 없습니다 — 라우터에 연결하는 순간 런타임 에러가 납니다. 대신 `finance_ledgers`, `finance_reports`, `finance_splits`, `finance_transactions`가 있어 이름이 바뀐 것으로 보이나, 코드가 따라가지 않았습니다.

코드에서 쓰지 않는 테이블도 남아 있습니다: `bible_words`, `event_budget_items`, `event_items`, `event_registrations`, `event_tasks`, `finance_*`, `event_participants`.

모든 public 테이블에 RLS는 켜져 있습니다.

`role`은 `user_profiles`의 text 컬럼이고 `'admin'` 값이 관리자를 뜻합니다. RLS 정책 다수가 이 컬럼을 참조하므로 사실상 권한 체계의 뿌리입니다.

## user_profiles 권한 (2026-07-16 강화)

`role`·`officer_role`은 `anon`/`authenticated` 어느 쪽에도 쓰기 권한이 없습니다. 이 컬럼을 코드에서 쓰지 않고, 역할 변경은 대시보드(postgres)에서 합니다. 예전에는 아무 멤버나 자기 `role`을 `admin`으로 바꿀 수 있었습니다.

**컬럼 권한을 다룰 때 주의**: 이 테이블에는 테이블 단위 권한(`arwdDxtm`)이 부여돼 있어 **컬럼 단위 REVOKE가 조용히 무시됩니다.** 테이블 단위로 회수한 뒤 컬럼별로 재부여해야 합니다.

타인의 이름·아바타는 `public_profiles` 뷰(`id, name, avatar_url, position, team`)로만 읽습니다. `user_profiles` 직접 조회는 본인 행으로 제한되며, 계좌·연락처는 그 경로로만 나갑니다. 뷰는 `security_invoker = off`(기본값)라 소유자 권한으로 실행되어 밑단 RLS를 우회하고 컬럼으로만 노출을 제한합니다.

> 진행 중: 전체 조회 정책(`로그인 유저 프로필 조회`) 제거는 코드 배포 후에 적용합니다 — `20260716010000_restrict_profile_select.sql`. 그때까지 계좌 노출은 열려 있습니다.

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

## Realtime

`supabase_realtime` 퍼블리케이션에 `segment_evaluations`, `event_segments`, `event_participants`가 등록돼 있습니다.

구독하는 곳은 두 군데입니다.

- `useEvents.ts:137` — 채널 `event_results_${id}`, 평가 실시간 반영
- `useWorshipSchedule.ts:51` — 채널 `worship_availability_${year}_${month}`, 찬양팀 참여 현황

두 훅 모두 이벤트를 받으면 해당 쿼리 캐시를 무효화합니다.

## 마이그레이션 이력

| 파일 | 내용 |
| --- | --- |
| `20260630000000_events.sql` | 행사 최초 스키마 |
| `20260630010000_event_duration_model.sql` | 절대 시각 → 소요시간(`duration_min`) 모델로 전환 |
| `20260630020000_event_results_public.sql` | `results_public` 추가 |
| `20260701000000_events_v2.sql` | **전체 리셋 후 재생성** (상세표 + 참여 도입) |
| `20260701020000_event_date_text.sql` | `event_date` date → text |
| `20260702000000_event_banner.sql` | `banner_url` 추가 |

`events_v2`는 앞선 테이블을 `drop ... cascade`로 지우고 새로 만듭니다. 테스트 데이터를 전제로 한 파괴적 마이그레이션이므로, 실데이터가 쌓인 뒤 같은 방식을 반복하면 안 됩니다.
