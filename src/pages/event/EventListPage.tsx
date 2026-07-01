import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { CalendarDays, ChevronRight } from "lucide-react";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useEventList } from "../../hooks/useEvents";
import { computeEventStatus, type EventStatus } from "../../lib/eventStatus";
import { TAB_COLORS } from "../../constants/theme";
import type { EventRecord } from "../../types/event";

const COLORS = Object.values(TAB_COLORS);

const STATUS_META: Record<EventStatus, { label: string; bg: string; text: string }> = {
  upcoming: { label: "예정", bg: "rgba(78,205,196,0.15)", text: "#4ECDC4" },
  live: { label: "진행중", bg: "rgba(255,179,71,0.15)", text: "#FFB347" },
  done: { label: "완료", bg: "rgba(255,255,255,0.07)", text: "#8892a0" },
};

interface CardEvent extends EventRecord {
  _color: string;
  _status: EventStatus;
}

function EventCard({ event, index, onOpen }: { event: CardEvent; index: number; onOpen: () => void }) {
  const meta = STATUS_META[event._status];
  const isDone = event._status === "done";
  const color = event._color;
  const dateLine = [
    event.event_date,
    event.start_time ? event.start_time.slice(0, 5) : null,
    event.place_name,
  ].filter(Boolean).join(" · ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 360, damping: 30 }}
    >
      <motion.button
        className="w-full text-left rounded-2xl overflow-hidden"
        style={{
          background: isDone ? "rgba(255,255,255,0.03)" : `${color}12`,
          border: `1px solid ${isDone ? "rgba(255,255,255,0.07)" : `${color}30`}`,
        }}
        whileTap={{ scale: 0.985 }}
        onClick={onOpen}
      >
        <div className="relative w-full overflow-hidden" style={{ height: 90 }}>
          {event.image_url ? (
            <img
              src={event.image_url}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: isDone ? "grayscale(70%) brightness(0.4)" : "brightness(0.5)" }}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: isDone ? "linear-gradient(135deg, #1a1a2a, #0f1117)" : `linear-gradient(135deg, ${color}18 0%, #0f1117 100%)` }}
            />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(15,17,23,0.85) 0%, rgba(15,17,23,0.3) 60%, rgba(15,17,23,0.6) 100%)" }} />

          <div className="absolute inset-0 flex items-center gap-4 px-4">
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ width: 44, height: 44, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", border: `1px solid ${color}30` }}
            >
              <CalendarDays size={20} color={isDone ? "#6b7785" : color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-black truncate" style={{ color: isDone ? "#6b7785" : "#f0f2f8" }}>{event.title}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: meta.bg, color: meta.text }}>{meta.label}</span>
              </div>
              <p className="text-xs truncate" style={{ color: isDone ? "#363d47" : "#6b7785" }}>📅 {dateLine}</p>
            </div>
            <ChevronRight size={16} color={isDone ? "#363d47" : "#4a5568"} className="shrink-0" />
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

export default function EventListPage() {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useEventList();

  const graded: CardEvent[] = events.map((e, i) => ({
    ...e,
    _color: COLORS[i % COLORS.length],
    _status: computeEventStatus(e.event_date, e.start_time, 0),
  }));
  const upcoming = graded.filter((e) => e._status !== "done");
  const done = graded.filter((e) => e._status === "done");

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#0f1117" }}>
      <div
        className="w-full max-w-md mx-auto px-4 pt-6 flex flex-col gap-6"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black" style={{ color: "#f0f2f8" }}>행사</h1>
            <p className="text-xs font-semibold mt-0.5" style={{ color: "#4a5568" }}>
              {upcoming.length}개 예정 · {done.length}개 완료
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {(["upcoming", "live", "done"] as EventStatus[]).map((s) => (
              <div key={s} className="rounded-full" style={{ width: 8, height: 8, background: STATUS_META[s].text, opacity: 0.7 }} />
            ))}
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner color={TAB_COLORS.events} />
        ) : events.length === 0 ? (
          <div className="text-center text-sm py-16" style={{ color: "#4a5568" }}>예정된 행사가 없어요</div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold uppercase" style={{ color: TAB_COLORS.events, letterSpacing: "0.15em" }}>진행 · 예정</p>
                {upcoming.map((e, i) => (
                  <EventCard key={e.id} event={e} index={i} onOpen={() => navigate(`/event/${e.id}`)} />
                ))}
              </div>
            )}
            {done.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold uppercase" style={{ color: "#4a5568", letterSpacing: "0.15em" }}>완료</p>
                {done.map((e, i) => (
                  <EventCard key={e.id} event={e} index={upcoming.length + i} onOpen={() => navigate(`/event/${e.id}`)} />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
