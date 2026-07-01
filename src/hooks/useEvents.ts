import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { totalDuration } from "../lib/eventTime";
import type { EventRecord, Segment, Evaluation } from "../types/event";

const EVENT_COLUMNS = "id, title, event_date, start_time, place_name, image_url, emoji, description, details, results_public";

// ── 쿼리 키 ──────────────────────────────────────────────
export const eventKeys = {
  adminList: ["admin_events"] as const,
  list: ["events"] as const,
  detail: (id?: string) => ["admin_event", id] as const,
  timeline: (id?: string, userId?: string) => ["timeline", id, userId] as const,
  results: (id?: string) => ["event_results", id] as const,
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

// ── 타임라인 (참여자: 내 평가 + 공개 시 전체 평가) ──────────
export interface TimelineData {
  event: EventRecord | null;
  segments: Segment[];
  myEvals: Evaluation[];
  allEvals: Evaluation[];
}

async function fetchTimeline(id: string, userId: string | undefined): Promise<TimelineData> {
  const { data: event } = await supabase.from("events").select(EVENT_COLUMNS).eq("id", id).single();
  const { data: segments } = await supabase
    .from("event_segments").select("id, duration_min, title, description, sort").eq("event_id", id).order("sort");
  const segIds = (segments ?? []).map((s) => s.id);

  let myEvals: Evaluation[] = [];
  let allEvals: Evaluation[] = [];
  if (segIds.length) {
    if (userId) {
      const { data } = await supabase
        .from("segment_evaluations").select("id, segment_id, mood, comment").eq("user_id", userId).in("segment_id", segIds);
      myEvals = (data ?? []) as Evaluation[];
    }
    if ((event as EventRecord | null)?.results_public) {
      const { data } = await supabase
        .from("segment_evaluations").select("segment_id, mood, comment, nickname").in("segment_id", segIds);
      allEvals = (data ?? []) as Evaluation[];
    }
  }
  return { event: (event as EventRecord | null) ?? null, segments: (segments ?? []) as Segment[], myEvals, allEvals };
}

export function useEventTimeline(id: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: eventKeys.timeline(id, userId),
    queryFn: () => fetchTimeline(id!, userId),
    enabled: !!id,
  });
}

// ── 결과 집계 (관리자, 실시간) ───────────────────────────
export interface ResultsData {
  event: EventRecord | null;
  segments: Segment[];
  evals: Evaluation[];
}

async function fetchResults(id: string): Promise<ResultsData> {
  const [{ data: event }, { data: segments }] = await Promise.all([
    supabase.from("events").select(EVENT_COLUMNS).eq("id", id).single(),
    supabase.from("event_segments").select("id, duration_min, title, description, sort").eq("event_id", id).order("sort"),
  ]);
  const segs = (segments ?? []) as Segment[];
  let evals: Evaluation[] = [];
  if (segs.length) {
    const { data } = await supabase
      .from("segment_evaluations").select("segment_id, mood, comment, nickname").in("segment_id", segs.map((s) => s.id));
    evals = (data ?? []) as Evaluation[];
  }
  return { event: (event as EventRecord | null) ?? null, segments: segs, evals };
}

export function useEventResults(id?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`event_results_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "segment_evaluations" }, () => {
        queryClient.invalidateQueries({ queryKey: eventKeys.results(id) });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);

  return useQuery({ queryKey: eventKeys.results(id), queryFn: () => fetchResults(id!), enabled: !!id });
}
