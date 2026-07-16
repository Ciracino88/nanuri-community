import { forwardRef, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";
import { ACCENT } from "../../constants/theme";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
  /** @deprecated 액센트는 퍼플 단일. 호출부 정리 후 제거 예정. */
  accent?: string;
  /** 오른쪽 고정 접미 (예: "원") */
  suffix?: ReactNode;
  /** 바깥 래퍼 className (레이아웃용, 예: "flex-1" / "w-24") */
  wrapperClassName?: string;
}

// 공용 입력창. label·error·suffix·react-hook-form register(spread)를 지원한다.
const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, accent = ACCENT, suffix, wrapperClassName, style, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);

  const inputStyle: CSSProperties = {
    background: "var(--color-card)",
    border: `1px solid ${focused ? accent : "var(--color-line)"}`,
    boxShadow: focused ? `0 0 0 3px ${accent}26` : "none",
    color: "var(--color-fg-strong)",
    borderRadius: "var(--radius-field)",
    padding: "12px 14px",
    paddingRight: suffix ? 40 : 14,
    // 16px 미만이면 iOS Safari 가 포커스 시 자동 확대한다. 줄이지 말 것.
    fontSize: 16,
    width: "100%",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    ...style,
  };

  return (
    <div className={`flex flex-col gap-1.5${wrapperClassName ? ` ${wrapperClassName}` : ""}`}>
      {label && <span className="text-caption font-semibold text-fg-muted">{label}</span>}
      <div style={{ position: "relative" }}>
        <input
          ref={ref}
          style={inputStyle}
          {...rest}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-body font-semibold text-fg-muted pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
});

export default TextField;
