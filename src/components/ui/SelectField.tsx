import { forwardRef, useState, type CSSProperties, type SelectHTMLAttributes, type ReactNode } from "react";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  error?: string;
  accent?: string;
  placeholder?: string;
  options: string[];
}

// TextField와 동일한 톤의 다크 공용 셀렉트.
const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, error, accent = "#74C7FF", placeholder, options, style, value, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);

  const selectStyle: CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${focused ? accent : "rgba(255,255,255,0.1)"}`,
    boxShadow: focused ? `0 0 0 3px ${accent}22` : "none",
    color: value ? "#f0f2f8" : "#6b7785",
    borderRadius: 12,
    padding: "12px 40px 12px 14px",
    fontSize: 14,
    width: "100%",
    outline: "none",
    appearance: "none",
    colorScheme: "dark",
    transition: "border-color 0.15s, box-shadow 0.15s",
    ...style,
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-semibold" style={{ color: "#6b7785" }}>{label}</span>}
      <div style={{ position: "relative" }}>
        <select
          ref={ref}
          value={value}
          style={selectStyle}
          {...rest}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: "#6b7785" }}>▼</span>
      </div>
      {error && <p className="text-xs" style={{ color: "#FF6B6B" }}>{error}</p>}
    </div>
  );
});

export default SelectField;
