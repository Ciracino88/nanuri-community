import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type {
  GatheringDraft,
  GatheringParticipant,
  GatheringRecord,
  ParticipantProfile,
} from "../types/gathering";

const GATHERING_COLUMNS =
  "id, title, gathering_at, place_name, description, emoji, created_by, closed_at";

export const gatheringKeys = {
  list: ["gatherings"] as const,
};

async function fetchGatherings() {
  const [{ data: gatherings, error }, { data: participants }, { data: profiles }] =
    await Promise.all([
      supabase.from("gatherings").select(GATHERING_COLUMNS).order("gathering_at", { ascending: false }),
      supabase.from("gathering_participants").select("gathering_id, user_id"),
      // 타인의 프로필은 public_profiles 뷰로만 읽는다 (계좌·연락처 노출 차단).
      supabase.from("public_profiles").select("id, name, avatar_url"),
    ]);
  if (error) throw error;

  return {
    gatherings: (gatherings ?? []) as GatheringRecord[],
    participants: (participants ?? []) as GatheringParticipant[],
    profiles: (profiles ?? []) as ParticipantProfile[],
  };
}

export type GatheringData = Awaited<ReturnType<typeof fetchGatherings>>;

export function useGatherings() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("gatherings_feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "gathering_participants" }, () => {
        queryClient.invalidateQueries({ queryKey: gatheringKeys.list });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "gatherings" }, () => {
        queryClient.invalidateQueries({ queryKey: gatheringKeys.list });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: gatheringKeys.list,
    queryFn: fetchGatherings,
    staleTime: 1000 * 60 * 5,
  });
}

// ── 개설 ────────────────────────────────────────────────
// 개설자는 곧 첫 참여자다. 만들어 놓고 자기가 안 들어가 있으면 어색하다.
export function useCreateGathering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ draft, userId }: { draft: GatheringDraft; userId: string }) => {
      const { data, error } = await supabase
        .from("gatherings")
        .insert({ ...draft, created_by: userId })
        .select(GATHERING_COLUMNS)
        .single();
      if (error) throw error;

      const gathering = data as GatheringRecord;
      const { error: joinError } = await supabase
        .from("gathering_participants")
        .insert({ gathering_id: gathering.id, user_id: userId });
      if (joinError) throw joinError;

      return gathering;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gatheringKeys.list });
    },
  });
}
