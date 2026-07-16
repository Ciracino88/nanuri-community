import { forwardRef, useState, type CSSProperties, type TextareaHTMLAttributes, type ReactNode } from "react";
import { ACCENT } from "../../constants/theme";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  error?: string;
  /** @deprecated 액센트는 퍼플 단일. 호출부 정리 후 제거 예정. */
  accent?: string;
}

// 공용 여러 줄 입력 (TextField와 동일 톤).
const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, accent = ACCENT, style, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);

  const areaStyle: CSSProperties = {
    background: "var(--color-card)",
    border: `1px solid ${focused ? accent : "var(--color-line)"}`,
    boxShadow: focused ? `0 0 0 3px ${accent}26` : "none",
    color: "var(--color-fg-strong)",
    borderRadius: "var(--radius-field)",
    padding: "12px 14px",
    // 16px 미만이면 iOS Safari 가 포커스 시 자동 확대한다. 줄이지 말 것.
    fontSize: 16,
    width: "100%",
    outline: "none",
    resize: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    ...style,
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-caption font-semibold text-fg-muted">{label}</span>}
      <textarea
        ref={ref}
        style={areaStyle}
        {...rest}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
      />
      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
});

export default TextArea;
