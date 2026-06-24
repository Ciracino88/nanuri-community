// src/components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "outline";
}

export default function Button({ loading, variant = "primary", children, className, ...props }: ButtonProps) {
  return (
    <button
      className={`w-full py-2.5 px-4 rounded-lg text-emphasis font-medium transition
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variant === "primary"
          ? "bg-info text-white hover:opacity-90 active:opacity-80"
          : "border border-line text-fg hover:bg-surface"}
        ${className ?? ""}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? "처리 중..." : children}
    </button>
  );
}