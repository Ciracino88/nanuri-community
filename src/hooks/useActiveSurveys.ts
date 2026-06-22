import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface ActiveSurvey {
  id: string;
  template_id: string | null;
  title: string;
  image_url: string | null;
  place_name: string | null;
  items: { label: string; isStar: boolean }[];
  created_at: string;
}

async function fetchActiveSurveys(): Promise<ActiveSurvey[]> {
  const { data, error } = await supabase
    .from("surveys")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function useActiveSurveys() {
  const { data: surveys = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["active_surveys"],
    queryFn: fetchActiveSurveys,
  });

  return { surveys, count: surveys.length, loading, refetch };
}
