import { useParams } from "react-router-dom";
import BackButton from "../../components/BackButton";
import LoadingScreen from "../../components/LoadingScreen";
import { buildTimeline, formatClock } from "../../lib/eventTime";
import { aggregateMoods } from "../../lib/mood";
import { useEventResults } from "../../hooks/useEvents";
import { TAB_COLORS } from "../../constants/theme";

const ACCENT = TAB_COLORS.admin;

export default function EventResultsPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useEventResults(id);
  const event = data?.event ?? null;
  const segments = data?.segments ?? [];
  const evals = data?.evals ?? [];

  if (isLoading || !event) return <LoadingScreen />;

  const timeline = buildTimeline(event.event_date, event.start_time, segments);
  const totalEvals = evals.length;

  return (
    <div className="flex-1 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <BackButton to={`/admin/events/${id}`} />
        <div className="min-w-0">
          <h1 className="text-base font-black truncate" style={{ color: "#f0f2f8" }}>{event.title}</h1>
          <p className="text-xs mt-0.5" style={{ color: "#6b7785" }}>평가 결과 · 실시간</p>
        </div>
      </div>

      <div className="px-4 pb-8 flex flex-col gap-4" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
        {/* 요약 */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "전체 평가", value: `${totalEvals}건` },
            { label: "순서", value: `${segments.length}개` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs" style={{ color: "#6b7785" }}>{stat.label}</p>
              <p className="text-2xl font-black mt-1" style={{ color: "#f0f2f8" }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* 순서별 결과 */}
        {timeline.map((s) => {
          const segEvals = evals.filter((e) => e.segment_id === s.id);
          const { total, buckets } = aggregateMoods(segEvals);
          const comments = segEvals.filter((e) => e.comment && e.comment.trim());
          return (
            <div key={s.id} className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                {s.start && (
                  <span className="text-xs font-bold rounded-md px-1.5 py-0.5 shrink-0" style={{ color: ACCENT, background: `${ACCENT}22` }}>
                    {formatClock(s.start)}
                  </span>
                )}
                <p className="text-sm font-bold truncate" style={{ color: "#f0f2f8" }}>{s.title}</p>
                <span className="text-xs ml-auto shrink-0" style={{ color: "#6b7785" }}>{total}명</span>
              </div>

              {total === 0 ? (
                <p className="text-xs" style={{ color: "#6b7785" }}>아직 평가가 없어요</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {buckets.map((m) => (
                    <div key={m.value} className="flex items-center gap-2.5">
                      <i className={`ti ${m.icon} text-emphasis ${m.color} shrink-0`} aria-hidden="true" />
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className={`h-full rounded-full ${m.bar}`} style={{ width: `${m.pct}%` }} />
                      </div>
                      <span className="text-xs w-10 text-right shrink-0" style={{ color: "#6b7785" }}>{m.count}명</span>
                    </div>
                  ))}
                </div>
              )}

              {comments.length > 0 && (
                <div className="pt-3 flex flex-col gap-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  {comments.map((c, i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      {c.nickname && <p className="text-xs" style={{ color: "#6b7785" }}>{c.nickname}</p>}
                      <p className="text-sm leading-relaxed" style={{ color: "#e0e6f0" }}>{c.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
