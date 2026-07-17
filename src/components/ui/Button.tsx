// src/components/ui/Button.tsx
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  /** 로딩 중 문구. 안 주면 children 을 그대로 두고 스피너만 붙인다. */
  loadingText?: string;
  variant?: "primary" | "outline" | "danger";
}

// 위계는 primary → outline 순. 한 화면에 primary 는 하나만 둔다.
const VARIANTS = {
  // 주 액션. 파랑 위 흰 글자는 대비 4.83:1 로 AA 를 아슬아슬하게 통과한다 —
  // 그래서 글자를 semibold 아래로 내리지 말 것(docs/design.md).
  primary: "bg-primary-normal text-static-white active:opacity-90 disabled:bg-interaction-disable disabled:text-label-disable",
  outline: "bg-bg-normal border border-line-solid text-label-normal active:bg-bg-alternative",
  danger: "bg-status-negative text-static-white active:opacity-90",
};

export default function Button({
  loading, loadingText, variant = "primary", children, className, ...props
}: ButtonProps) {
  return (
    <button
      // 반경은 rounded-field(14). 알약(rounded-full)은 옛 디자인의 정체성이라 쓰지 않는다 —
      // 예외는 작은 인라인 칩·배지뿐이다. 글자만 든 작은 것들은 알약이 맞다.
      // 플로팅 버튼도 여기 예외가 아니다 — 누르는 것은 반경 14 로 통일한다.
      className={`w-full py-3.5 px-5 rounded-field text-body1 font-semibold transition
        disabled:cursor-not-allowed
        ${VARIANTS[variant]}
        ${className ?? ""}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        // children 을 통째로 갈아끼우지 않는다 — 옛 Button 은 그래서 시트마다
        // "만드는 중..."이 "처리 중..."으로 뭉개졌다.
        <span className="flex items-center justify-center gap-2">
          <Loader2 size={18} className="animate-spin" />
          {loadingText ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
