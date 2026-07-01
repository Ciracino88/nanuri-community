import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Music, Music2, Music3, Music4 } from "lucide-react";
import LoadingScreen from "../../components/LoadingScreen";
import { useAuthStore } from "../../store/authStore";
import { useWorshipSchedule } from "../../hooks/useWorshipSchedule";
import { useCalendar } from "../../hooks/useCalendar";
import { useToggleAvailability } from "../../hooks/useToggleAvailability";
import PositionSlot from "../../components/worship/PositionSlot";
import { POSITIONS } from "../../constants/worship";

const ACCENT = "#FF6B6B";
const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

function getSundaysInMonth(year: number, month: number): Date[] {
  const sundays: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  while (d.getMonth() === month) {
    sundays.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return sundays;
}

const NOTE_ICONS = [Music2, Music, Music3, Music4];

function FloatingNote({ color, index }: { color: string; index: number }) {
  const Icon = NOTE_ICONS[index % NOTE_ICONS.length];
  const size = 12 + (index % 3) * 6;
  const startX = 20 + ((index * 37) % 60);
  const duration = 4 + ((index * 1.3) % 4);
  const delay = (index * 0.7) % 3;
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${startX}%`, bottom: 0 }}
      animate={{
        y: [-10, -120 - index * 20],
        x: [0, (index % 2 === 0 ? 1 : -1) * (10 + index * 5)],
        opacity: [0, 0.5, 0.3, 0],
        rotate: [0, index % 2 === 0 ? 20 : -20],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeOut" }}
    >
      <Icon size={size} color={color} />
    </motion.div>
  );
}

function ProgressRing({ confirmed, total, color }: { confirmed: number; total: number; color: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const progress = total > 0 ? confirmed / total : 0;
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg width="48" height="48" className="absolute inset-0 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <motion.circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ * (1 - progress) }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <span className="text-xs font-extrabold" style={{ color }}>
        {confirmed}/{total}
      </span>
    </div>
  );
}

export default function WorshipSchedulePage() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuthStore();

  const today = new Date();
  const { year: viewYear, month: viewMonth, selectedDate, moveMonth, selectDate } = useCalendar();
  const [teamFilter, setTeamFilter] = useState<string>("나누리");

  const { data, isLoading } = useWorshipSchedule(viewYear, viewMonth);
  const schedules = data?.schedules ?? [];
  const allMembers = data?.members ?? [];
  const members = allMembers.filter((m) => (m.team ?? "나누리") === teamFilter);
  const availability = data?.availability ?? [];

  const sundaysInMonth = getSundaysInMonth(viewYear, viewMonth);
  const defaultSelected = sundaysInMonth.find((d) => d >= today) ?? sundaysInMonth[sundaysInMonth.length - 1];
  const activeDate = selectedDate ?? defaultSelected;

  const { toggle: toggleAvailability, togglingPosition } = useToggleAvailability({
    year: viewYear,
    month: viewMonth,
    members,
    availability,
    teamFilter,
  });

  const getScheduleId = (date: string) => schedules.find((s) => s.date === date)?.id;
  const getConfirmedMember = (scheduleId: string, position: string) => {
    const positionMembers = members.filter((m) => m.position?.includes(position));
    return positionMembers.find((m) =>
      availability.find((a) => a.schedule_id === scheduleId && a.user_id === m.id && a.position === position && a.available)
    );
  };

  if (isLoading) return <LoadingScreen />;

  const activeDateStr = activeDate?.toISOString().slice(0, 10) ?? "";
  const activeScheduleId = getScheduleId(activeDateStr);
  const myPositions = userProfile?.position ?? [];
  const canToggle = (userProfile?.team ?? "나누리") === teamFilter;
  const confirmedCount = activeScheduleId
    ? POSITIONS.filter((pos) => !!getConfirmedMember(activeScheduleId, pos)).length
    : 0;

  const renderSlot = (pos: string, index: number) => {
    const confirmed = activeScheduleId ? getConfirmedMember(activeScheduleId, pos) : undefined;
    const isMine = myPositions.includes(pos);
    const myAvailForPos = activeScheduleId
      ? availability.find((a) => a.schedule_id === activeScheduleId && a.user_id === user?.id && a.position === pos)
      : undefined;
    return (
      <PositionSlot
        key={pos}
        position={pos}
        member={confirmed ?? null}
        isMine={isMine && canToggle}
        myAvailable={myAvailForPos?.available ?? false}
        toggling={togglingPosition === pos}
        index={index}
        onToggle={activeScheduleId && canToggle ? () => toggleAvailability(activeScheduleId, pos) : undefined}
      />
    );
  };

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#0f1117" }}>
      <div
        className="w-full max-w-md mx-auto flex flex-col"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >

        {/* Hero */}
        <div
          className="relative px-6 pt-8 pb-8 mx-4 mt-4 rounded-3xl overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${ACCENT}22 0%, ${ACCENT}08 100%)`, border: `1px solid ${ACCENT}33` }}
        >
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(105deg, transparent 40%, ${ACCENT}18 50%, transparent 60%)` }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
          />
          <p className="text-xs font-bold mb-2 tracking-widest uppercase relative z-10" style={{ color: ACCENT }}>
            찬양팀 일정
          </p>
          <h1 className="text-2xl font-extrabold text-white leading-tight relative z-10">
            주일 포지션을<br />등록해보세요
          </h1>
          <div className="absolute inset-0 overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <FloatingNote key={i} color={ACCENT} index={i} />
            ))}
          </div>
          <motion.div
            className="absolute right-5 bottom-3"
            style={{ opacity: 0.1 }}
            animate={{ rotate: [0, 8, -4, 0], y: [0, -4, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <Music2 size={72} color={ACCENT} />
          </motion.div>
        </div>

        {/* 포지션 미등록 안내 */}
        {myPositions.length === 0 && (
          <button
            onClick={() => navigate("/member/setup")}
            className="mx-4 mt-4 px-4 py-3 rounded-2xl flex items-center justify-between text-left"
            style={{ background: `${ACCENT}14`, border: `1px solid ${ACCENT}33` }}
          >
            <span className="text-sm" style={{ color: "#e0e6f0" }}>포지션을 등록해야 일정에 참여할 수 있어요</span>
            <span className="text-sm font-bold shrink-0 ml-3" style={{ color: ACCENT }}>등록 →</span>
          </button>
        )}

        {/* 팀 토글 */}
        <div className="flex gap-2 px-4 mt-4">
          {["나누리", "섬김이"].map((t) => (
            <motion.button
              key={t}
              onClick={() => setTeamFilter(t)}
              className="px-5 py-2 rounded-full text-sm font-bold"
              whileTap={{ scale: 0.93 }}
              style={teamFilter === t ? { background: ACCENT, color: "#0f1117" } : { background: "rgba(255,255,255,0.07)", color: "#8892a0" }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {t}
            </motion.button>
          ))}
        </div>

        {/* 달력 헤더 */}
        <div className="flex items-center justify-between px-6 mt-5">
          <motion.button whileTap={{ scale: 0.85, x: -2 }} onClick={() => moveMonth(-1)} className="p-1" style={{ color: "#8892a0" }} aria-label="이전 달">
            <ChevronLeft size={18} />
          </motion.button>
          <span className="text-sm font-bold text-white">{viewYear}년 {MONTH_NAMES[viewMonth]}</span>
          <motion.button whileTap={{ scale: 0.85, x: 2 }} onClick={() => moveMonth(1)} className="p-1" style={{ color: "#8892a0" }} aria-label="다음 달">
            <ChevronRight size={18} />
          </motion.button>
        </div>

        {/* 주일 날짜 */}
        <div className="flex gap-2 px-4 mt-3 justify-center">
          {sundaysInMonth.map((d) => {
            const dateStr = d.toISOString().slice(0, 10);
            const isActive = dateStr === activeDateStr;
            return (
              <motion.button
                key={dateStr}
                onClick={() => selectDate(d)}
                className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl flex-1 relative overflow-hidden"
                whileTap={{ scale: 0.9 }}
                style={{ color: isActive ? "#0f1117" : "#8892a0", background: isActive ? "transparent" : "rgba(255,255,255,0.06)" }}
              >
                {isActive && (
                  <motion.div
                    layoutId="datePulse"
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: ACCENT }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                )}
                <span className="text-xs font-semibold relative z-10">일</span>
                <span className="text-lg font-extrabold leading-none relative z-10">{d.getDate()}</span>
              </motion.button>
            );
          })}
        </div>

        {/* 날짜 + 확정 진행률 */}
        <div className="flex items-center justify-between px-5 mt-5 mb-3">
          <span className="text-sm font-bold text-white">
            {activeDate ? `${activeDate.getMonth() + 1}월 ${activeDate.getDate()}일` : ""}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: "#8892a0" }}>확정</span>
            <ProgressRing confirmed={confirmedCount} total={POSITIONS.length} color={ACCENT} />
          </div>
        </div>

        {/* 포지션 그리드 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDateStr}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2 px-4"
          >
            <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="grid grid-cols-5 gap-2">{POSITIONS.slice(0, 5).map((pos, i) => renderSlot(pos, i))}</div>
            </div>
            <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="grid grid-cols-5 gap-2">{POSITIONS.slice(5).map((pos, i) => renderSlot(pos, i + 5))}</div>
            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
