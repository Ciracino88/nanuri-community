import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Bell, ChevronRight, Plus, Receipt, CalendarDays, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { useEventList } from "../hooks/useEvents";
import { useMyRecentBills } from "../hooks/useMyRecentBills";
import { computeEventStatus } from "../lib/eventStatus";
import { colorForEvent } from "../lib/eventColor";
import { TAB_COLORS } from "../constants/theme";

function StatusChip({ status }: { status: string | null }) {
  const approved = status === "승인" || status === "approved";
  const color = approved ? TAB_COLORS.home : "#FFB347";
  const label = approved ? "승인" : "대기";
  return (
    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: `${color}22`, color }}>
      {label}
    </span>
  );
}

function QuickAction({ Icon, label, tint, onClick }: { Icon: typeof Receipt; label: string; tint: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-2xl py-4 active:scale-95 transition"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${tint}1f` }}>
        <Icon size={22} color={tint} />
      </div>
      <span className="text-xs font-bold" style={{ color: "#c0c8d4" }}>{label}</span>
    </button>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuthStore();
  const { data: events = [] } = useEventList();
  const { data: recentBills = [] } = useMyRecentBills(user?.id);

  const featured = events.find((e) => computeEventStatus(e.event_date, e.start_time, 0) !== "done");
  const featuredColor = featured ? colorForEvent(featured.id) : TAB_COLORS.events;

  const today = new Date();
  const dateLabel = `${today.getMonth() + 1}월 ${today.getDate()}일 기준`;

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#0f1117" }}>
      <div className="pb-6" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>

        {/* 헤더 */}
        <div className="px-5 pt-6 pb-4 flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: "#8892a0" }}>안녕하세요 👋</p>
            <h1 className="text-xl font-black mt-0.5" style={{ color: "#f0f2f8" }}>
              {userProfile?.name ? `${userProfile.name}님` : "나누리 청년부"}
            </h1>
          </div>
          <button
            onClick={() => toast("준비 중이에요", { icon: "🔔" })}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)" }}
            aria-label="알림"
          >
            <Bell size={20} color="#c0c8d4" />
          </button>
        </div>

        {/* 히어로: 가장 가까운 예정 행사 */}
        {featured ? (
          <button
            onClick={() => navigate(`/event/${featured.id}`)}
            className="mx-5 mb-5 rounded-2xl overflow-hidden relative text-left w-[calc(100%-2.5rem)] active:scale-[0.99] transition"
            style={{ background: `linear-gradient(135deg, ${featuredColor}26 0%, #0f1117 75%)`, border: `1px solid ${featuredColor}30` }}
          >
            <CalendarDays size={56} color={featuredColor} className="absolute top-4 right-5 opacity-20 pointer-events-none" />
            <div className="p-5 pr-20">
              <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: featuredColor }}>행사 안내</span>
              <h2 className="font-black text-lg leading-snug mt-1.5" style={{ color: "#f0f2f8" }}>{featured.title}</h2>
              <p className="text-sm mt-1" style={{ color: "#8892a0" }}>{featured.event_date}</p>
              <span className="mt-4 flex items-center gap-1 text-sm font-bold" style={{ color: featuredColor }}>
                자세히 보기 <ChevronRight size={14} />
              </span>
            </div>
          </button>
        ) : (
          <div className="mx-5 mb-5 rounded-2xl px-5 py-6 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-sm" style={{ color: "#6b7785" }}>예정된 행사가 없어요</p>
          </div>
        )}

        {/* 빠른 메뉴 */}
        <div className="px-5 mb-6">
          <h3 className="font-bold mb-3" style={{ color: "#f0f2f8" }}>빠른 메뉴</h3>
          <div className="grid grid-cols-3 gap-3">
            <QuickAction Icon={Receipt} label="비용 청구" tint={TAB_COLORS.home} onClick={() => navigate("/member/bill")} />
            <QuickAction Icon={CalendarDays} label="일정 보기" tint={TAB_COLORS.events} onClick={() => navigate("/events")} />
            <QuickAction Icon={ImageIcon} label="갤러리" tint={TAB_COLORS.gallery} onClick={() => navigate("/gallery")} />
          </div>
        </div>

        {/* 최근 비용 청구 */}
        <div className="px-5 mb-3 flex items-center justify-between">
          <h3 className="font-bold" style={{ color: "#f0f2f8" }}>최근 비용 청구</h3>
          <span className="text-xs" style={{ color: "#6b7785" }}>{dateLabel}</span>
        </div>

        <div className="px-5 flex flex-col gap-3">
          {recentBills.length === 0 ? (
            <div className="rounded-2xl px-4 py-6 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm" style={{ color: "#6b7785" }}>아직 청구 내역이 없어요</p>
            </div>
          ) : (
            recentBills.map((bill) => (
              <div key={bill.id} className="flex items-center gap-3 rounded-2xl px-4 py-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${TAB_COLORS.home}1f` }}>
                  <Receipt size={18} color={TAB_COLORS.home} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "#f0f2f8" }}>{bill.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6b7785" }}>{new Date(bill.created_at).toLocaleDateString("ko-KR").replace(/\.$/, "")}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-sm font-black" style={{ color: "#f0f2f8" }}>{(bill.amount ?? 0).toLocaleString()}원</span>
                  <StatusChip status={bill.status} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* CTA */}
        <div className="px-5 mt-5">
          <motion.button
            onClick={() => navigate("/member/bill")}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${TAB_COLORS.home}, ${TAB_COLORS.home}bb)`, color: "#0f1117", boxShadow: `0 6px 24px ${TAB_COLORS.home}44` }}
          >
            <Plus size={20} strokeWidth={2.5} />
            새 비용 청구서 작성
          </motion.button>
        </div>

      </div>
    </div>
  );
}
