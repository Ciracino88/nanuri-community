import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";

interface Props {
  /** 이동할 경로. 없으면 navigate(-1) */
  to?: string;
  /** 커스텀 핸들러 (지정 시 to/기본 동작 무시) */
  onClick?: () => void;
}

/** 공용 뒤로가기 버튼 — 36px 둥근 흰 원 + lucide ChevronLeft */
export default function BackButton({ to, onClick }: Props) {
  const navigate = useNavigate();
  const handle = onClick ?? (() => (to ? navigate(to) : navigate(-1)));

  return (
    <motion.button
      type="button"
      className="flex items-center justify-center rounded-full shrink-0 bg-card border border-line shadow-card"
      style={{ width: 36, height: 36 }}
      whileTap={{ scale: 0.88 }}
      onClick={handle}
      aria-label="뒤로"
    >
      <ChevronLeft size={18} className="text-fg-strong" />
    </motion.button>
  );
}
