import { forwardRef, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
  /** 포커스 시 테두리/글로우 색 */
  accent?: string;
  /** 오른쪽 고정 접미 (예: "원") */
  suffix?: ReactNode;
}

// 다크 공용 입력창. label·error·suffix·react-hook-form register(spread)를 지원한다.
const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, accent = "#74C7FF", suffix, style, ...rest },
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
    paddingRight: suffix ? 40 : 14,
    fontSize: 14,
    width: "100%",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    ...style,
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-semibold" style={{ color: "#6b7785" }}>{label}</span>}
      <div style={{ position: "relative" }}>
        <input
          ref={ref}
          style={inputStyle}
          {...rest}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none" style={{ color: "#6b7785" }}>
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-xs" style={{ color: "#FF6B6B" }}>{error}</p>}
    </div>
  );
});

export default TextField;
