import { supabase } from "./supabase";

export async function fetchList<T>(
  table: string,
  options: { orderBy?: string; ascending?: boolean; filter?: Record<string, string> } = {}
): Promise<T[]> {
  const { orderBy = "created_at", ascending = false, filter } = options;
  let query = supabase.from(table).select("*").order(orderBy, { ascending });
  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      query = query.eq(key, value);
    }
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as T[];
}
