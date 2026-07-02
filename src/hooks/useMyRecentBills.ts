import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface RecentBill {
  id: string;
  title: string;
  amount: number | null;
  created_at: string;
  status: string | null;
}

async function fetchMyRecentBills(userId: string): Promise<RecentBill[]> {
  const { data, error } = await supabase
    .from("bills")
    .select("id, title, amount, created_at, status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return (data ?? []) as RecentBill[];
}

export function useMyRecentBills(userId: string | undefined) {
  return useQuery({
    queryKey: ["my_recent_bills", userId],
    queryFn: () => fetchMyRecentBills(userId!),
    enabled: !!userId,
  });
}
