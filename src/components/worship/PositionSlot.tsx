import { motion } from "motion/react";
import type { MemberProfile } from "../../types/worship";

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

  // 슬롯 상태는 셋: 확정(멤버 있음) · 내 자리(비어 있고 내가 낄 수 있음) · 그냥 빈 자리.
  // 확정은 상태 배경(status-bg-active)으로 채우고, 내 자리는 Primary 점선으로 눌러야 함을
  // 알린다. 색은 원티드 상호작용 색인 파랑 하나로 통일한다(옛 빨강 제거).
  let slotClass: string;
  if (member) {
    slotClass = "bg-status-bg-active text-primary-normal";
  } else if (isMine) {
    slotClass = "bg-bg-normal border-2 border-dashed border-primary-normal text-primary-normal";
  } else {
    slotClass = "bg-bg-alternative border border-dashed border-line-normal text-label-assistive";
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-1.5"
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28, delay: index * 0.04 }}
    >
      <p className="text-caption1 font-medium text-center leading-tight text-label-neutral" style={{ minHeight: 28 }}>
        {position}
      </p>

      {/* 슬롯은 아바타를 담고 누를 수 있어 rounded-full 로 둔다(아바타 규칙, docs/design.md). */}
      <motion.button
        type="button"
        onClick={isClickable ? onToggle : undefined}
        disabled={!isClickable || toggling}
        whileTap={isClickable ? { scale: 0.9 } : undefined}
        className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-body1 font-bold transition disabled:opacity-100 ${slotClass} ${isClickable ? "cursor-pointer" : "cursor-default"}`}
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

      <p className={`text-caption1 font-medium ${member ? "text-label-normal" : "text-label-assistive"}`}>
        {member ? member.name : "미정"}
      </p>
    </motion.div>
  );
}
