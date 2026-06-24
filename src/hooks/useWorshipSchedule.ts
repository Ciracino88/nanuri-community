import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

function getSundaysInMonth(year: number, month: number): Date[] {
  const sundays: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  while (d.getMonth() === month) {
    sundays.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return sundays;
}

async function fetchWorshipData(year: number, month: number) {
  const allDates: string[] = [];
  for (let i = -1; i <= 2; i++) {
    let m = month + i;
    let y = year;
    if (m > 11) { m -= 12; y++; }
    if (m < 0) { m += 12; y--; }
    getSundaysInMonth(y, m).forEach((d) => allDates.push(d.toISOString().slice(0, 10)));
  }

  await supabase.from("worship_schedules").upsert(
    allDates.map((date) => ({ date })),
    { onConflict: "date", ignoreDuplicates: true }
  );

  const [{ data: schedules }, { data: members }, { data: availability }] = await Promise.all([
    supabase.from("worship_schedules").select("id, date").order("date"),
    supabase.from("user_profiles").select("id, name, position, avatar_url, team").not("position", "is", null),
    supabase.from("worship_availability").select("schedule_id, user_id, position, available"),
  ]);

  return {
    schedules: schedules ?? [],
    members: members ?? [],
    availability: availability ?? [],
  };
}

export type WorshipData = Awaited<ReturnType<typeof fetchWorshipData>>;

export function useWorshipSchedule(year: number, month: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`worship_availability_${year}_${month}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "worship_availability",
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["worship", year, month] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [year, month, queryClient]);

  return useQuery({
    queryKey: ["worship", year, month],
    queryFn: () => fetchWorshipData(year, month),
    staleTime: 1000 * 60 * 5,
  });
}
