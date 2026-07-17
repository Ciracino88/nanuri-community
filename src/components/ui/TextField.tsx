import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
  /** 인풋 아래 안내 문구. error 가 있으면 error 가 이긴다. */
  helper?: string;
  /** 오른쪽 고정 접미 (예: "원") */
  suffix?: ReactNode;
  /** 바깥 래퍼 className (레이아웃용, 예: "flex-1" / "w-24") */
  wrapperClassName?: string;
}

/**
 * 공용 입력창. 원티드 Textfield 명세를 따른다 — 주제(라벨) → 인풋 → 메시지(헬퍼) 3단.
 *
 * 상태는 색으로만 구분하지 않는다. 에러일 때 빨간 테두리 + (!) 아이콘을 같이 띄우는 건
 * 원티드 명세이자 색각 이상 사용자를 위한 것이다 — 색 하나에 의미를 걸면 안 된다.
 */
const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, helper, suffix, wrapperClassName, className, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);
  const disabled = rest.disabled;

  const border = error
    ? "border-status-negative"
    : focused
      ? "border-primary-normal"
      : "border-line-solid";

  // 아이콘과 접미가 겹치지 않게 오른쪽 여백을 상황별로 준다.
  const padRight = error && suffix ? "pr-16" : error || suffix ? "pr-11" : "pr-4";

  return (
    <div className={`flex flex-col gap-1.5${wrapperClassName ? ` ${wrapperClassName}` : ""}`}>
      {label && <span className="text-label2 font-medium text-label-normal">{label}</span>}

      <div className="relative">
        <input
          ref={ref}
          // text-body1 = 16px. 이보다 작으면 iOS Safari 가 포커스 시 확대한다. 줄이지 말 것.
          className={`w-full rounded-field border py-3 pl-4 ${padRight} text-body1 outline-none transition-colors
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

        {suffix && (
          <span
            className={`absolute top-1/2 -translate-y-1/2 text-body1 font-medium text-label-neutral pointer-events-none ${
              error ? "right-11" : "right-4"
            }`}
          >
            {suffix}
          </span>
        )}

        {error && (
          <AlertCircle
            size={18}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-status-negative pointer-events-none"
          />
        )}
      </div>

      {error
        ? <p className="text-caption1 text-status-negative">{error}</p>
        : helper && <p className="text-caption1 text-label-neutral">{helper}</p>}
    </div>
  );
});

export default TextField;
