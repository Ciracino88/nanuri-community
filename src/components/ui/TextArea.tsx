import { forwardRef, useState, type TextareaHTMLAttributes, type ReactNode } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  error?: string;
  /** 인풋 아래 안내 문구. error 가 있으면 error 가 이긴다. */
  helper?: string;
}

/** 공용 여러 줄 입력. TextField 와 같은 톤 — 바꿀 땐 둘을 같이 본다. */
const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, helper, className, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);
  const disabled = rest.disabled;

  const border = error
    ? "border-status-negative"
    : focused
      ? "border-primary-normal"
      : "border-line-solid";

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-label2 font-medium text-label-normal">{label}</span>}

      <textarea
        ref={ref}
        // text-body1 = 16px. 이보다 작으면 iOS Safari 가 포커스 시 확대한다. 줄이지 말 것.
        className={`w-full rounded-field border px-4 py-3 text-body1 outline-none resize-none transition-colors
          ${border}
          ${disabled
            ? "bg-interaction-disable text-label-disable"
            : "bg-bg-normal text-label-normal"}
          placeholder:text-label-alternative
          ${className ?? ""}`}
        {...rest}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
      />

      {error
        ? <p className="text-caption1 text-status-negative">{error}</p>
        : helper && <p className="text-caption1 text-label-neutral">{helper}</p>}
    </div>
  );
});

export default TextArea;
