// src/components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "outline";
}

export default function Button({ loading, variant = "primary", children, className, ...props }: ButtonProps) {
  return (
    <button
      className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variant === "primary"
          ? "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700"
          : "border border-gray-200 text-gray-600 hover:bg-gray-50"}
        ${className ?? ""}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? "처리 중..." : children}
    </button>
  );
}