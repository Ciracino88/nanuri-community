import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import LoadingScreen from "../../components/LoadingScreen";
import { useAuthStore } from "../../store/authStore";
import { useWorshipSchedule } from "../../hooks/useWorshipSchedule";
import { useCalendar } from "../../hooks/useCalendar";
import { useToggleAvailability } from "../../hooks/useToggleAvailability";
import PositionSlot from "../../components/worship/PositionSlot";
import { POSITIONS } from "../../constants/worship";
import { PAGE_BOTTOM_PAD } from "../../constants/layout";

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

/** 확정 진행률 링. 트랙은 구분선, 진행분은 Primary. 파랑 위 작은 글자라 굵기를 올린다. */
function ProgressRing({ confirmed, total }: { confirmed: number; total: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const progress = total > 0 ? confirmed / total : 0;
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg width="48" height="48" className="absolute inset-0 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--color-line-solid)" strokeWidth="3" />
        <motion.circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="var(--color-primary-normal)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ * (1 - progress) }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <span className="text-caption1 font-bold text-primary-normal">
        {confirmed}/{total}
      </span>
    </div>
  );
}

export default function WorshipSchedulePage() {
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
    <div className="flex-1 flex flex-col">
      <div
        className="w-full max-w-md mx-auto px-4 pt-6 flex flex-col gap-4"
        style={{ paddingBottom: PAGE_BOTTOM_PAD }}
      >
        {/* 화면 제목은 상단 바가 대신한다 — 문서 구조상 h1 은 스크린리더용으로만 남긴다. */}
        <h1 className="sr-only">찬양팀 시트</h1>

        {/* 1. 칩 셀렉터 — 팀. 선택 = 상호작용이라 Primary 담당(docs/design.md). */}
        <div className="flex items-center gap-2">
          {["나누리", "섬김이"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTeamFilter(t)}
              className={`text-label1 font-semibold px-4 py-2 rounded-full whitespace-nowrap transition active:scale-95 ${
                teamFilter === t
                  ? "bg-primary-normal text-static-white"
                  : "bg-bg-normal text-label-neutral shadow-xsmall"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 2. 날짜 이동 바 — 월 */}
        <div className="flex items-center justify-between rounded-field bg-bg-normal shadow-xsmall px-2 py-1.5">
          <motion.button
            whileTap={{ scale: 0.85, x: -2 }}
            onClick={() => moveMonth(-1)}
            className="p-2 text-label-neutral"
            aria-label="이전 달"
          >
            <ChevronLeft size={20} />
          </motion.button>
          <span className="text-headline2 font-bold text-label-normal">
            {viewYear}년 {MONTH_NAMES[viewMonth]}
          </span>
          <motion.button
            whileTap={{ scale: 0.85, x: 2 }}
            onClick={() => moveMonth(1)}
            className="p-2 text-label-neutral"
            aria-label="다음 달"
          >
            <ChevronRight size={20} />
          </motion.button>
        </div>

        {/* 3. 주 선택 바 — 주일 날짜 */}
        <div className="flex gap-2">
          {sundaysInMonth.map((d) => {
            const dateStr = d.toISOString().slice(0, 10);
            const isActive = dateStr === activeDateStr;
            return (
              <motion.button
                key={dateStr}
                onClick={() => selectDate(d)}
                className="flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-field flex-1 relative overflow-hidden"
                whileTap={{ scale: 0.92 }}
              >
                {/* 선택 표시는 Primary 면. 안 고른 칸은 카드 면 위에 얹는다. */}
                <div
                  className={`absolute inset-0 rounded-field ${isActive ? "" : "bg-bg-normal shadow-xsmall"}`}
                />
                {isActive && (
                  <motion.div
                    layoutId="worshipDateActive"
                    className="absolute inset-0 rounded-field bg-primary-normal"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span
                  className={`text-caption1 font-medium relative z-10 ${
                    isActive ? "text-static-white/80" : "text-label-neutral"
                  }`}
                >
                  일
                </span>
                <span
                  className={`text-headline2 font-bold leading-none relative z-10 ${
                    isActive ? "text-static-white" : "text-label-normal"
                  }`}
                >
                  {d.getDate()}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* 4. 선택된 날짜 + 확정 현황 */}
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-title3 font-bold text-label-normal">
            {activeDate ? `${activeDate.getMonth() + 1}월 ${activeDate.getDate()}일` : ""}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-label2 font-medium text-label-neutral">확정</span>
            <ProgressRing confirmed={confirmedCount} total={POSITIONS.length} />
          </div>
        </div>

        {/* 5. 포지션 슬롯 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDateStr}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            <div className="rounded-card bg-bg-normal shadow-small p-4">
              <div className="grid grid-cols-5 gap-2">{POSITIONS.slice(0, 5).map((pos, i) => renderSlot(pos, i))}</div>
            </div>
            <div className="rounded-card bg-bg-normal shadow-small p-4">
              <div className="grid grid-cols-5 gap-2">{POSITIONS.slice(5).map((pos, i) => renderSlot(pos, i + 5))}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
