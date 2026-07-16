import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { gatheringKeys, type GatheringData } from "./useGatherings";

// 참여/취소 토글. 낙관적으로 먼저 반영하고 실패하면 스냅샷으로 되돌린다.
// (useToggleAvailability 와 같은 방식)
export function useToggleGatheringJoin(participants: GatheringData["participants"]) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const updateCache = (gatheringId: string, userId: string, joined: boolean) => {
    queryClient.setQueryData(gatheringKeys.list, (old: GatheringData | undefined) => {
      if (!old) return old;
      return {
        ...old,
        participants: joined
          ? [...old.participants, { gathering_id: gatheringId, user_id: userId }]
          : old.participants.filter(
              (p) => !(p.gathering_id === gatheringId && p.user_id === userId)
            ),
      };
    });
  };

  const toggle = async (gatheringId: string) => {
    if (!user || togglingId) return;
    setTogglingId(gatheringId);

    const snapshot = queryClient.getQueryData(gatheringKeys.list);
    const joined = participants.some(
      (p) => p.gathering_id === gatheringId && p.user_id === user.id
    );

    try {
      updateCache(gatheringId, user.id, !joined);

      const { error } = joined
        ? await supabase
            .from("gathering_participants")
            .delete()
            .eq("gathering_id", gatheringId)
            .eq("user_id", user.id)
        : await supabase
            .from("gathering_participants")
            .insert({ gathering_id: gatheringId, user_id: user.id });
      if (error) throw error;
    } catch (err) {
      console.error("[toggleGatheringJoin] error:", err);
      queryClient.setQueryData(gatheringKeys.list, snapshot);
      toast.error("잠시 후 다시 시도해주세요");
    } finally {
      setTogglingId(null);
    }
  };

  return { toggle, togglingId };
}
