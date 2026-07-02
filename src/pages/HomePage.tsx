import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Bell, ChevronRight, Plus, Receipt, CalendarDays, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { useEventList } from "../hooks/useEvents";
import { computeEventStatus } from "../lib/eventStatus";
import { colorForEvent } from "../lib/eventColor";
import { TAB_COLORS } from "../constants/theme";

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
  const { userProfile } = useAuthStore();
  const { data: events = [] } = useEventList();

  const featured = events.find((e) => computeEventStatus(e.event_date, e.start_time, 0) !== "done");
  const featuredColor = featured ? colorForEvent(featured.id) : TAB_COLORS.events;

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

        {/* CTA */}
        <div className="px-5">
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
