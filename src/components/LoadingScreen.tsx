import { motion } from "motion/react";
import LoadingSpinner from "./LoadingSpinner";

interface LoadingScreenProps {
  /** true면 탭바까지 전체 뷰포트를 덮음. 기본은 콘텐츠 영역만 채워 탭바 유지 */
  fullscreen?: boolean;
}

// 스피너는 LoadingSpinner 에 맡긴다. 다크 시절엔 여기에 두 번째 스피너 구현이
// 통째로 들어 있었다(앰비언트 블롭 + 콘틱 그라데이션 링 + 진행 바).
export default function LoadingScreen({ fullscreen = false }: LoadingScreenProps) {
  return (
    <motion.div
      className={`flex items-center justify-center overflow-hidden bg-surface ${
        fullscreen ? "fixed inset-0 z-50" : "relative flex-1 w-full"
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <LoadingSpinner size="lg" label="Loading" />
    </motion.div>
  );
}
