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
  position: string | null;
  avatar_url: string | null;
}

interface Availability {
  schedule_id: string;
  user_id: string;
  available: boolean;
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

  const { data, isLoading } = useWorshipSchedule(viewYear, viewMonth);

  const schedules = data?.schedules ?? [];
  const members = data?.members ?? [];
  const availability = data?.availability ?? [];

  const sundaysInMonth = getSundaysInMonth(viewYear, viewMonth);
  const defaultSelected = sundaysInMonth.find((d) => d >= today) ?? sundaysInMonth[sundaysInMonth.length - 1];
  const activeDate = selectedDate ?? defaultSelected;

  const moveMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setViewMonth(m);
    setViewYear(y);
    setSelectedDate(null);
  };

  const updateCache = (scheduleId: string, userId: string, available: boolean) => {
    queryClient.setQueryData(["worship", viewYear, viewMonth], (old: typeof data) => {
      if (!old) return old;
      const existing = old.availability.find((a) => a.schedule_id === scheduleId && a.user_id === userId);
      const newAvailability = existing
        ? old.availability.map((a) => a.schedule_id === scheduleId && a.user_id === userId ? { ...a, available } : a)
        : [...old.availability, { schedule_id: scheduleId, user_id: userId, available }];
      return { ...old, availability: newAvailability };
    });
  };

  const toggleAvailability = async (scheduleId: string, position: string, currentAvail: Availability | undefined) => {
    if (!user) return;

    if (currentAvail?.available) {
      updateCache(scheduleId, user.id, false);
      await supabase.from("worship_availability").update({ available: false }).eq("schedule_id", scheduleId).eq("user_id", user.id);
      return;
    }

    const positionMembers = members.filter((m) => m.position === position);
    const conflicting = positionMembers.find((m) =>
      m.id !== user.id && availability.find((a) => a.schedule_id === scheduleId && a.user_id === m.id && a.available)
    );

    if (conflicting) {
      const ok = confirm(`${conflicting.name}님이 이미 등록되어 있어요. 교체할까요?`);
      if (!ok) return;
      updateCache(scheduleId, conflicting.id, false);
      await supabase.from("worship_availability").update({ available: false }).eq("schedule_id", scheduleId).eq("user_id", conflicting.id);
    }

    updateCache(scheduleId, user.id, true);
    if (currentAvail) {
      await supabase.from("worship_availability").update({ available: true }).eq("schedule_id", scheduleId).eq("user_id", user.id);
    } else {
      await supabase.from("worship_availability").insert({ schedule_id: scheduleId, user_id: user.id, available: true });
    }
  };

  const getScheduleId = (date: string) => schedules.find((s) => s.date === date)?.id;
  const getAvail = (scheduleId: string, userId: string) => availability.find((a) => a.schedule_id === scheduleId && a.user_id === userId);
  const getConfirmedMember = (scheduleId: string, position: string) => {
    const positionMembers = members.filter((m) => m.position === position);
    return positionMembers.find((m) => availability.find((a) => a.schedule_id === scheduleId && a.user_id === m.id && a.available));
  };

  if (isLoading) return <LoadingScreen />;

  const activeDateStr = activeDate?.toISOString().slice(0, 10) ?? "";
  const activeScheduleId = getScheduleId(activeDateStr);
  const myPosition = userProfile?.position ?? null;
  const myAvail = activeScheduleId ? getAvail(activeScheduleId, user?.id ?? "") : undefined;
  const confirmedCount = activeScheduleId ? POSITIONS.filter((pos) => !!getConfirmedMember(activeScheduleId, pos)).length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        userName={userProfile?.name}
        onLogout={async () => { await signOut(); navigate("/"); }}
        onProfileEdit={() => navigate("/member/setup")}
      />

      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

        <div>
          <p className="text-xs text-gray-400 mb-0.5">나누리 청년부</p>
          <h1 className="text-xl font-medium text-gray-800">찬양팀 일정</h1>
        </div>

        {!userProfile?.position && (
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
            <button onClick={() => moveMonth(-1)} className="text-gray-400 hover:text-gray-600 transition p-1">
              <i className="ti ti-chevron-left text-base" aria-hidden="true" />
            </button>
            <span className="text-sm font-medium text-gray-700">{viewYear}년 {MONTH_NAMES[viewMonth]}</span>
            <button onClick={() => moveMonth(1)} className="text-gray-400 hover:text-gray-600 transition p-1">
              <i className="ti ti-chevron-right text-base" aria-hidden="true" />
            </button>
          </div>
          <div className="grid divide-x divide-gray-100" style={{ gridTemplateColumns: `repeat(${sundaysInMonth.length}, minmax(0, 1fr))` }}>
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
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {activeDate.getMonth() + 1}월 {activeDate.getDate()}일
              </p>
              <div className="flex items-center gap-3">
                {myPosition && activeScheduleId && (
                  <button
                    onClick={() => toggleAvailability(activeScheduleId, myPosition, myAvail)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                      myAvail?.available
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {myAvail?.available ? "참여 가능 ✓" : "참여 가능?"}
                  </button>
                )}
                <span className="text-xs text-gray-400">{confirmedCount} / {POSITIONS.length} 확정</span>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div className="grid grid-cols-5 gap-2">
                {POSITIONS.slice(0, 5).map((pos) => {
                  const confirmed = activeScheduleId ? getConfirmedMember(activeScheduleId, pos) : undefined;
                  return <PositionSlot key={pos} position={pos} member={confirmed ?? null} />;
                })}
              </div>
              <div className="border-t border-gray-50" />
              <div className="grid grid-cols-5 gap-2">
                {POSITIONS.slice(5).map((pos) => {
                  const confirmed = activeScheduleId ? getConfirmedMember(activeScheduleId, pos) : undefined;
                  return <PositionSlot key={pos} position={pos} member={confirmed ?? null} />;
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function PositionSlot({ position, member }: { position: string; member: MemberProfile | null }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-xs text-gray-400 text-center leading-tight">{position}</p>
      {member ? (
        <>
          {member.avatar_url ? (
            <img src={member.avatar_url} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <i className="ti ti-user text-sm text-white" aria-hidden="true" />
            </div>
          )}
          <p className="text-xs font-medium text-emerald-700 text-center leading-tight w-full truncate">{member.name}</p>
        </>
      ) : (
        <>
          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
            <i className="ti ti-user text-sm text-gray-300" aria-hidden="true" />
          </div>
          <p className="text-xs text-gray-300 text-center">미정</p>
        </>
      )}
    </div>
  );
}
