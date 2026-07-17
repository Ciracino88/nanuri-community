import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { gatheringKeys } from "./useGatherings";

// gatherings 의 UPDATE 정책은 리더로 잠겨 있고, with check 가 leader_id 를 고정한다.
// 아래 둘은 그 잠금을 우회하는 게 아니라, **함수 본문이 쓸 수 있는 컬럼을 물리적으로 한정**해서
// 필요한 만큼만 여는 통로다. RLS 는 행만 막고 컬럼은 못 막기 때문에 이 방법밖에 없다.
// (정책을 그냥 열면 참가자가 제목·kind·ended_at 까지 바꿀 수 있다 — 남의 모임을 종료시킬 수 있다.)

/** 장소 수정. 참가자 누구나. 챌린지는 장소가 회차마다 바뀐다. */
export function useUpdateGatheringPlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gatheringId, place }: { gatheringId: string; place: string }) => {
      const { error } = await supabase.rpc("update_gathering_place", {
        p_gathering_id: gatheringId,
        p_place: place,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gatheringKeys.list });
    },
  });
}

/** 리더 위임. 리더만 부를 수 있고, 넘겨받는 사람은 참가자여야 한다(함수가 검사). */
export function useTransferGatheringLeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gatheringId, newLeader }: { gatheringId: string; newLeader: string }) => {
      const { error } = await supabase.rpc("transfer_gathering_leader", {
        p_gathering_id: gatheringId,
        p_new_leader: newLeader,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gatheringKeys.list });
    },
  });
}
