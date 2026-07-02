import { ChevronRight, type LucideIcon } from "lucide-react";
import { TAB_COLORS } from "../../constants/theme";

interface ActionRowProps {
  Icon: LucideIcon;
  label: string;
  desc?: string;
  /** 라벨 옆 작은 배지 (예: "준비 중") */
  badge?: string;
  accent?: string;
  onClick: () => void;
}

// 아이콘 타일 + 제목/설명 + 화살표 형태의 다크 액션 행 (허브·재정 탭 등 공용).
export default function ActionRow({ Icon, label, desc, badge, accent = TAB_COLORS.admin, onClick }: ActionRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 rounded-2xl text-left active:scale-[0.99] transition"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}18` }}>
        <Icon size={20} color={accent} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold" style={{ color: "#f0f2f8" }}>{label}</p>
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.08)", color: "#8892a0" }}>
              {badge}
            </span>
          )}
        </div>
        {desc && <p className="text-xs mt-0.5" style={{ color: "#6b7785" }}>{desc}</p>}
      </div>
      <ChevronRight size={18} color="#4a5568" />
    </button>
  );
}
