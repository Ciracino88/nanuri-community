import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  accent?: string;
  label?: ReactNode;
}

// 프로필·청구서 공용 커스텀 드롭다운 (네이티브 select 아님, 애니메이션 목록).
export default function SelectField({ value, onChange, options, placeholder = "선택", accent = "#74C7FF", label }: SelectFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-semibold" style={{ color: "#6b7785" }}>{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 text-sm font-bold text-left flex items-center justify-between rounded-xl"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${open ? accent : "rgba(255,255,255,0.1)"}`,
          boxShadow: open ? `0 0 0 3px ${accent}22` : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        <span style={{ color: value ? "#f0f2f8" : "#6b7785" }}>{value || placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ color: "#6b7785" }}>▾</motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {options.map((o, i) => (
              <button
                key={o}
                type="button"
                className="w-full px-4 py-2.5 text-sm font-semibold text-left"
                style={{ color: value === o ? accent : "#c0c8d8", borderBottom: i < options.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
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
