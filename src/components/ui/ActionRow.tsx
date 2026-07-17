import { ChevronRight, type LucideIcon } from "lucide-react";

interface ActionRowProps {
  Icon: LucideIcon;
  label: string;
  desc?: string;
  /** 라벨 옆 작은 배지 (예: "준비 중") */
  badge?: string;
  onClick: () => void;
}

/**
 * 앱 표준 리스트 아이템: 아이콘 타일 + 제목/설명 + 화살표.
 * 리스트가 정갈해 보이는 건 아이콘이 아니라 왼쪽 사각형이 같은 크기로 반복되기 때문이다.
 * 새 목록 UI 는 새로 만들지 말고 이걸 쓴다.
 *
 * 타일 색은 하나뿐이다 — 카테고리마다 색을 돌리던 `tint` prop 은 없앴다.
 * 원티드에는 카테고리 팔레트가 없고, 항목마다 색이 다르면 목록이 산만해진다.
 */
export default function ActionRow({ Icon, label, desc, badge, onClick }: ActionRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3.5 p-4 rounded-card bg-bg-normal shadow-small text-left active:scale-[0.99] transition"
    >
      <div className="w-12 h-12 rounded-field bg-status-bg-active text-primary-normal flex items-center justify-center shrink-0">
        <Icon size={22} strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-body1 font-semibold text-label-normal">{label}</p>
          {badge && (
            <span className="text-caption1 font-medium px-2 py-0.5 rounded-full shrink-0 bg-status-bg-idle text-label-neutral">
              {badge}
            </span>
          )}
        </div>
        {desc && <p className="text-label2 text-label-neutral mt-0.5">{desc}</p>}
      </div>
      <ChevronRight size={18} className="text-label-assistive shrink-0" />
    </button>
  );
}
