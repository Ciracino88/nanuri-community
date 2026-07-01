import type { ComponentType, SVGProps } from "react";

type Tint = "info" | "purple" | "teal" | "warning";

interface PageHeroProps {
  /** Heroicons v1 outline 컴포넌트 (하단 탭바와 동일 계열) */
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** 상단 작은 라벨 (예: "행사") */
  title: string;
  /** 크게 강조되는 문구. "\n" 으로 줄바꿈 (예: "일정을 확인하고\n의견을 남겨보세요") */
  desc: string;
  tint?: Tint;
}

// 파스텔(subtle) 배경 + 진한 톤(strong) 강조 문구
const TINTS: Record<Tint, { bg: string; label: string; head: string; icon: string }> = {
  info: { bg: "bg-info-subtle", label: "text-info", head: "text-info-strong", icon: "text-info" },
  purple: { bg: "bg-purple-subtle", label: "text-purple", head: "text-purple-strong", icon: "text-purple" },
  teal: { bg: "bg-teal-subtle", label: "text-teal", head: "text-teal-strong", icon: "text-teal" },
  warning: { bg: "bg-warning-subtle", label: "text-warning", head: "text-warning-strong", icon: "text-warning" },
};

/**
 * 페이지 상단 히어로 카드 (홈 히어로 스타일).
 * 작은 라벨 + 크게 강조된 2줄 문구, 파스텔 배경, 살짝 띄워 둥둥 떠다니는 장식 아이콘.
 */
export default function PageHero({ Icon, title, desc, tint = "info" }: PageHeroProps) {
  const t = TINTS[tint];
  return (
    <div
      className={`relative ${t.bg} rounded-2xl p-6 overflow-hidden`}
      style={{ animation: "cardEnter 0.4s ease both" }}
    >
      <Icon
        className={`absolute ${t.icon}`}
        style={{ right: 10, bottom: 12, width: 88, height: 88, opacity: 0.14, animation: "float 4s ease-in-out infinite" }}
        aria-hidden="true"
      />
      <p className={`text-caption font-medium mb-2 ${t.label}`}>{title}</p>
      <h1 className={`text-title font-medium leading-snug whitespace-pre-line ${t.head}`}>{desc}</h1>
    </div>
  );
}
