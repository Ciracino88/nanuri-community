import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import PageContainer from "../../components/PageContainer";
import LoadingScreen from "../../components/LoadingScreen";
import MoodRating from "../../components/ui/MoodRating";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { generateNickname } from "../../lib/generateNickname";

interface EventInfo {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  place_name: string | null;
  image_url: string | null;
  results_public: boolean;
}

interface AggEval {
  segment_id: string;
  mood: number | null;
  comment: string | null;
  nickname: string | null;
}

interface Segment {
  id: string;
  duration_min: number;
  title: string;
  description: string | null;
  sort: number;
}

interface MyEval {
  id: string;
  segment_id: string;
  mood: number | null;
  comment: string | null;
}

const MOOD_ICON: Record<number, string> = { 1: "ti-mood-sad", 2: "ti-mood-empty", 3: "ti-mood-happy" };
const MOOD_LABEL: Record<number, string> = { 1: "불만족", 2: "평범", 3: "만족" };
const MOOD_COLOR: Record<number, string> = { 1: "text-danger", 2: "text-warning", 3: "text-success" };
const MOOD_BAR: Record<number, string> = { 1: "bg-danger", 2: "bg-warning", 3: "bg-success" };

async function fetchTimeline(id: string, userId: string | undefined) {
  const { data: event } = await supabase
    .from("events").select("id, title, event_date, start_time, place_name, image_url, results_public").eq("id", id).single();
  const { data: segments } = await supabase
    .from("event_segments").select("id, duration_min, title, description, sort").eq("event_id", id).order("sort");
  const segIds = (segments ?? []).map((s) => s.id);
  let evals: MyEval[] = [];
  let allEvals: AggEval[] = [];
  if (segIds.length) {
    if (userId) {
      const { data } = await supabase
        .from("segment_evaluations")
        .select("id, segment_id, mood, comment")
        .eq("user_id", userId)
        .in("segment_id", segIds);
      evals = (data ?? []) as MyEval[];
    }
    if ((event as EventInfo | null)?.results_public) {
      const { data } = await supabase
        .from("segment_evaluations")
        .select("segment_id, mood, comment, nickname")
        .in("segment_id", segIds);
      allEvals = (data ?? []) as AggEval[];
    }
  }
  return { event: event as EventInfo | null, segments: (segments ?? []) as Segment[], evals, allEvals };
}

