import { motion } from "motion/react";
import { TAB_COLORS } from "../constants/theme";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <motion.div
        className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
        style={{ background: `${TAB_COLORS.home}22` }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        🏠
      </motion.div>
      <p className="font-bold" style={{ color: "#f0f2f8" }}>홈</p>
      <p className="text-sm" style={{ color: "#8892a0" }}>준비 중이에요</p>
    </div>
  );
}
