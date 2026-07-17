import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { GatheringReview, ParticipantProfile, ReviewLike } from "../types/gathering";

const REVIEW_COLUMNS = "id, gathering_id, user_id, content, created_at, updated_at";

export const reviewKeys = {
  of: (gatheringId: string) => ["gathering_reviews", gatheringId] as const,
};

async function fetchReviews(gatheringId: string) {
  const [{ data: reviews, error }, { data: profiles }] = await Promise.all([
    supabase
      .from("gathering_reviews")
      .select(REVIEW_COLUMNS)
      .eq("gathering_id", gatheringId)
      .order("created_at", { ascending: false }),
    // 타인의 프로필은 public_profiles 뷰로만 읽는다 (계좌·연락처 노출 차단).
    supabase.from("public_profiles").select("id, name, avatar_url"),
  ]);
  if (error) throw error;

  const reviewList = (reviews ?? []) as GatheringReview[];

  // 좋아요는 gathering_id 를 안 들고 review_id 로만 매달리므로, 이 모임 후기들의 id 로 모은다.
  // (후기 조회 뒤에 오는 종속 쿼리다 — reviewList 가 비면 아예 요청하지 않는다.)
  let likes: ReviewLike[] = [];
  if (reviewList.length > 0) {
    const { data: likeRows, error: likeError } = await supabase
      .from("gathering_review_likes")
      .select("review_id, user_id")
      .in("review_id", reviewList.map((r) => r.id));
    if (likeError) throw likeError;
    likes = (likeRows ?? []) as ReviewLike[];
  }

  return {
    reviews: reviewList,
    profiles: (profiles ?? []) as ParticipantProfile[],
    likes,
  };
}

export type GatheringReviewData = Awaited<ReturnType<typeof fetchReviews>>;

export function useGatheringReviews(gatheringId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = () => { queryClient.invalidateQueries({ queryKey: reviewKeys.of(gatheringId) }); };
    const channel = supabase
      .channel(`gathering_reviews_${gatheringId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gathering_reviews", filter: `gathering_id=eq.${gatheringId}` },
        invalidate
      )
      // 좋아요는 gathering_id 컬럼이 없어 이 모임으로 필터할 수 없다 — 어느 모임의 좋아요든
      // 이 쿼리를 다시 부른다. fetchReviews 가 review_id 로 걸러내므로 결과는 정확하고,
      // 교회 규모 트래픽에선 여분 refetch 가 무시할 만하다.
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gathering_review_likes" },
        invalidate
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient, gatheringId]);

  return useQuery({
    queryKey: reviewKeys.of(gatheringId),
    queryFn: () => fetchReviews(gatheringId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateReview(gatheringId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, userId }: { content: string; userId: string }) => {
      const { error } = await supabase
        .from("gathering_reviews")
        .insert({ gathering_id: gatheringId, user_id: userId, content });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.of(gatheringId) });
    },
  });
}

export function useUpdateReview(gatheringId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase
        .from("gathering_reviews")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.of(gatheringId) });
    },
  });
}

// 좋아요 토글. 참여 토글(useToggleGatheringJoin)과 같은 낙관적 방식이다 —
// 먼저 캐시를 바꾸고 실패하면 스냅샷으로 되돌린다. insert 는 upsert(ignoreDuplicates)라
// 더블클릭으로 PK 가 겹쳐도 조용히 무시된다.
export function useToggleReviewLike(gatheringId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, userId, liked }: { reviewId: string; userId: string; liked: boolean }) => {
      const { error } = liked
        ? await supabase
            .from("gathering_review_likes")
            .delete()
            .eq("review_id", reviewId)
            .eq("user_id", userId)
        : await supabase
            .from("gathering_review_likes")
            .upsert({ review_id: reviewId, user_id: userId }, { onConflict: "review_id,user_id", ignoreDuplicates: true });
      if (error) throw error;
    },
    onMutate: async ({ reviewId, userId, liked }) => {
      await queryClient.cancelQueries({ queryKey: reviewKeys.of(gatheringId) });
      const snapshot = queryClient.getQueryData<GatheringReviewData>(reviewKeys.of(gatheringId));
      queryClient.setQueryData<GatheringReviewData>(reviewKeys.of(gatheringId), (old) => {
        if (!old) return old;
        return {
          ...old,
          likes: liked
            ? old.likes.filter((l) => !(l.review_id === reviewId && l.user_id === userId))
            : [...old.likes, { review_id: reviewId, user_id: userId }],
        };
      });
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) queryClient.setQueryData(reviewKeys.of(gatheringId), ctx.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.of(gatheringId) });
    },
  });
}

export function useDeleteReview(gatheringId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gathering_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.of(gatheringId) });
    },
  });
}
