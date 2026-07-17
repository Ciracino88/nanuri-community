import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { GatheringReview, ParticipantProfile } from "../types/gathering";

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

  return {
    reviews: (reviews ?? []) as GatheringReview[],
    profiles: (profiles ?? []) as ParticipantProfile[],
  };
}

export type GatheringReviewData = Awaited<ReturnType<typeof fetchReviews>>;

export function useGatheringReviews(gatheringId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`gathering_reviews_${gatheringId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gathering_reviews", filter: `gathering_id=eq.${gatheringId}` },
        () => { queryClient.invalidateQueries({ queryKey: reviewKeys.of(gatheringId) }); }
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
