import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type {
  GatheringCategory,
  GatheringDraft,
  GatheringParticipant,
  GatheringRecord,
  ParticipantProfile,
} from "../types/gathering";

// ⚠️ 한 줄 리터럴로 둔다. 문자열을 + 로 이으면 타입이 string 으로 넓어지고,
//    supabase-js 가 select 를 리터럴 타입으로 파싱하지 못해 GenericStringError 가 된다.
const GATHERING_COLUMNS =
  "id, kind, title, description, gathering_at, place_name, place_updated_by, place_updated_at, category_id, thumbnail_url, leader_id, ended_at";

export const gatheringKeys = {
  list: ["gatherings"] as const,
};

async function fetchGatherings() {
  const [{ data: gatherings, error }, { data: participants }, { data: profiles }, { data: categories }] =
    await Promise.all([
      // nullsFirst: 챌린지는 gathering_at 이 null 이라 정렬 기준이 없다. 위로 고정한다 —
      // 통독반은 한 번 보고 마는 게 아니라 계속 거기 있는 것이다.
      supabase
        .from("gatherings")
        .select(GATHERING_COLUMNS)
        .order("gathering_at", { ascending: false, nullsFirst: true }),
      // created_at 은 위임 대상(가장 먼저 들어온 사람)을 화면에서 짚기 위해 읽는다 — DB 트리거의
      // order by created_at 과 같은 기준이라 확인창이 예고하는 승계자와 실제 승계자가 일치한다.
      supabase.from("gathering_participants").select("gathering_id, user_id, created_at"),
      // 타인의 프로필은 public_profiles 뷰로만 읽는다 (계좌·연락처 노출 차단).
      supabase.from("public_profiles").select("id, name, avatar_url"),
      // 카테고리는 멤버가 만들 수 있어서 DB 가 목록의 주인이다. 코드는 하드코딩하지 않는다.
      supabase.from("gathering_categories").select("id, emoji, label").order("label"),
    ]);
  if (error) throw error;

  return {
    gatherings: (gatherings ?? []) as GatheringRecord[],
    participants: (participants ?? []) as GatheringParticipant[],
    profiles: (profiles ?? []) as ParticipantProfile[],
    categories: (categories ?? []) as GatheringCategory[],
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
      // 남이 새 카테고리를 만들면 내 개설 화면 목록에도 바로 떠야 한다.
      .on("postgres_changes", { event: "*", schema: "public", table: "gathering_categories" }, () => {
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
//
// 이 불변식이 리더 승계를 받친다 — 리더는 항상 참가자이므로, 리더가 나가면 "가장 먼저 들어온
// 참가자"가 자연스럽게 다음 리더가 된다(DB 트리거). transfer_gathering_leader RPC 가
// "참가자에게만 위임"을 검사할 수 있는 것도 이 때문이다.
export function useCreateGathering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ draft, userId }: { draft: GatheringDraft; userId: string }) => {
      const { data, error } = await supabase
        .from("gatherings")
        .insert({ ...draft, leader_id: userId })
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

// ── 리더 전용: 종료 · 삭제 ───────────────────────────────
// 둘 다 gatherings 의 리더 전용 RLS 정책(update·delete)이 받친다 — RPC 가 필요 없다.
// 참가자에게 열려 있는 place 수정과 달리 컬럼을 좁힐 이유가 없어서(리더만 하므로) 평범한
// 테이블 쓰기로 둔다.

/** 종료. 리더가 모임을 끝낸다 — ended_at 을 찍으면 상태가 done 이 되어 참여를 더 받지 않는다.
 *  챌린지는 시간으로 안 끝나서 이 액션이 유일한 종료 경로다. 원데이는 시각 전에 앞당겨 끝낼 때 쓴다. */
export function useEndGathering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gatheringId: string) => {
      const { error } = await supabase
        .from("gatherings")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", gatheringId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gatheringKeys.list });
    },
  });
}

/** 삭제. 리더만. gathering_participants·gathering_reviews 가 cascade 라 참여·후기까지 함께 사라진다.
 *  마지막 한 명(=리더)이 나갈 때만 부른다 — 확인창이 후기 개수를 함께 예고한다. */
export function useDeleteGathering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gatheringId: string) => {
      const { error } = await supabase.from("gatherings").delete().eq("id", gatheringId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gatheringKeys.list });
    },
  });
}

// ── 카테고리 만들기 ──────────────────────────────────────
// 멤버 누구나 만든다(소모임 개설과 같은 문턱). 수정·삭제는 없다 — 남이 쓰고 있는 카테고리를
// 만든 사람이 지우면 그걸 단 소모임들이 통째로 흔들린다. label 에 unique 가 걸려 있어
// 같은 이름은 두 번 못 만든다.
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ emoji, label, userId }: { emoji: string; label: string; userId: string }) => {
      const { data, error } = await supabase
        .from("gathering_categories")
        .insert({ emoji, label, created_by: userId })
        .select("id, emoji, label")
        .single();
      if (error) throw error;
      return data as GatheringCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gatheringKeys.list });
    },
  });
}
