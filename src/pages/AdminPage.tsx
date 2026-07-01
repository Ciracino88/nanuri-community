import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, Wallet, Settings, ChevronRight, Plus } from "lucide-react";
import LoadingScreen from "../components/LoadingScreen";
import { TAB_COLORS } from "../constants/theme";

const ACCENT = TAB_COLORS.admin;

const SUB_TABS = [
  { id: "events", label: "행사 관리", Icon: CalendarDays },
  { id: "finance", label: "재정 관리", Icon: Wallet },
] as const;

type SubTab = (typeof SUB_TABS)[number]["id"];

function EventsAdminSection() {
  const navigate = useNavigate();
  return (
    <div className="px-4 py-5 flex flex-col gap-3">
      <button
        onClick={() => navigate("/admin/events")}
        className="w-full flex items-center gap-3 p-4 rounded-2xl text-left active:scale-[0.99] transition"
        style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${ACCENT}22` }}>
          <CalendarDays size={20} color={ACCENT} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: "#f0f2f8" }}>행사 관리</p>
          <p className="text-xs mt-0.5" style={{ color: "#6b7785" }}>행사를 만들고 순서를 구성해요</p>
        </div>
        <ChevronRight size={18} color="#4a5568" />
      </button>
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
