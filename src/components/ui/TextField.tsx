import { forwardRef, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
  /** 포커스 시 테두리/글로우 색 */
  accent?: string;
}

// 다크 공용 입력창. label·error·react-hook-form register(spread)를 지원한다.
const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, accent = "#74C7FF", style, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);

  const inputStyle: CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${focused ? accent : "rgba(255,255,255,0.1)"}`,
    boxShadow: focused ? `0 0 0 3px ${accent}22` : "none",
    color: "#f0f2f8",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
    width: "100%",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    ...style,
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-semibold" style={{ color: "#6b7785" }}>{label}</span>}
      <input
        ref={ref}
        style={inputStyle}
        {...rest}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
      />
      {error && <p className="text-xs" style={{ color: "#FF6B6B" }}>{error}</p>}
    </div>
  );
});

export default TextField;
