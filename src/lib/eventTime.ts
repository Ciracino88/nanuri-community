import type { Segment } from "../types/event";
import type { EventStatus } from "./eventStatus";

/** Date → "14:30" */
export function formatClock(date: Date): string {
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/**
 * 표시용 날짜 문자열("2021.05.20" 또는 "2021.05.20~2021.05.22")에서
 * 시작 날짜만 "YYYY-MM-DD"로 파싱. 형식이 안 맞으면 null.
 */
export function parseStartDate(dateText: string | null | undefined): string | null {
  if (!dateText) return null;
  const first = dateText.split("~")[0].trim().replace(/\./g, "-");
  return /^\d{4}-\d{2}-\d{2}$/.test(first) ? first : null;
}

/** 순서들의 소요시간 합(분) */
export function totalDuration(segments: Pick<Segment, "duration_min">[]): number {
  return segments.reduce((sum, s) => sum + (s.duration_min ?? 0), 0);
}

export type TimelineSegment<T extends Segment> = T & {
  start: Date | null;
  end: Date | null;
  status: EventStatus;
};

/**
 * 모이는 시각 + 앞 순서들 소요시간을 누적해 각 순서의 시작·종료 시각과 상태를 계산.
 * event_date 문자열에서 시작 날짜를 파싱. start_time·날짜가 없으면 시각은 null.
 */
export function buildTimeline<T extends Segment>(
  eventDate: string,
  startTime: string | null,
  segments: T[],
  now: Date = new Date()
): TimelineSegment<T>[] {
  const iso = parseStartDate(eventDate);
  const startBase = startTime && iso ? new Date(`${iso}T${startTime}`) : null;
  let cursor = startBase ? new Date(startBase) : null;

  return segments.map((s) => {
    const start = cursor ? new Date(cursor) : null;
    const end = start ? new Date(start.getTime() + s.duration_min * 60000) : null;
    if (cursor) cursor = new Date(cursor.getTime() + s.duration_min * 60000);

    const status: EventStatus = !start
      ? "upcoming"
      : now < start
        ? "upcoming"
        : end && now > end
          ? "done"
          : "live";

    return { ...s, start, end, status };
  });
}
