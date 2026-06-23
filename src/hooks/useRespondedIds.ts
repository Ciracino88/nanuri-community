import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

async function fetchRespondedIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("survey_responses")
    .select("survey_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r: { survey_id: string }) => r.survey_id));
}

export function useRespondedIds(userId: string | undefined) {
  const { data: respondedIds = new Set<string>() } = useQuery({
    queryKey: ["responded_ids", userId],
    queryFn: () => fetchRespondedIds(userId!),
    enabled: !!userId,
  });
  return respondedIds;
}
