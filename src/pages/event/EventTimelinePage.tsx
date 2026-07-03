import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Clock, ChevronRight, Check } from "lucide-react";
import BackButton from "../../components/BackButton";
import LoadingScreen from "../../components/LoadingScreen";
import { useEventDetail } from "../../hooks/useEvents";
import { buildTimeline, formatClock, totalDuration } from "../../lib/eventTime";
import { computeEventStatus, EVENT_STATUS_LABEL, type EventStatus } from "../../lib/eventStatus";
import { TAB_COLORS } from "../../constants/theme";

const DOT_COLORS = Object.values(TAB_COLORS);

const STATUS_COLOR: Record<EventStatus, string> = {
  upcoming: "#4ECDC4",
  live: "#FF6B6B",
  done: "#8892a0",
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
  if (!event) return <p className="flex-1 flex items-center justify-center text-sm" style={{ color: "#4a5568" }}>행사를 찾을 수 없어요</p>;

  const timeline = buildTimeline(event.event_date, event.start_time, segments);
  const status = computeEventStatus(event.event_date, event.start_time, totalDuration(segments));
  const statusColor = STATUS_COLOR[status];

  const meta = [
    event.event_date,
    event.start_time ? event.start_time.slice(0, 5) : null,
    event.place_name,
  ].filter(Boolean).join(" · ");

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#0f1117" }}>
      {/* 히어로 */}
      <div className="relative overflow-hidden px-5 pt-5 pb-7">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: `${statusColor}18`, filter: "blur(48px)" }} />
        <div className="absolute top-20 -left-8 w-36 h-36 rounded-full pointer-events-none" style={{ background: `${TAB_COLORS.events}14`, filter: "blur(40px)" }} />

        <div className="relative">
          <BackButton to={`/event/${id}`} />
          <div className="flex items-start justify-between gap-3 mt-3 mb-1">
            <h1 className="text-2xl font-black leading-snug line-clamp-2 min-w-0" style={{ color: "#f0f2f8" }}>{event.title}</h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full shrink-0 mt-1" style={{ background: `${statusColor}22`, color: statusColor }}>
              {status === "live" && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor }} />}
              {status === "live" ? "LIVE 진행중" : EVENT_STATUS_LABEL[status]}
            </span>
          </div>
          {meta && <p className="text-sm" style={{ color: "#8892a0" }}>{meta}</p>}

          <div className="flex gap-3 mt-5">
            <div className="flex-1 rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs mb-0.5" style={{ color: "#6b7785" }}>전체 프로그램</p>
              <p className="text-lg font-black" style={{ color: "#f0f2f8" }}>{segments.length}<span className="text-sm font-normal ml-1" style={{ color: "#6b7785" }}>개</span></p>
            </div>
            <div className="flex-1 rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs mb-0.5" style={{ color: "#6b7785" }}>총 소요시간</p>
              <p className="text-lg font-black" style={{ color: "#f0f2f8" }}>{fmtDuration(totalDuration(segments))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 타임라인 */}
      <div className="px-5 pb-8 flex flex-col gap-2" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
        {timeline.map((item, index) => {
          const color = DOT_COLORS[index % DOT_COLORS.length];
          const isExpanded = expanded === item.id;
          const isLive = item.status === "live";
          return (
            <motion.button
              key={item.id}
              onClick={() => setExpanded(isExpanded ? null : item.id)}
              className="w-full text-left rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${isLive ? `${STATUS_COLOR.live}66` : "rgba(255,255,255,0.07)"}` }}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06, type: "spring", damping: 22, stiffness: 280 }}
            >
              <div className="flex items-start gap-3 p-4">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black" style={{ background: color, color: "#0f1117" }}>
                    {index + 1}
                  </div>
                  {index < timeline.length - 1 && <div className="w-px h-3 mt-1" style={{ background: "rgba(255,255,255,0.12)" }} />}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {isLive && <span className="text-xs font-bold mb-1 block" style={{ color: STATUS_COLOR.live }}>현재 진행</span>}
                      <h3 className="text-sm font-bold leading-snug" style={{ color: "#f0f2f8" }}>{item.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={11} color="#6b7785" />
                        <span className="text-xs font-bold" style={{ color: TAB_COLORS.home }}>{fmtDuration(item.duration_min)}</span>
                        {item.start && <span className="text-xs" style={{ color: "#6b7785" }}>{formatClock(item.start)} 시작</span>}
                      </div>
                    </div>
                    {item.description && (
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }} className="mt-0.5 shrink-0">
                        <ChevronRight size={16} color="#6b7785" />
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
                        <p className="text-xs leading-relaxed mt-3 pt-3" style={{ color: "#8892a0", borderTop: "1px solid rgba(255,255,255,0.07)" }}>{item.description}</p>
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
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
              <Check size={14} color="#6b7785" />
            </div>
            <span className="text-xs font-bold" style={{ color: "#6b7785" }}>행사 종료</span>
          </div>
        )}

        {timeline.length === 0 && (
          <p className="text-center text-sm py-12" style={{ color: "#4a5568" }}>아직 등록된 프로그램이 없어요</p>
        )}
      </div>
    </div>
  );
}
