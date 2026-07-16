import { ChevronRight, type LucideIcon } from "lucide-react";
import { TINT_TILE, type Tint } from "../../constants/tints";

interface ActionRowProps {
  Icon: LucideIcon;
  label: string;
  desc?: string;
  /** 라벨 옆 작은 배지 (예: "준비 중") */
  badge?: string;
  tint?: Tint;
  onClick: () => void;
}

/**
 * 앱 표준 리스트 아이템: 틴트 타일 + 제목/설명 + 화살표.
 * 리스트가 정갈해 보이는 건 아이콘이 아니라 왼쪽 틴트 사각형이 같은 크기로 반복되기 때문이다.
 * 새 목록 UI 는 새로 만들지 말고 이걸 쓴다.
 */
export default function ActionRow({ Icon, label, desc, badge, tint = "info", onClick }: ActionRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3.5 p-4 rounded-card bg-card shadow-card text-left active:scale-[0.99] transition"
    >
      <div className={`w-12 h-12 rounded-tile flex items-center justify-center shrink-0 ${TINT_TILE[tint]}`}>
        <Icon size={22} strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-body font-semibold text-fg-strong">{label}</p>
          {badge && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 bg-sunken text-fg-muted">
              {badge}
            </span>
          )}
        </div>
        {desc && <p className="text-caption text-fg-muted mt-0.5">{desc}</p>}
      </div>
      <ChevronRight size={18} className="text-fg-faint shrink-0" />
    </button>
  );
}
