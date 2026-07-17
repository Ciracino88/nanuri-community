-- 후기 좋아요.
--
-- 후기(gathering_reviews)에 대한 가벼운 반응. 한 사람이 한 후기에 좋아요는 하나뿐이라
-- (review_id, user_id) 복합 PK 로 DB 가 강제한다 — unique 제약을 따로 걸 필요가 없고
-- 중복 insert 는 upsert(ignoreDuplicates)로 조용히 무시된다.

create table public.gathering_review_likes (
  review_id  uuid not null references public.gathering_reviews(id) on delete cascade,
  -- CASCADE 다. 후기 본문(user_id SET NULL)과 다르다 — 후기는 사람이 떠나도 남는 '기록'이지만
  -- 좋아요는 살아있는 '반응' 신호라 계정이 사라지면 의미가 없다(참여 gathering_participants 와 같다).
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

-- 특정 후기의 좋아요를 모으는 조회(fetchReviews 의 .in("review_id", ...))가 이 인덱스를 탄다.
create index gathering_review_likes_review_idx on public.gathering_review_likes (review_id);

alter table public.gathering_review_likes enable row level security;

-- 조회는 연다. 카운트와 "내가 눌렀나"를 계산하려면 전체를 읽어야 한다(후기·참여와 같은 선택).
create policy "gathering review likes read" on public.gathering_review_likes
  for select to authenticated using (true);

-- 멤버(user_profiles 행이 있으면 멤버)만 누른다. 익명 게스트도 authenticated 롤을 받으므로
-- to authenticated 만으로는 부족하다 — 다른 insert 정책들과 같은 문턱.
create policy "gathering review likes insert own" on public.gathering_review_likes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.user_profiles p where p.id = auth.uid())
  );

-- update 정책은 주지 않는다. 좋아요는 있거나(insert) 없거나(delete) 둘 뿐이다(참여와 같다).
create policy "gathering review likes delete own" on public.gathering_review_likes
  for delete to authenticated
  using (user_id = auth.uid());

-- 남이 누른 좋아요도 카운트에 바로 반영되도록 라이브로 연다(후기가 이미 라이브다).
alter publication supabase_realtime add table public.gathering_review_likes;
