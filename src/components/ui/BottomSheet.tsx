import { motion } from "motion/react";
import { X } from "lucide-react";

/**
 * 아래에서 올라오는 시트. 배경 딤 + 손잡이 + 제목/닫기까지가 이 컴포넌트 몫이고,
 * 안쪽 폼은 children 이 채운다.
 *
 * **`AnimatePresence` 안에서 조건부로 렌더할 것** — 닫히는 애니메이션이 거기 달렸다.
 *   <AnimatePresence>{open && <BottomSheet .../>}</AnimatePresence>
 */
export default function BottomSheet({ title, onClose, children }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
    >
      {/* 딤은 토큰이 아니라 raw 다 — 표면색이 아니라 "화면을 덮는 그림자"라서 라이트에서도 검정이 맞다. */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(23,23,25,0.45)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-md max-h-[88vh] bg-bg-elevated px-6 pt-3 flex flex-col gap-4 shadow-xlarge"
        style={{
          borderTopLeftRadius: "var(--radius-sheet)",
          borderTopRightRadius: "var(--radius-sheet)",
          paddingBottom: "calc(1.75rem + env(safe-area-inset-bottom))",
        }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-2 bg-fill-strong" />
        <div className="flex items-center justify-between">
          <h2 className="text-headline2 font-bold text-label-normal">{title}</h2>
          <button
            type="button" onClick={onClose} aria-label="닫기"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-alternative text-label-neutral active:scale-95 transition"
          >
            <X size={16} />
          </button>
        </div>
        {/* 손잡이·제목은 고정하고 폼만 스크롤한다. 시트가 뷰포트를 넘으면(항목이 많은 폼)
            여기가 없으면 저장 버튼이 화면 밖으로 나가 아예 누를 수 없다.
            min-h-0: flex 자식은 기본 min-height:auto 라 이게 없으면 축소되지 않아 스크롤이 안 걸린다.
            -mx-6 px-6: 포커스 링이 좌우로 잘리지 않게 스크롤 영역을 시트 패딩만큼 넓힌다. */}
        <div className="flex flex-col gap-4 overflow-y-auto min-h-0 -mx-6 px-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
