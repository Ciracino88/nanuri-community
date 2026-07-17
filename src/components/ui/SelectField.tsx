import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown } from "lucide-react";

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: ReactNode;
}

/** 프로필·청구서 공용 커스텀 드롭다운 (네이티브 select 아님, 애니메이션 목록).
 *  트리거는 TextField 와 같은 껍데기라 나란히 놔도 어긋나지 않는다. */
export default function SelectField({ value, onChange, options, placeholder = "선택", label }: SelectFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-label2 font-medium text-label-normal">{label}</span>}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full rounded-field border bg-bg-normal px-4 py-3 text-body1 text-left flex items-center justify-between transition-colors ${
          open ? "border-primary-normal" : "border-line-solid"
        }`}
      >
        <span className={value ? "text-label-normal" : "text-label-alternative"}>{value || placeholder}</span>
        <motion.span
          className="text-label-neutral flex"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden rounded-field bg-bg-normal border border-line-solid shadow-small"
          >
            {options.map((o, i) => (
              <button
                key={o}
                type="button"
                className={`w-full px-4 py-2.5 text-body2 font-medium text-left flex items-center justify-between ${
                  value === o ? "text-primary-normal" : "text-label-neutral"
                } ${i < options.length - 1 ? "border-b border-line-solid" : ""}`}
                onClick={() => { onChange(o); setOpen(false); }}
              >
                {o}
                {value === o && <Check size={16} strokeWidth={3} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
