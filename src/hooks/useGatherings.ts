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
  "id, kind, title, description, gathering_at, place_name, place_updated_by, place_updated_at, category_id, thumbnail_url, leader_id, closed_at, ended_at";

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
      supabase.from("gathering_participants").select("gathering_id, user_id"),
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
