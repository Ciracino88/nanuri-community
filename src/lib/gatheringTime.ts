import type { GatheringRecord } from "../types/gathering";

export type GatheringStatus = "open" | "closed" | "done";

export const GATHERING_STATUS_LABEL: Record<GatheringStatus, string> = {
  open: "모집 중",
  closed: "마감",
  done: "종료",
};

/**
 * 소모임 상태.
 * - 모이는 시각이 지났으면 done(종료) — 마감 여부와 무관하게 끝난 건 끝난 거다.
 * - 아직 안 지났는데 closed_at 이 있으면 closed(마감) — 시간은 남았지만 명단이 닫혔다.
 * - 그 외 open(모집 중).
 */
export function computeGatheringStatus(
  gathering: Pick<GatheringRecord, "gathering_at" | "closed_at">,
  now: Date = new Date()
): GatheringStatus {
  if (new Date(gathering.gathering_at) < now) return "done";
  if (gathering.closed_at) return "closed";
  return "open";
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** "오늘 오후 3:30" / "내일 오후 3:30" / "7월 20일 (토) 오후 3:30" */
export function formatGatheringAt(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);

  const hour = d.getHours();
  const minute = d.getMinutes();
  const meridiem = hour < 12 ? "오전" : "오후";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const clock = `${meridiem} ${h12}${minute ? `:${String(minute).padStart(2, "0")}` : "시"}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(d, now)) return `오늘 ${clock}`;
  if (isSameDay(d, tomorrow)) return `내일 ${clock}`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]}) ${clock}`;
}

/** datetime-local 입력값(로컬 시각)을 timestamptz 로 보낼 ISO 문자열로 */
export function localInputToISO(value: string): string {
  return new Date(value).toISOString();
}

/** 개설 시트 기본값: 다음 정각 (로컬 시각, datetime-local 포맷) */
export function defaultGatheringAt(now: Date = new Date()): string {
  const d = new Date(now);
  d.setHours(d.getHours() + 1, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
