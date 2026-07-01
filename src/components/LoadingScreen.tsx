import { motion } from "motion/react";

const BLOBS = [
  { color: "78,205,196", x: "8%", y: "12%", w: 360 },
  { color: "199,125,255", x: "65%", y: "5%", w: 300 },
  { color: "255,107,107", x: "35%", y: "60%", w: 260 },
];

interface LoadingScreenProps {
  /** true면 탭바까지 전체 뷰포트를 덮음. 기본은 콘텐츠 영역만 채워 탭바 유지 */
  fullscreen?: boolean;
}

export default function LoadingScreen({ fullscreen = false }: LoadingScreenProps) {
  return (
    <motion.div
      className={`flex items-center justify-center overflow-hidden ${
        fullscreen ? "fixed inset-0 z-50" : "relative flex-1 w-full"
      }`}
      style={{ background: "#0a0c14" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        {BLOBS.map((b, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: b.w,
              height: b.w,
              left: b.x,
              top: b.y,
              background: `radial-gradient(circle, rgba(${b.color},0.13) 0%, transparent 70%)`,
              filter: "blur(48px)",
            }}
            animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 5 + i * 1.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
          />
        ))}
      </div>

      {/* Spinner + text */}
      <div className="relative flex flex-col items-center gap-10">
        <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
          <div className="absolute inset-0 rounded-full" style={{ border: "2px solid rgba(255,255,255,0.07)" }} />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, transparent 60%, #4ECDC4 80%, #C77DFF 90%, transparent 100%)",
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 3px))",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 3px))",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="rounded-full"
            style={{ width: 52, height: 52, background: "rgba(78,205,196,0.08)", border: "1px solid rgba(78,205,196,0.2)" }}
            animate={{ scale: [1, 1.1, 1], boxShadow: ["0 0 0px rgba(78,205,196,0)", "0 0 20px rgba(78,205,196,0.3)", "0 0 0px rgba(78,205,196,0)"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <p className="text-sm font-semibold" style={{ color: "#4a5568", letterSpacing: "0.18em" }}>Loading</p>
          <div className="overflow-hidden rounded-full" style={{ width: 140, height: 3, background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, transparent, #4ECDC4, #C77DFF, transparent)", width: "60%" }}
              animate={{ x: [-84, 140] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.2 }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