function formatClock(date: Date) {
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function EventTimelinePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [openId, setOpenId] = useState<string | null>(null);
  const [draftMood, setDraftMood] = useState(0);
  const [draftComment, setDraftComment] = useState("");
  const [statsSegId, setStatsSegId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["timeline", id, user?.id],
    queryFn: () => fetchTimeline(id!, user?.id),
    enabled: !!id,
  });
  const event = data?.event ?? null;
  const segments = data?.segments ?? [];
  const evalBySegment = new Map((data?.evals ?? []).map((e) => [e.segment_id, e]));
  const allEvals = data?.allEvals ?? [];

  const submitMutation = useMutation({
    mutationFn: async ({ segmentId, existing }: { segmentId: string; existing?: MyEval }) => {
      if (existing) {
        const { error } = await supabase
          .from("segment_evaluations")
          .update({ mood: draftMood || null, comment: draftComment.trim() || null })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("segment_evaluations").insert({
          segment_id: segmentId,
          user_id: user?.id ?? null,
          nickname: generateNickname(),
          mood: draftMood || null,
          comment: draftComment.trim() || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setOpenId(null);
      setDraftMood(0);
      setDraftComment("");
      toast.success("평가가 저장됐어요");
      queryClient.invalidateQueries({ queryKey: ["timeline", id, user?.id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "저장에 실패했어요"),
  });

  if (isLoading) return <LoadingScreen />;
  if (!event) {
    return (
      <PageContainer width="default">
        <p className="text-body text-fg-faint text-center py-20">행사를 찾을 수 없어요</p>
      </PageContainer>
    );
  }

  // 각 순서 시작 시각 + 종료 시각 계산
  const startBase = event.start_time ? new Date(`${event.event_date}T${event.start_time}`) : null;
  let cursor = startBase ? new Date(startBase) : null;
  const now = new Date();
  const timeline = segments.map((s) => {
    const start = cursor ? new Date(cursor) : null;
    const end = start ? new Date(start.getTime() + s.duration_min * 60000) : null;
    if (cursor) cursor = new Date(cursor.getTime() + s.duration_min * 60000);
    const started = start ? now >= start : true;
    const ended = end ? now >= end : false;
    const status = !started ? "upcoming" : ended ? "done" : "live";
    return { ...s, start, status };
  });

  const statsSeg = statsSegId ? timeline.find((s) => s.id === statsSegId) : null;

  const openEditor = (segmentId: string, existing?: MyEval) => {
    setOpenId(segmentId);
    setDraftMood(existing?.mood ?? 0);
    setDraftComment(existing?.comment ?? "");
  };

  return (
    <PageContainer width="default">

      {/* 행사 헤더 */}
      <div>
        <h1 className="text-heading font-medium text-fg-strong">{event.title}</h1>
        <p className="text-caption text-fg-faint mt-1">
          {new Date(event.event_date).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
          {event.start_time && ` · ${event.start_time.slice(0, 5)} 모임`}
          {event.place_name && ` · ${event.place_name}`}
        </p>
      </div>

      {event.image_url && (
        <img src={event.image_url} alt={`${event.title} 포스터`} className="w-full h-auto rounded-2xl border border-line-soft" />
      )}

      {/* 타임라인 */}
      <div className="relative flex flex-col gap-3 pl-6">
        <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-line" aria-hidden="true" />
        {timeline.map((s) => {
          const myEval = evalBySegment.get(s.id);
          const isOpen = openId === s.id;
          const dotColor = s.status === "live" ? "bg-purple" : s.status === "done" ? "bg-teal" : "bg-line-strong";
          return (
            <div key={s.id} className="relative">
              <span
                className={`absolute -left-[23px] top-4 w-3 h-3 rounded-full border-2 border-surface ${dotColor}`}
                style={s.status === "live" ? { animation: "softPulse 1.6s ease-in-out infinite" } : undefined}
                aria-hidden="true"
              />
              <div className={`rounded-xl border p-4 ${s.status === "live" ? "bg-purple-subtle border-purple/20" : "bg-card border-line-soft"}`}>
                <div className="flex items-center gap-2">
                  {s.start && (
                    <span className={`text-caption font-medium rounded-md px-1.5 py-0.5 shrink-0 ${s.status === "live" ? "bg-purple text-white" : "text-purple bg-purple-subtle"}`}>
                      {formatClock(s.start)}
                    </span>
                  )}
                  <p className="text-body font-medium text-fg-strong truncate">{s.title}</p>
                  <span className="text-caption text-fg-faint ml-auto shrink-0">
                    {s.status === "live" ? "진행 중" : s.status === "done" ? "종료" : "예정"}
                  </span>
                </div>
                {s.description && <p className="text-caption text-fg-faint mt-1.5">{s.description}</p>}

                {/* 평가 영역 */}
                <div className="mt-3 pt-3 border-t border-line-soft">
                  {s.status === "upcoming" ? (
                    <p className="text-caption text-fg-faint flex items-center gap-1.5">
                      <i className="ti ti-lock" aria-hidden="true" />
                      시작되면 평가할 수 있어요
                    </p>
                  ) : isOpen ? (
                    <div className="flex flex-col gap-3">
                      <MoodRating value={draftMood} onChange={setDraftMood} />
                      <textarea
                        rows={2}
                        placeholder="한마디 남겨주세요 (선택)"
                        value={draftComment}
                        onChange={(e) => setDraftComment(e.target.value)}
                        className="w-full px-3 py-2 text-body border border-line rounded-lg resize-none outline-none focus:ring-2 focus:ring-purple-subtle focus:border-purple transition"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitMutation.mutate({ segmentId: s.id, existing: myEval })}
                          disabled={draftMood === 0 || submitMutation.isPending}
                          className="flex-1 py-2 rounded-lg text-caption font-medium bg-purple text-white transition hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                        >
                          {submitMutation.isPending ? "저장 중..." : "평가 제출"}
                        </button>
                        <button
                          onClick={() => setOpenId(null)}
                          className="px-4 py-2 rounded-lg text-caption text-fg-muted bg-surface hover:bg-sunken transition"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : myEval ? (
                    <div className="flex items-center gap-2">
                      {myEval.mood && (
                        <span className="flex items-center gap-1.5 text-caption text-fg">
                          <i className={`ti ${MOOD_ICON[myEval.mood]} text-emphasis text-info`} aria-hidden="true" />
                          {MOOD_LABEL[myEval.mood]}
                        </span>
                      )}
                      {myEval.comment && <span className="text-caption text-fg-faint truncate">· {myEval.comment}</span>}
                      <button onClick={() => openEditor(s.id, myEval)} className="ml-auto text-caption text-purple font-medium shrink-0">
                        수정
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openEditor(s.id)}
                      className="w-full py-2 rounded-lg text-caption font-medium bg-purple-subtle text-purple transition hover:opacity-80 active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <i className="ti ti-star text-emphasis" aria-hidden="true" />
                      이 순서 평가하기
                    </button>
                  )}
                  {event.results_public && s.status !== "upcoming" && (
                    <button
                      onClick={() => setStatsSegId(s.id)}
                      className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-caption font-medium text-fg-muted bg-surface hover:bg-sunken active:scale-95 transition"
                    >
                      <i className="ti ti-chart-bar text-emphasis" aria-hidden="true" />
                      통계 보기
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {segments.length === 0 && (
        <p className="text-body text-fg-faint text-center py-10">아직 순서가 등록되지 않았어요</p>
      )}

      {/* 순서별 통계 모달 */}
      {statsSeg && (() => {
        const segAll = allEvals.filter((e) => e.segment_id === statsSeg.id);
        const total = segAll.length;
        const comments = segAll.filter((c) => c.comment && c.comment.trim());
        return (
          <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center px-4" onClick={() => setStatsSegId(null)}>
            <div className="bg-card w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {statsSeg.start && (
                    <span className="text-caption font-medium text-purple bg-purple-subtle rounded-md px-1.5 py-0.5 shrink-0">
                      {formatClock(statsSeg.start)}
                    </span>
                  )}
                  <p className="text-body font-medium text-fg-strong truncate">{statsSeg.title}</p>
                </div>
                <button onClick={() => setStatsSegId(null)} aria-label="닫기" className="text-fg-faint hover:text-fg transition shrink-0">
                  <i className="ti ti-x text-heading" aria-hidden="true" />
                </button>
              </div>

              <p className="text-caption text-fg-faint">{total}명 평가</p>

              {total === 0 ? (
                <p className="text-body text-fg-faint text-center py-4">아직 평가가 없어요</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((v) => {
                    const count = segAll.filter((e) => e.mood === v).length;
                    const pct = total ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={v} className="flex items-center gap-2.5">
                        <i className={`ti ${MOOD_ICON[v]} text-heading ${MOOD_COLOR[v]} shrink-0`} aria-hidden="true" />
                        <div className="flex-1 h-2.5 bg-sunken rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${MOOD_BAR[v]}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-caption text-fg-faint w-10 text-right shrink-0">{count}명</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {comments.length > 0 && (
                <div className="border-t border-line-soft pt-3 flex flex-col gap-2.5">
                  {comments.map((c, ci) => (
                    <div key={ci} className="flex flex-col gap-0.5">
                      {c.nickname && <p className="text-caption text-fg-faint">{c.nickname}</p>}
                      <p className="text-body text-fg leading-relaxed">{c.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

    </PageContainer>
  );
}
