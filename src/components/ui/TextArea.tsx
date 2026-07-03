import { forwardRef, useState, type CSSProperties, type TextareaHTMLAttributes, type ReactNode } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  error?: string;
  accent?: string;
}

// 다크 공용 여러 줄 입력 (TextField와 동일 톤).
const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, accent = "#74C7FF", style, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);

  const areaStyle: CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${focused ? accent : "rgba(255,255,255,0.1)"}`,
    boxShadow: focused ? `0 0 0 3px ${accent}22` : "none",
    color: "#f0f2f8",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
    width: "100%",
    outline: "none",
    resize: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    ...style,
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-semibold" style={{ color: "#6b7785" }}>{label}</span>}
      <textarea
        ref={ref}
        style={areaStyle}
        {...rest}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
      />
      {error && <p className="text-xs" style={{ color: "#FF6B6B" }}>{error}</p>}
    </div>
  );
});

export default TextArea;
