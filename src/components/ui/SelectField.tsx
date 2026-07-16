import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ACCENT } from "../../constants/theme";

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  /** @deprecated 액센트는 퍼플 단일. 호출부 정리 후 제거 예정. */
  accent?: string;
  label?: ReactNode;
}

// 프로필·청구서 공용 커스텀 드롭다운 (네이티브 select 아님, 애니메이션 목록).
export default function SelectField({ value, onChange, options, placeholder = "선택", accent = ACCENT, label }: SelectFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-caption font-semibold text-fg-muted">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 text-emphasis font-medium text-left flex items-center justify-between rounded-field bg-card"
        style={{
          border: `1px solid ${open ? accent : "var(--color-line)"}`,
          boxShadow: open ? `0 0 0 3px ${accent}26` : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        <span className={value ? "text-fg-strong" : "text-fg-muted"}>{value || placeholder}</span>
        <motion.span className="text-fg-muted" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>▾</motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden rounded-field bg-card border border-line shadow-card"
          >
            {options.map((o, i) => (
              <button
                key={o}
                type="button"
                className={`w-full px-4 py-2.5 text-body font-medium text-left ${value === o ? "text-accent" : "text-fg"} ${i < options.length - 1 ? "border-b border-line-soft" : ""}`}
                onClick={() => { onChange(o); setOpen(false); }}
              >
                {value === o && <span className="mr-2">✓</span>}
                {o}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
