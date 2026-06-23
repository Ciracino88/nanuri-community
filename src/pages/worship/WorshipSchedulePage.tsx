import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "../../components/Navbar";
import LoadingScreen from "../../components/LoadingScreen";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { useWorshipSchedule } from "../../hooks/useWorshipSchedule";

const POSITIONS = [
  "인도자", "싱어1", "싱어2", "메인 피아노", "세컨 피아노",
  "어쿠스틱", "베이스", "일렉", "드럼", "PPT",
];

const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

interface MemberProfile {
  id: string;
  name: string;
  position: string[] | null;
  avatar_url: string | null;
  team: string | null;
}


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
  const queryClient = useQueryClient();
  const { user, userProfile, signOut } = useAuthStore();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");
  const [slideKey, setSlideKey] = useState(0);
  const [togglingPosition, setTogglingPosition] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<string>("나누리");

  const { data, isLoading } = useWorshipSchedule(viewYear, viewMonth);

  const schedules = data?.schedules ?? [];
  const allMembers = data?.members ?? [];
  const members = allMembers.filter((m) => (m.team ?? "나누리") === teamFilter);
  const availability = data?.availability ?? [];

  const sundaysInMonth = getSundaysInMonth(viewYear, viewMonth);
  const defaultSelected = sundaysInMonth.find((d) => d >= today) ?? sundaysInMonth[sundaysInMonth.length - 1];
  const activeDate = selectedDate ?? defaultSelected;

  const moveMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setSlideDir(delta > 0 ? "right" : "left");
    setSlideKey((k) => k + 1);
    setViewMonth(m);
    setViewYear(y);
    setSelectedDate(null);
  };

  const updateCache = (scheduleId: string, userId: string, position: string, available: boolean) => {
    queryClient.setQueryData(["worship", viewYear, viewMonth], (old: typeof data) => {
      if (!old) return old;
      const existing = old.availability.find(
        (a) => a.schedule_id === scheduleId && a.user_id === userId && a.position === position
      );
      const newAvailability = existing
        ? old.availability.map((a) =>
            a.schedule_id === scheduleId && a.user_id === userId && a.position === position
              ? { ...a, available }
              : a
          )
        : [...old.availability, { schedule_id: scheduleId, user_id: userId, position, available }];
      return { ...old, availability: newAvailability };
    });
  };

  const toggleAvailability = async (scheduleId: string, position: string) => {
    if (!user || togglingPosition || userProfile?.team !== teamFilter) return;
    setTogglingPosition(position);

    const snapshot = queryClient.getQueryData(["worship", viewYear, viewMonth]);

    try {
      const currentAvail = availability.find(
        (a) => a.schedule_id === scheduleId && a.user_id === user.id && a.position === position
      );

      if (currentAvail?.available) {
        updateCache(scheduleId, user.id, position, false);
        const { error } = await supabase.from("worship_availability")
          .update({ available: false })
          .eq("schedule_id", scheduleId)
          .eq("user_id", user.id)
          .eq("position", position);
        if (error) throw error;
        return;
      }

      const conflicting = members.find(
        (m) => m.id !== user.id &&
          m.position?.includes(position) &&
          availability.find((a) => a.schedule_id === scheduleId && a.user_id === m.id && a.position === position && a.available)
      );

      if (conflicting) {
        const ok = confirm(`${conflicting.name}님이 이미 등록되어 있어요. 교체할까요?`);
        if (!ok) return;
        updateCache(scheduleId, conflicting.id, position, false);
        const { error } = await supabase.from("worship_availability")
          .update({ available: false })
          .eq("schedule_id", scheduleId)
          .eq("user_id", conflicting.id)
          .eq("position", position);
        if (error) throw error;
      }

      updateCache(scheduleId, user.id, position, true);
      const { error } = currentAvail
        ? await supabase.from("worship_availability")
            .update({ available: true })
            .eq("schedule_id", scheduleId)
            .eq("user_id", user.id)
            .eq("position", position)
        : await supabase.from("worship_availability")
            .insert({ schedule_id: scheduleId, user_id: user.id, position, available: true });
      if (error) throw error;

    } catch (err) {
      console.error("[toggleAvailability] error:", err);
      queryClient.setQueryData(["worship", viewYear, viewMonth], snapshot);
    } finally {
      setTogglingPosition(null);
    }
  };

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
                  onClick={() => setSelectedDate(d)}
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
              <div className="grid grid-cols-5 gap-2">
                {POSITIONS.slice(0, 5).map((pos) => {
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
                })}
              </div>
              <div className="border-t border-gray-50" />
              <div className="grid grid-cols-5 gap-2">
                {POSITIONS.slice(5).map((pos) => {
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
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

interface PositionSlotProps {
  position: string;
  member: MemberProfile | null;
  isMine: boolean;
  myAvailable: boolean;
  toggling: boolean;
  onToggle?: () => void;
}

function PositionSlot({ position, member, isMine, myAvailable, toggling, onToggle }: PositionSlotProps) {
  const isClickable = isMine && !!onToggle;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-xs text-gray-400 text-center leading-tight">{position}</p>
      <button
        type="button"
        onClick={isClickable ? onToggle : undefined}
        disabled={!isClickable || toggling}
        className={`relative w-8 h-8 rounded-full transition-all ${
          isClickable ? "cursor-pointer active:scale-90" : "cursor-default"
        }`}
        style={{ animation: isClickable && !toggling ? undefined : undefined }}
        onMouseDown={(e) => { if (isClickable) e.currentTarget.style.animation = "buttonPop 0.25s ease"; }}
        onAnimationEnd={(e) => { e.currentTarget.style.animation = "none"; }}
      >
        <div
          key={member?.id ?? "empty"}
          style={{ animation: member ? "popIn 0.3s ease" : undefined }}
          className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
        >
          {member ? (
            member.avatar_url ? (
              <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full rounded-full flex items-center justify-center ${myAvailable && isMine ? "bg-emerald-500" : "bg-emerald-400"}`}>
                <i className="ti ti-user text-sm text-white" aria-hidden="true" />
              </div>
            )
          ) : (
            <div className={`w-full h-full rounded-full border flex items-center justify-center ${
              isMine
                ? "bg-emerald-50 border-emerald-200"
                : "bg-gray-100 border-gray-200"
            }`}>
              <i className={`ti ti-user text-sm ${isMine ? "text-emerald-300" : "text-gray-300"}`} aria-hidden="true" />
            </div>
          )}
        </div>
        {isMine && myAvailable && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white" />
        )}
      </button>
      {member ? (
        <p className="text-xs font-medium text-emerald-700 text-center leading-tight w-full truncate">{member.name}</p>
      ) : (
        <p className="text-xs text-gray-300 text-center">미정</p>
      )}
    </div>
  );
}
