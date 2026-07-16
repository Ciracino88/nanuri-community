// src/components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "dark" | "outline" | "danger";
}

// 위계는 퍼플 → 다크 → 아웃라인 순. 한 화면에 primary 는 하나만 둔다.
const VARIANTS = {
  // 주 액션. 퍼플 위 흰 글자는 대비 4.99:1 (AA 통과)
  primary: "bg-accent text-white shadow-accent hover:bg-accent-strong active:bg-accent-strong",
  // 보조 액션 (참고 디자인의 "나의 활동 인증" 같은 자리)
  dark: "bg-inverse text-white hover:opacity-90 active:opacity-80",
  outline: "bg-card border border-line text-fg hover:bg-surface active:bg-sunken",
  danger: "bg-danger text-white hover:opacity-90 active:opacity-80",
};

export default function Button({ loading, variant = "primary", children, className, ...props }: ButtonProps) {
  return (
    <button
      className={`w-full py-3.5 px-5 rounded-full text-emphasis font-semibold transition
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
        ${VARIANTS[variant]}
        ${className ?? ""}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? "처리 중..." : children}
    </button>
  );
}
