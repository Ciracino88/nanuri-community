import { motion } from "motion/react";
import type { MemberProfile } from "../../types/worship";

const ACCENT = "#FF6B6B";

interface PositionSlotProps {
  position: string;
  member: MemberProfile | null;
  isMine: boolean;
  myAvailable: boolean;
  toggling: boolean;
  index?: number;
  onToggle?: () => void;
}

export default function PositionSlot({ position, member, isMine, toggling, index = 0, onToggle }: PositionSlotProps) {
  const isClickable = isMine && !!onToggle;
  const initial = member?.name ? member.name.slice(-1) : "";

  return (
    <motion.div
      className="flex flex-col items-center gap-1.5"
      initial={{ opacity: 0, y: 16, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28, delay: index * 0.04 }}
    >
      <p className="text-xs font-semibold text-center leading-tight" style={{ color: "#8892a0", minHeight: 28 }}>
        {position}
      </p>
      <motion.button
        type="button"
        onClick={isClickable ? onToggle : undefined}
        disabled={!isClickable || toggling}
        whileTap={isClickable ? { scale: 0.88 } : undefined}
        className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center text-base font-bold"
        style={
          member
            ? { background: `${ACCENT}22`, border: `2px solid ${ACCENT}66`, color: ACCENT }
            : {
                background: "rgba(255,255,255,0.05)",
                border: isMine ? `1.5px dashed ${ACCENT}88` : "1.5px dashed rgba(255,255,255,0.14)",
                color: isMine ? ACCENT : "#4a5568",
                cursor: isClickable ? "pointer" : "default",
              }
        }
      >
        {member ? (
          member.avatar_url ? (
            <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            initial
          )
        ) : (
          "+"
        )}
      </motion.button>
      <p className="text-xs font-semibold" style={{ color: member ? "#e0e6f0" : "#4a5568" }}>
        {member ? member.name : "미정"}
      </p>
    </motion.div>
  );
}
