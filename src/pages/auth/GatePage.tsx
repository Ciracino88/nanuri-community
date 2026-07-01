import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { Star, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import LoadingScreen from "../../components/LoadingScreen";

const BLOBS = [
  { w: 300, left: "-10%", top: "5%", color: "78,205,196", dur: 6, delay: 0 },
  { w: 260, right: "-5%", top: "30%", color: "199,125,255", dur: 7, delay: 1 },
  { w: 220, left: "20%", bottom: "10%", color: "255,179,71", dur: 8, delay: 2 },
];

export default function GatePage() {
  const navigate = useNavigate();
  const { user, isAnonymous, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (user && !isAnonymous) return <Navigate to="/home" replace />;

  return (
    <div className="min-h-dvh flex flex-col overflow-hidden relative">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        {BLOBS.map((b, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: b.w, height: b.w,
              left: b.left, right: b.right, top: b.top, bottom: b.bottom,
              background: `radial-gradient(circle, rgba(${b.color},0.1) 0%, transparent 70%)`,
              filter: "blur(48px)",
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.85, 0.4] }}
            transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-12 relative">
        {/* 로고 */}
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 24 }}
        >
          <h1 className="text-3xl font-black" style={{ color: "#f0f2f8", letterSpacing: "-0.02em" }}>나누리</h1>
          <p className="text-xs font-semibold" style={{ color: "#4a5568", letterSpacing: "0.2em" }}>YOUTH COMMUNITY</p>
        </motion.div>

        {/* 버튼 */}
        <motion.div
          className="w-full flex flex-col gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 280, damping: 26 }}
        >
          <motion.button
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #4ECDC4, #4ECDC499)", boxShadow: "0 8px 28px rgba(78,205,196,0.3)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/member/login")}
          >
            <Star size={17} color="#0f1117" strokeWidth={2.5} />
            <span className="text-sm font-black" style={{ color: "#0f1117" }}>나누리 멤버입니다</span>
          </motion.button>

          <motion.button
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => toast("외부 사용자 기능은 준비 중이에요", { icon: "🚧" })}
          >
            <Users size={17} color="#8892a0" strokeWidth={2} />
            <span className="text-sm font-bold" style={{ color: "#8892a0" }}>외부 사용자입니다</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
