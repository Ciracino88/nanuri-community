import type { GatheringRecord } from "../types/gathering";

export type GatheringStatus = "open" | "done";

export const GATHERING_STATUS_LABEL: Record<GatheringStatus, string> = {
  open: "모집 중",
  done: "종료",
};

/**
 * 소모임 상태는 open · done 둘뿐이다. **성격(kind)마다 끝나는 방식이 다르다.**
 *
 * - 원데이는 시간이 끝낸다 — gathering_at 이 지나면 done.
 * - 챌린지는 기한이 없어 시간이 영원히 안 끝낸다. 사람이 끝낸다 — ended_at.
 *
 * **모집 마감(가입을 더 안 받는 시점)은 별도 상태가 아니다.**
 * - 원데이: 모집 마감 = gathering_at(모이는 시각). 그 시각까지 가입할 수 있고, 지나면
 *   done 이라 가입이 저절로 닫힌다 — done 과 같은 시점이라 따로 둘 "마감" 상태가 없다.
 * - 챌린지: 자유 가입 / 자유 탈퇴라 마감 개념 자체가 없다. done 전까지 늘 열려 있다.
 *
 * ended_at 을 kind 보다 먼저 보는 이유: 마지막 참가자가 나가면 DB 트리거가
 * kind 와 무관하게 ended_at 을 찍는다(삭제하면 후기까지 증발하므로 종료로 남긴다).
 * 그래서 원데이도 시각이 오기 전에 ended_at 으로 끝날 수 있다.
 */
export function computeGatheringStatus(
  gathering: Pick<GatheringRecord, "kind" | "gathering_at" | "ended_at">,
  now: Date = new Date()
): GatheringStatus {
  if (gathering.ended_at) return "done";
  if (gathering.kind === "oneday" && gathering.gathering_at && new Date(gathering.gathering_at) < now) {
    return "done";
  }
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

/**
 * 카드·상세에 찍을 "언제". 챌린지는 모이는 시각이 없다 — 그게 챌린지의 정의다.
 * gathering_at 이 null 인 경우를 여기서 한 번만 처리하고 화면은 이걸 부른다.
 */
export function formatGatheringWhen(
  gathering: Pick<GatheringRecord, "kind" | "gathering_at">,
  now: Date = new Date()
): string {
  if (gathering.kind === "challenge" || !gathering.gathering_at) return "무기한";
  return formatGatheringAt(gathering.gathering_at, now);
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
