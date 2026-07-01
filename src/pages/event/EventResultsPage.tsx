import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import LoadingScreen from "../../components/LoadingScreen";
import { buildTimeline, formatClock } from "../../lib/eventTime";
import { aggregateMoods } from "../../lib/mood";
import { useEventResults } from "../../hooks/useEvents";

export default function EventResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useEventResults(id);
  const event = data?.event ?? null;
  const segments = data?.segments ?? [];
  const evals = data?.evals ?? [];

  if (isLoading || !event) return <LoadingScreen />;

  const timeline = buildTimeline(event.event_date, event.start_time, segments);
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

      {timeline.map((s) => {
        const segEvals = evals.filter((e) => e.segment_id === s.id);
        const { total, buckets } = aggregateMoods(segEvals);
        const comments = segEvals.filter((e) => e.comment && e.comment.trim());
        return (
          <div key={s.id} className="bg-card border border-line-soft rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {s.start && (
                <span className="text-caption font-medium text-purple bg-purple-subtle rounded-md px-1.5 py-0.5 shrink-0">
                  {formatClock(s.start)}
                </span>
              )}
              <p className="text-body font-medium text-fg-strong truncate">{s.title}</p>
              <span className="text-caption text-fg-faint ml-auto shrink-0">{total}명</span>
            </div>

            {total === 0 ? (
              <p className="text-caption text-fg-faint">아직 평가가 없어요</p>
            ) : (
              <div className="flex flex-col gap-2">
                {buckets.map((m) => (
                  <div key={m.value} className="flex items-center gap-2.5">
                    <i className={`ti ${m.icon} text-emphasis ${m.color} shrink-0`} aria-hidden="true" />
                    <div className="flex-1 h-2 bg-sunken rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${m.bar}`} style={{ width: `${m.pct}%` }} />
                    </div>
                    <span className="text-caption text-fg-faint w-10 text-right shrink-0">{m.count}명</span>
                  </div>
                ))}
              </div>
            )}

            {comments.length > 0 && (
              <div className="border-t border-line-soft pt-3 flex flex-col gap-2.5">
                {comments.map((c, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    {c.nickname && <p className="text-caption text-fg-faint">{c.nickname}</p>}
                    <p className="text-body text-fg leading-relaxed">{c.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

    </PageContainer>
  );
}
