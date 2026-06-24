import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import type { WorshipData } from "./useWorshipSchedule";

interface UseToggleAvailabilityArgs {
  year: number;
  month: number;
  members: WorshipData["members"];
  availability: WorshipData["availability"];
  teamFilter: string;
}

export function useToggleAvailability({ year, month, members, availability, teamFilter }: UseToggleAvailabilityArgs) {
  const queryClient = useQueryClient();
  const { user, userProfile } = useAuthStore();
  const [togglingPosition, setTogglingPosition] = useState<string | null>(null);

  const updateCache = (scheduleId: string, userId: string, position: string, available: boolean) => {
    queryClient.setQueryData(["worship", year, month], (old: WorshipData | undefined) => {
      if (!old) return old;
      const existing = old.availability.find(
        (a) => a.schedule_id === scheduleId && a.user_id === userId && a.position === position
      );
      const newAvailability = existing
        ? old.availability.map((a) =>
            a.schedule_id === scheduleId && a.user_id === userId && a.position === position
              ? { ...a, available }
              : a
          )
        : [...old.availability, { schedule_id: scheduleId, user_id: userId, position, available }];
      return { ...old, availability: newAvailability };
    });
  };

  const toggle = async (scheduleId: string, position: string) => {
    if (!user || togglingPosition || userProfile?.team !== teamFilter) return;
    setTogglingPosition(position);

    const snapshot = queryClient.getQueryData(["worship", year, month]);

    try {
      const currentAvail = availability.find(
        (a) => a.schedule_id === scheduleId && a.user_id === user.id && a.position === position
      );

      if (currentAvail?.available) {
        updateCache(scheduleId, user.id, position, false);
        const { error } = await supabase.from("worship_availability")
          .update({ available: false })
          .eq("schedule_id", scheduleId)
          .eq("user_id", user.id)
          .eq("position", position);
        if (error) throw error;
        return;
      }

      const conflicting = members.find(
        (m) => m.id !== user.id &&
          m.position?.includes(position) &&
          availability.find((a) => a.schedule_id === scheduleId && a.user_id === m.id && a.position === position && a.available)
      );

      if (conflicting) {
        const ok = confirm(`${conflicting.name}님이 이미 등록되어 있어요. 교체할까요?`);
        if (!ok) return;
        updateCache(scheduleId, conflicting.id, position, false);
        const { error } = await supabase.from("worship_availability")
          .update({ available: false })
          .eq("schedule_id", scheduleId)
          .eq("user_id", conflicting.id)
          .eq("position", position);
        if (error) throw error;
      }

      updateCache(scheduleId, user.id, position, true);
      const { error } = currentAvail
        ? await supabase.from("worship_availability")
            .update({ available: true })
            .eq("schedule_id", scheduleId)
            .eq("user_id", user.id)
            .eq("position", position)
        : await supabase.from("worship_availability")
            .insert({ schedule_id: scheduleId, user_id: user.id, position, available: true });
      if (error) throw error;

    } catch (err) {
      console.error("[toggleAvailability] error:", err);
      queryClient.setQueryData(["worship", year, month], snapshot);
    } finally {
      setTogglingPosition(null);
    }
  };

  return { toggle, togglingPosition };
}
