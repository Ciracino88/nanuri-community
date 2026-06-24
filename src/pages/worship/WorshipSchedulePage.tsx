import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import LoadingScreen from "../../components/LoadingScreen";
import { useAuthStore } from "../../store/authStore";
import { useWorshipSchedule } from "../../hooks/useWorshipSchedule";
import { useCalendar } from "../../hooks/useCalendar";
import { useToggleAvailability } from "../../hooks/useToggleAvailability";
import PositionSlot from "../../components/worship/PositionSlot";
import { POSITIONS } from "../../constants/worship";

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

export default function WorshipSchedulePage() {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuthStore();

  const today = new Date();
  const { year: viewYear, month: viewMonth, selectedDate, slideDir, slideKey, moveMonth, selectDate } = useCalendar();
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

  const slideAnimation = slideDir === "right" ? "slideFromRight 0.25s ease" : "slideFromLeft 0.25s ease";

  const renderSlot = (pos: string) => {
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
        onToggle={activeScheduleId && canToggle ? () => toggleAvailability(activeScheduleId, pos) : undefined}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        userName={userProfile?.name}
        onLogout={async () => { await signOut(); navigate("/"); }}
        onProfileEdit={() => navigate("/member/setup")}
      />

      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">찬양팀 일정</p>
            <h1 className="text-xl font-medium text-gray-800">주일 스케줄</h1>
          </div>
          <div className="flex gap-2">
            {["나누리", "섬김이"].map((t) => (
              <button
                key={t}
                onClick={() => setTeamFilter(t)}
                className={`px-4 py-1.5 rounded-full text-sm border transition ${
                  teamFilter === t
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {myPositions.length === 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <i className="ti ti-alert-circle text-amber-400 text-lg shrink-0" aria-hidden="true" />
              <p className="text-sm text-amber-700">포지션을 등록해야 일정에 참여할 수 있어요</p>
            </div>
            <button onClick={() => navigate("/member/setup")} className="text-sm text-amber-600 font-medium whitespace-nowrap hover:text-amber-800 transition">
              등록하기 →
            </button>
          </div>
        )}

        {/* 날짜 셀렉터 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <button onClick={() => moveMonth(-1)} className="text-gray-400 hover:text-gray-600 transition p-1 active:scale-90">
              <i className="ti ti-chevron-left text-base" aria-hidden="true" />
            </button>
            <span className="text-sm font-medium text-gray-700">{viewYear}년 {MONTH_NAMES[viewMonth]}</span>
            <button onClick={() => moveMonth(1)} className="text-gray-400 hover:text-gray-600 transition p-1 active:scale-90">
              <i className="ti ti-chevron-right text-base" aria-hidden="true" />
            </button>
          </div>
          <div
            key={slideKey}
            className="grid divide-x divide-gray-100"
            style={{
              gridTemplateColumns: `repeat(${sundaysInMonth.length}, minmax(0, 1fr))`,
              animation: slideAnimation,
            }}
          >
            {sundaysInMonth.map((d) => {
              const dateStr = d.toISOString().slice(0, 10);
              const isActive = dateStr === activeDateStr;
              return (
                <button
                  key={dateStr}
                  onClick={() => selectDate(d)}
                  className={`py-3 flex flex-col items-center gap-0.5 transition ${isActive ? "bg-gray-800" : "hover:bg-gray-50"}`}
                >
                  <span className={`text-xs ${isActive ? "text-white/50" : "text-gray-400"}`}>일</span>
                  <span className={`text-base font-medium ${isActive ? "text-white" : "text-gray-700"}`}>{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택된 주일 카드 */}
        {activeDate && (
          <div
            key={activeDateStr}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            style={{ animation: "cardEnter 0.3s ease" }}
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {activeDate.getMonth() + 1}월 {activeDate.getDate()}일
              </p>
              <span className="text-xs text-gray-400">{confirmedCount} / {POSITIONS.length} 확정</span>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div className="grid grid-cols-5 gap-2">{POSITIONS.slice(0, 5).map(renderSlot)}</div>
              <div className="border-t border-gray-50" />
              <div className="grid grid-cols-5 gap-2">{POSITIONS.slice(5).map(renderSlot)}</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
