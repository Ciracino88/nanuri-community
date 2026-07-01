import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageContainer from "../../components/PageContainer";
import LoadingScreen from "../../components/LoadingScreen";
import { supabase } from "../../lib/supabase";

interface EventInfo {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  place_name: string | null;
}

interface Segment {
  id: string;
  duration_min: number;
  title: string;
  sort: number;
}

interface Evaluation {
  segment_id: string;
  mood: number | null;
  comment: string | null;
  nickname: string | null;
}

const MOOD_LEVELS = [
  { value: 1, icon: "ti-mood-sad", label: "불만족", color: "text-danger", bar: "bg-danger" },
  { value: 2, icon: "ti-mood-empty", label: "평범", color: "text-warning", bar: "bg-warning" },
  { value: 3, icon: "ti-mood-happy", label: "만족", color: "text-success", bar: "bg-success" },
];

async function fetchResults(id: string) {
  const [{ data: event }, { data: segments }] = await Promise.all([
    supabase.from("events").select("id, title, event_date, start_time, place_name").eq("id", id).single(),
    supabase.from("event_segments").select("id, duration_min, title, sort").eq("event_id", id).order("sort"),
  ]);
  const segs = (segments ?? []) as Segment[];
  let evals: Evaluation[] = [];
  if (segs.length) {
    const { data } = await supabase
      .from("segment_evaluations")
      .select("segment_id, mood, comment, nickname")
      .in("segment_id", segs.map((s) => s.id));
    evals = (data ?? []) as Evaluation[];
  }
  return { event: event as EventInfo | null, segments: segs, evals };
}

function formatClock(date: Date) {
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function EventResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["event_results", id],
    queryFn: () => fetchResults(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`event_results_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "segment_evaluations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["event_results", id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);

  const event = data?.event ?? null;
  const segments = data?.segments ?? [];
  const evals = data?.evals ?? [];

  if (isLoading || !event) return <LoadingScreen />;

  const startBase = event.start_time ? new Date(`${event.event_date}T${event.start_time}`) : null;
  let cursor = startBase ? new Date(startBase) : null;
  const timeline = segments.map((s) => {
    const start = cursor ? new Date(cursor) : null;
    if (cursor) cursor = new Date(cursor.getTime() + s.duration_min * 60000);
    const segEvals = evals.filter((e) => e.segment_id === s.id);
    const moodCounts = MOOD_LEVELS.map((m) => ({ ...m, count: segEvals.filter((e) => e.mood === m.value).length }));
    const comments = segEvals.filter((e) => e.comment && e.comment.trim());
    const total = segEvals.length;
    return { ...s, start, moodCounts, comments, total };
  });

  const totalEvals = evals.length;

  return (
    <PageContainer width="default">

      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/admin/events/${id}`)} className="text-fg-faint hover:text-fg-muted transition" aria-label="뒤로">
          <i className="ti ti-arrow-left text-heading" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h1 className="text-heading font-medium text-fg-strong truncate">{event.title}</h1>
          <p className="text-caption text-fg-faint mt-0.5">평가 결과 · 실시간</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-line-soft rounded-xl px-4 py-3">
          <p className="text-caption text-fg-faint">전체 평가</p>
          <p className="text-display font-medium text-fg-strong mt-1">{totalEvals}건</p>
        </div>
        <div className="bg-card border border-line-soft rounded-xl px-4 py-3">
          <p className="text-caption text-fg-faint">순서</p>
          <p className="text-display font-medium text-fg-strong mt-1">{segments.length}개</p>
        </div>
      </div>

      {timeline.map((s) => (
        <div key={s.id} className="bg-card border border-line-soft rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {s.start && (
              <span className="text-caption font-medium text-purple bg-purple-subtle rounded-md px-1.5 py-0.5 shrink-0">
                {formatClock(s.start)}
              </span>
            )}
            <p className="text-body font-medium text-fg-strong truncate">{s.title}</p>
            <span className="text-caption text-fg-faint ml-auto shrink-0">{s.total}명</span>
          </div>

          {s.total === 0 ? (
            <p className="text-caption text-fg-faint">아직 평가가 없어요</p>
          ) : (
            <div className="flex flex-col gap-2">
              {s.moodCounts.map((m) => {
                const pct = s.total ? Math.round((m.count / s.total) * 100) : 0;
                return (
                  <div key={m.value} className="flex items-center gap-2.5">
                    <i className={`ti ${m.icon} text-emphasis ${m.color} shrink-0`} aria-hidden="true" />
                    <div className="flex-1 h-2 bg-sunken rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${m.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-caption text-fg-faint w-10 text-right shrink-0">{m.count}명</span>
                  </div>
                );
              })}
            </div>
          )}

          {s.comments.length > 0 && (
            <div className="border-t border-line-soft pt-3 flex flex-col gap-2.5">
              {s.comments.map((c, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  {c.nickname && <p className="text-caption text-fg-faint">{c.nickname}</p>}
                  <p className="text-body text-fg leading-relaxed">{c.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

    </PageContainer>
  );
}
