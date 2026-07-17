import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { totalDuration } from "../lib/eventTime";
import type { EventRecord, Segment } from "../types/event";

const EVENT_COLUMNS = "id, title, event_date, start_time, place_name, image_url, banner_url, emoji, description, details";

// ── 쿼리 키 ──────────────────────────────────────────────
export const eventKeys = {
  adminList: ["admin_events"] as const,
  list: ["events"] as const,
  detail: (id?: string) => ["admin_event", id] as const,
};

// ── 관리자 행사 목록 (순서 개수·전체 소요시간 포함) ──────────
export interface AdminEventRow extends EventRecord {
  segmentCount: number;
  totalDuration: number;
}

async function fetchAdminEvents(): Promise<AdminEventRow[]> {
  const { data: events, error } = await supabase
    .from("events").select(EVENT_COLUMNS).order("event_date", { ascending: false });
  if (error) throw error;
  return Promise.all(
    ((events ?? []) as EventRecord[]).map(async (e) => {
      const { data: segs } = await supabase.from("event_segments").select("duration_min").eq("event_id", e.id);
      return { ...e, segmentCount: segs?.length ?? 0, totalDuration: totalDuration((segs ?? []) as Segment[]) };
    })
  );
}

export function useAdminEvents() {
  return useQuery({ queryKey: eventKeys.adminList, queryFn: fetchAdminEvents });
}

// ── 참여자 행사 목록 ─────────────────────────────────────
async function fetchEvents(): Promise<EventRecord[]> {
  const { data, error } = await supabase
    .from("events").select(EVENT_COLUMNS).order("event_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EventRecord[];
}

export function useEventList() {
  return useQuery({ queryKey: eventKeys.list, queryFn: fetchEvents });
}

// ── 행사 상세 (관리자) ───────────────────────────────────
export interface EventDetailData {
  event: EventRecord | null;
  segments: Segment[];
}

async function fetchEventDetail(id: string): Promise<EventDetailData> {
  const [{ data: event }, { data: segments }] = await Promise.all([
    supabase.from("events").select(EVENT_COLUMNS).eq("id", id).single(),
    supabase.from("event_segments").select("id, duration_min, title, description, sort").eq("event_id", id).order("sort"),
  ]);
  return { event: (event as EventRecord | null) ?? null, segments: (segments ?? []) as Segment[] };
}

export function useEventDetail(id?: string) {
  return useQuery({ queryKey: eventKeys.detail(id), queryFn: () => fetchEventDetail(id!), enabled: !!id });
}
