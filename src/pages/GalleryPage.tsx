import { motion } from "motion/react";
import { TAB_COLORS } from "../constants/theme";

export default function GalleryPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <motion.div
        className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
        style={{ background: `${TAB_COLORS.gallery}22` }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        🖼️
      </motion.div>
      <p className="font-bold" style={{ color: "#f0f2f8" }}>갤러리</p>
      <p className="text-sm" style={{ color: "#8892a0" }}>
        준비 중인 기능입니다.
      </p>
    </div>
  );
}
