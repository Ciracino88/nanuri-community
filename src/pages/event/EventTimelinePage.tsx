import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Clock, ChevronRight, Check } from "lucide-react";
import BackButton from "../../components/BackButton";
import LoadingScreen from "../../components/LoadingScreen";
import { useEventDetail } from "../../hooks/useEvents";
import { buildTimeline, formatClock, totalDuration } from "../../lib/eventTime";
import { computeEventStatus, EVENT_STATUS_LABEL, type EventStatus } from "../../lib/eventStatus";
import { TINT_STRONG, tintByIndex } from "../../constants/tints";

// 상태 배지는 식별용이라 액센트를 쓰지 않는다. 진행 중만 danger 로 눈에 띄게 둔다 —
// 경고라서가 아니라 "지금 이거"를 한눈에 찾아야 하는 화면이라서다.
const STATUS_BADGE: Record<EventStatus, string> = {
  upcoming: "bg-info-subtle text-info-strong",
  live: "bg-danger-subtle text-danger-strong",
  done: "bg-sunken text-fg-muted",
};

function fmtDuration(min: number) {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

export default function EventTimelinePage() {
  const { id } = useParams<{ id: string }>();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useEventDetail(id);
  const event = data?.event ?? null;
  const segments = data?.segments ?? [];

  if (isLoading) return <LoadingScreen />;
  if (!event) return <p className="flex-1 flex items-center justify-center text-body text-fg-muted">행사를 찾을 수 없어요</p>;

  const timeline = buildTimeline(event.event_date, event.start_time, segments);
  const status = computeEventStatus(event.event_date, event.start_time, totalDuration(segments));

  const meta = [
    event.event_date,
    event.start_time ? event.start_time.slice(0, 5) : null,
    event.place_name,
  ].filter(Boolean).join(" · ");

  return (
    <div className="flex-1 flex flex-col">
      {/* 히어로 */}
      <div className="px-5 pt-5 pb-7">
        <BackButton to={`/event/${id}`} />
        <div className="flex items-start justify-between gap-3 mt-3 mb-1">
          <h1 className="text-display font-bold leading-snug line-clamp-2 min-w-0 text-fg-strong">{event.title}</h1>
          <span className={`inline-flex items-center gap-1.5 text-caption font-semibold px-3 py-1 rounded-full shrink-0 mt-1 ${STATUS_BADGE[status]}`}>
            {status === "live" && <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-danger" />}
            {status === "live" ? "LIVE 진행중" : EVENT_STATUS_LABEL[status]}
          </span>
        </div>
        {meta && <p className="text-body text-fg-muted">{meta}</p>}

        <div className="flex gap-3 mt-5">
          <div className="flex-1 rounded-card px-4 py-3 bg-card shadow-card">
            <p className="text-caption mb-0.5 text-fg-muted">전체 프로그램</p>
            <p className="text-heading font-bold text-fg-strong">
              {segments.length}<span className="text-body font-normal ml-1 text-fg-muted">개</span>
            </p>
          </div>
          <div className="flex-1 rounded-card px-4 py-3 bg-card shadow-card">
            <p className="text-caption mb-0.5 text-fg-muted">총 소요시간</p>
            <p className="text-heading font-bold text-fg-strong">{fmtDuration(totalDuration(segments))}</p>
          </div>
        </div>
      </div>

      {/* 타임라인 */}
      <div className="px-5 pb-8 flex flex-col gap-2" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
        {timeline.map((item, index) => {
          const isExpanded = expanded === item.id;
          const isLive = item.status === "live";
          return (
            <motion.button
              key={item.id}
              onClick={() => setExpanded(isExpanded ? null : item.id)}
              // 진행 중 카드는 붉은 실선 테두리로 찾게 한다. danger-soft 는 흰 카드 위에서 안 보인다.
              className={`w-full text-left rounded-card bg-card shadow-card ${isLive ? "ring-1 ring-danger/40" : ""}`}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06, type: "spring", damping: 22, stiffness: 280 }}
            >
              <div className="flex items-start gap-3 p-4">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  {/* 번호 색은 순서에 따른 장식이지 항목의 의미가 아니다. */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-caption font-bold ${TINT_STRONG[tintByIndex(index)]}`}>
                    {index + 1}
                  </div>
                  {index < timeline.length - 1 && <div className="w-px h-3 mt-1 bg-line" />}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {isLive && <span className="text-caption font-semibold mb-1 block text-danger-strong">현재 진행</span>}
                      <h3 className="text-body font-semibold leading-snug text-fg-strong">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={11} className="text-fg-faint" />
                        <span className="text-caption font-semibold text-fg">{fmtDuration(item.duration_min)}</span>
                        {item.start && <span className="text-caption text-fg-muted">{formatClock(item.start)} 시작</span>}
                      </div>
                    </div>
                    {item.description && (
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }} className="mt-0.5 shrink-0">
                        <ChevronRight size={16} className="text-fg-faint" />
                      </motion.div>
                    )}
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && item.description && (
                      <motion.div
                        key="desc"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="text-caption leading-relaxed mt-3 pt-3 border-t border-line-soft text-fg-muted">{item.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.button>
          );
        })}

        {timeline.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-sunken">
              <Check size={14} className="text-fg-muted" />
            </div>
            <span className="text-caption font-semibold text-fg-muted">행사 종료</span>
          </div>
        )}

        {timeline.length === 0 && (
          <p className="text-center text-body py-12 text-fg-muted">아직 등록된 프로그램이 없어요</p>
        )}
      </div>
    </div>
  );
}
