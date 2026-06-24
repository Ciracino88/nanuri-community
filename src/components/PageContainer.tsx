import type { ReactNode } from "react";

interface Props {
  width?: "narrow" | "default" | "wide" | "full";
  children: ReactNode;
  className?: string;
}

const WIDTHS = {
  narrow: "max-w-md",   // 폼 (청구서, 프로필)
  default: "max-w-lg",  // 홈, 설문, 투표
  wide: "max-w-2xl",    // 워십, 회계 목록
  full: "max-w-5xl",    // 회계 상세/보고서 (표·영수증)
};

export default function PageContainer({ width = "default", children, className = "" }: Props) {
  return (
    <div
      className={`${WIDTHS[width]} mx-auto w-full px-5 pt-8 flex flex-col gap-6 ${className}`}
      style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
    >
      {children}
    </div>
  );
}
