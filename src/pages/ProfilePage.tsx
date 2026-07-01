import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Image, CalendarDays, Star, Pencil, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { confirmDialog } from "../components/ConfirmDialog";
import { useAuthStore } from "../store/authStore";

const ACCENT = "#74C7FF";
const INTRO = "나누리 청년부와 함께하고 있어요 🌴";

const STATS = [
  { Icon: Image, label: "사진 수", sub: "업로드한 사진", emoji: "🖼️" },
  { Icon: CalendarDays, label: "일정 수", sub: "참여하는 일정", emoji: "📅" },
  { Icon: Star, label: "즐겨찾기", sub: "북마크한 사진", emoji: "⭐" },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { userProfile, signOut } = useAuthStore();
  const name = userProfile?.name ?? "이름 없음";
  const avatar = userProfile?.avatar_url;

  const fireToast = (label: string, emoji: string) =>
    toast(`${label}은(는) 곧 만나요! 준비 중이에요`, { icon: emoji });

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#0f1117" }}>
      <div
        className="w-full max-w-md mx-auto flex flex-col items-center px-5 pt-10 gap-6"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >

        {/* 아바타 */}
        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 24 }}
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-5xl overflow-hidden"
            style={{ border: `3px solid ${ACCENT}`, background: `${ACCENT}22` }}
          >
            {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : "🐹"}
          </div>
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: `2px solid ${ACCENT}` }}
            animate={{ scale: [1, 1.22, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* 이름 & 소개 */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-xl font-extrabold text-white">{name}</h1>
          <p className="text-sm mt-1" style={{ color: "#8892a0" }}>{INTRO}</p>
        </motion.div>

        {/* 통계 (준비 중) */}
        <div className="w-full flex flex-col gap-2">
          {STATS.map(({ Icon, label, sub, emoji }, i) => (
            <motion.button
              key={label}
              onClick={() => fireToast(label, emoji)}
              className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-left"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07, type: "spring", stiffness: 400, damping: 28 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${ACCENT}22` }}>
                  <Icon size={18} color={ACCENT} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#8892a0" }}>{sub}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: `${ACCENT}18`, color: ACCENT }}>
                준비 중
              </span>
            </motion.button>
          ))}
        </div>

        {/* 편집 */}
        <motion.button
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm active:scale-[0.98]"
          style={{ background: ACCENT, color: "#0f1117" }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/member/setup")}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          <Pencil size={15} />
          프로필 편집
        </motion.button>

        {/* 로그아웃 */}
        <motion.button
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
          style={{ background: "rgba(255,107,107,0.12)", color: "#FF6B6B", border: "1px solid rgba(255,107,107,0.2)" }}
          whileTap={{ scale: 0.96 }}
          onClick={async () => {
            const ok = await confirmDialog({
              title: "로그아웃할까요?",
              message: "다시 로그인하려면 구글 계정 인증이 필요해요.",
              confirmLabel: "로그아웃",
              danger: true,
            });
            if (!ok) return;
            await signOut();
            navigate("/");
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
        >
          <LogOut size={15} />
          로그아웃
        </motion.button>

      </div>
    </div>
  );
}
