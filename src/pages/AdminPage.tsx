import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, Wallet, Settings, Plus } from "lucide-react";
import LoadingScreen from "../components/LoadingScreen";
import LoadingSpinner from "../components/LoadingSpinner";
import { computeEventStatus, type EventStatus } from "../lib/eventStatus";
import { colorForEvent } from "../lib/eventColor";
import { useAdminEvents } from "../hooks/useEvents";
import { TAB_COLORS } from "../constants/theme";

const ACCENT = TAB_COLORS.admin;

const SUB_TABS = [
  { id: "events", label: "행사 관리", Icon: CalendarDays },
  { id: "finance", label: "재정 관리", Icon: Wallet },
] as const;

type SubTab = (typeof SUB_TABS)[number]["id"];

const STATUS_META: Record<EventStatus, { label: string; bg: string; text: string }> = {
  upcoming: { label: "예정", bg: "rgba(78,205,196,0.15)", text: "#4ECDC4" },
  live: { label: "진행중", bg: "rgba(255,179,71,0.15)", text: "#FFB347" },
  done: { label: "완료", bg: "rgba(255,255,255,0.07)", text: "#8892a0" },
};

interface AdminRowEvent {
  id: string;
  title: string;
  event_date: string;
  place_name: string | null;
  image_url: string | null;
  banner_url: string | null;
  segmentCount: number;
  _color: string;
  _status: EventStatus;
}

function AdminEventRow({ event, index }: { event: AdminRowEvent; index: number }) {
  const navigate = useNavigate();
  const isDone = event._status === "done";
  const color = event._color;
  const meta = STATUS_META[event._status];
  const thumb = event.banner_url ?? event.image_url;

  return (
    <motion.button
      onClick={() => navigate(`/admin/events/${event.id}`)}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left active:scale-[0.99] transition"
      style={{
        background: isDone ? "rgba(255,255,255,0.03)" : `${color}10`,
        border: `1px solid ${isDone ? "rgba(255,255,255,0.07)" : `${color}25`}`,
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 360, damping: 30 }}
    >
      {thumb ? (
        <img
          src={thumb}
          alt=""
          className="rounded-xl object-cover shrink-0"
          style={{
            width: 40,
            height: 40,
            filter: isDone ? "grayscale(70%) brightness(0.6)" : undefined,
            border: `1px solid ${isDone ? "rgba(255,255,255,0.08)" : `${color}30`}`,
          }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 40, height: 40, background: isDone ? "rgba(255,255,255,0.05)" : `${color}18` }}
        >
          <CalendarDays size={17} color={isDone ? "#4a5568" : color} strokeWidth={2} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: isDone ? "#4a5568" : "#f0f2f8" }}>{event.title}</p>
        <p className="text-xs flex items-center gap-1 mt-0.5 truncate" style={{ color: isDone ? "#363d47" : "#6b7785" }}>
          <CalendarDays size={10} className="shrink-0" />
          {event.event_date}
        </p>
      </div>
      <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: meta.bg, color: meta.text }}>
        {meta.label}
      </span>
    </motion.button>
  );
}

function EventsAdminSection() {
  const { data: events = [], isLoading } = useAdminEvents();

  if (isLoading) {
    return (
      <div className="px-4 pt-4">
        <LoadingSpinner color={ACCENT} />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <CalendarDays size={32} color="#4a5568" />
        <p className="text-sm font-semibold" style={{ color: "#4a5568" }}>등록된 행사가 없어요</p>
      </div>
    );
  }

  const graded: AdminRowEvent[] = events.map((e) => ({
    ...e,
    _color: colorForEvent(e.id),
    _status: computeEventStatus(e.event_date, e.start_time, e.totalDuration),
  }));
  const upcoming = graded.filter((e) => e._status !== "done");
  const done = graded.filter((e) => e._status === "done");

  return (
    <div className="px-4 pt-1 pb-24 flex flex-col gap-5">
      {upcoming.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase" style={{ color: ACCENT, letterSpacing: "0.15em" }}>진행 · 예정</p>
          {upcoming.map((e, i) => (
            <AdminEventRow key={e.id} event={e} index={i} />
          ))}
        </div>
      )}
      {done.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase" style={{ color: "#4a5568", letterSpacing: "0.15em" }}>완료</p>
          {done.map((e, i) => (
            <AdminEventRow key={e.id} event={e} index={upcoming.length + i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<SubTab>("events");

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden" style={{ background: "#0f1117" }}>
      {/* 헤더 */}
      <div className="px-4 pt-5 pb-3 flex flex-col gap-4 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black" style={{ color: "#f0f2f8" }}>관리자</h1>
          <div className="flex items-center justify-center rounded-xl" style={{ width: 32, height: 32, background: `${ACCENT}18`, border: `1px solid ${ACCENT}30` }}>
            <Settings size={15} color={ACCENT} />
          </div>
        </div>

        {/* 하위 탭 */}
        <div className="flex gap-2">
          {SUB_TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.94 }}
                onClick={() => setTab(id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold"
                style={{
                  background: active ? `${ACCENT}22` : "rgba(255,255,255,0.05)",
                  border: active ? `1px solid ${ACCENT}44` : "1px solid rgba(255,255,255,0.07)",
                  color: active ? ACCENT : "#4a5568",
                }}
              >
                <Icon size={12} />
                {label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 내용 (탭바 위 콘텐츠 영역) */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            className="min-h-full flex flex-col"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "events" ? <EventsAdminSection /> : <LoadingScreen />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 행사 추가 버튼 (행사 관리 탭 · 콘텐츠 영역 기준이라 탭바와 안 겹침) */}
      {tab === "events" && (
        <motion.button
          onClick={() => navigate("/admin/events/new")}
          className="absolute bottom-6 right-4 flex items-center gap-2 px-5 py-3.5 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`,
            color: "#0f1117",
            boxShadow: `0 8px 32px ${ACCENT}44, 0 2px 8px rgba(0,0,0,0.4)`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.2 }}
          whileTap={{ scale: 0.93 }}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span className="text-sm font-black">행사 추가</span>
        </motion.button>
      )}
    </div>
  );
}
