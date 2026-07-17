import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { reviewKeys } from "./useGatheringReviews";
import type { GatheringReview } from "../types/gathering";

const REVIEW_COLUMNS = "id, gathering_id, user_id, content, created_at, updated_at";

export const myReviewKeys = {
  of: (userId: string) => ["my_reviews", userId] as const,
};

// 내가 쓴 후기만 모은다. 프로필에서 "내 후기 관리" 를 위한 것 — 소모임 상세는 그 모임의
// 후기 전부를 소모임별 키로 읽지만(reviewKeys), 여기서는 소모임을 가로질러 내 것만 본다.
// gathering_reviews 의 select 정책은 authenticated 전체 허용이라 user_id 필터로 충분하다.
async function fetchMyReviews(userId: string) {
  const { data, error } = await supabase
    .from("gathering_reviews")
    .select(REVIEW_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as GatheringReview[];
}

export function useMyReviews(userId: string | undefined) {
  return useQuery({
    queryKey: myReviewKeys.of(userId ?? ""),
    queryFn: () => fetchMyReviews(userId as string),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDeleteMyReview(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    // gatheringId 도 받아 그 모임의 후기 목록 캐시(reviewKeys)까지 무효화한다 —
    // 프로필에서 지운 게 소모임 상세에도 즉시 반영되도록.
    mutationFn: async ({ id }: { id: string; gatheringId: string }) => {
      const { error } = await supabase.from("gathering_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, { gatheringId }) => {
      if (userId) queryClient.invalidateQueries({ queryKey: myReviewKeys.of(userId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.of(gatheringId) });
    },
  });
}
