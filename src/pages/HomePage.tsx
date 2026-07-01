import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Receipt, ChevronRight } from "lucide-react";
import { TAB_COLORS } from "../constants/theme";

const BILL_ACCENT = TAB_COLORS.home;

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
      {/* 준비 중 안내 */}
      <div className="flex flex-col items-center gap-3">
        <motion.div
          className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
          style={{ background: `${TAB_COLORS.home}22` }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          🏠
        </motion.div>
        <p className="font-bold" style={{ color: "#f0f2f8" }}>홈</p>
        <p className="text-sm" style={{ color: "#8892a0" }}>디자인 작업 중입니다.</p>
      </div>

      {/* 청구서 작성 진입 */}
      <motion.button
        onClick={() => navigate("/member/bill")}
        whileTap={{ scale: 0.98 }}
        className="w-full max-w-xs flex items-center gap-3 p-4 rounded-2xl text-left"
        style={{ background: `${BILL_ACCENT}12`, border: `1px solid ${BILL_ACCENT}30` }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${BILL_ACCENT}22` }}>
          <Receipt size={20} color={BILL_ACCENT} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: "#f0f2f8" }}>청구서 작성</p>
          <p className="text-xs mt-0.5" style={{ color: "#6b7785" }}>영수증 첨부해 비용을 청구해요</p>
        </div>
        <ChevronRight size={18} color="#4a5568" />
      </motion.button>
    </div>
  );
}
