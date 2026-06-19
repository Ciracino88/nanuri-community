import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface ActiveSurvey {
  id: string;
  template_id: string;
  title: string;
  image_url: string | null;
  place_name: string | null;
  items: { label: string; isStar: boolean }[];
  created_at: string;
}

export function useActiveSurveys() {
  const [surveys, setSurveys] = useState<ActiveSurvey[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("surveys")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    setSurveys(data ?? []);
    setCount(data?.length ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  return { surveys, count, loading, refetch: fetch };
}
