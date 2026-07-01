import { parseStartDate } from "./eventTime";

export type EventStatus = "upcoming" | "live" | "done";

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  upcoming: "예정",
  live: "진행 중",
  done: "종료",
};

/**
 * 행사 상태를 날짜·시각으로 계산.
 * - 모이는 시각 전 → upcoming(예정)
 * - 모이는 시각 ~ (모이는 시각 + 전체 소요시간) → live(진행 중)
 * - 그 이후 → done(종료)
 * start_time 이 없으면 그날 00:00~23:59 를 진행 구간으로 본다.
 */
export function computeEventStatus(
  eventDate: string,
  startTime: string | null,
  totalDurationMin: number,
  now: Date = new Date()
): EventStatus {
  const iso = parseStartDate(eventDate);
  if (!iso) return "upcoming";
  const start = new Date(`${iso}T${startTime ?? "00:00"}`);
  const end =
    totalDurationMin > 0
      ? new Date(start.getTime() + totalDurationMin * 60000)
      : new Date(`${iso}T23:59:59`);

  if (now < start) return "upcoming";
  if (now > end) return "done";
  return "live";
}
