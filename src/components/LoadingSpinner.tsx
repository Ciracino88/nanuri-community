import { motion } from "motion/react";

interface Props {
  label?: string;
  size?: "sm" | "lg" | number;
  color?: string;
}

const PX = { sm: 26, lg: 40 };

export default function LoadingSpinner({ label, size = "sm", color = "#4ECDC4" }: Props) {
  const px = typeof size === "number" ? size : PX[size];
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className="relative flex items-center justify-center" style={{ width: px, height: px }}>
        <div className="absolute inset-0 rounded-full" style={{ border: "2px solid rgba(255,255,255,0.09)" }} />
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
        <p className="text-xs font-semibold" style={{ color: "#8892a0", letterSpacing: "0.06em" }}>
          {label}
        </p>
      )}
    </div>
  );
}
