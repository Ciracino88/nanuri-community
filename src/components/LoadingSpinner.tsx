import { motion } from "motion/react";
import { ACCENT } from "../constants/theme";

interface Props {
  label?: string;
  size?: "sm" | "lg" | number;
  /** @deprecated 액센트는 퍼플 단일. 호출부 정리 후 제거 예정. */
  color?: string;
}

const PX = { sm: 26, lg: 40 };

export default function LoadingSpinner({ label, size = "sm", color = ACCENT }: Props) {
  const px = typeof size === "number" ? size : PX[size];
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className="relative flex items-center justify-center" style={{ width: px, height: px }}>
        <div className="absolute inset-0 rounded-full border-2 border-line" />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, transparent 55%, ${color} 80%, transparent 100%)`,
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2.5px), #fff calc(100% - 2.5px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 2.5px), #fff calc(100% - 2.5px))",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
      </div>
      {label && (
        <p className="text-caption font-semibold text-fg-muted" style={{ letterSpacing: "0.06em" }}>
          {label}
        </p>
      )}
    </div>
  );
}
