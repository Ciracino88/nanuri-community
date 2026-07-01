import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface MyBillStats {
  count: number;
  total: number;
}

async function fetchMyBillStats(userId: string): Promise<MyBillStats> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data, error } = await supabase
    .from("bills")
    .select("amount, created_at")
    .eq("user_id", userId)
    .gte("created_at", monthStart);

  if (error) throw error;

  const rows = data ?? [];
  return {
    count: rows.length,
    total: rows.reduce((sum, r: { amount: number | null }) => sum + (r.amount ?? 0), 0),
  };
}

export function useMyBillStats(userId: string | undefined) {
  const { data } = useQuery({
    queryKey: ["my_bill_stats", userId],
    queryFn: () => fetchMyBillStats(userId!),
    enabled: !!userId,
  });
  return data ?? { count: 0, total: 0 };
}
