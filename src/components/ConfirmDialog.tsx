import { useEffect } from "react";
import { create } from "zustand";
import { motion, AnimatePresence } from "motion/react";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState {
  open: boolean;
  options: ConfirmOptions | null;
  resolve: ((ok: boolean) => void) | null;
  show: (options: ConfirmOptions) => Promise<boolean>;
  close: (ok: boolean) => void;
}

const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  options: null,
  resolve: null,
  show: (options) =>
    new Promise<boolean>((resolve) => {
      set({ open: true, options, resolve });
    }),
  close: (ok) => {
    get().resolve?.(ok);
    set({ open: false, resolve: null });
  },
}));

// 어디서든 `if (await confirmDialog({...}))` 형태로 사용
export function confirmDialog(options: ConfirmOptions) {
  return useConfirmStore.getState().show(options);
}

export function ConfirmHost() {
  const { open, options, close } = useConfirmStore();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const danger = options?.danger;
  const accent = danger ? "#FF6B6B" : "#74C7FF";

  return (
    <AnimatePresence>
      {open && options && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => close(false)}
        >
          <motion.div
            className="w-full rounded-3xl p-5 flex flex-col gap-4"
            style={{
              maxWidth: 320,
              background: "rgba(22,25,35,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
            }}
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1.5">
              <h2 className="text-base font-black" style={{ color: "#f0f2f8" }}>{options.title}</h2>
              {options.message && <p className="text-sm leading-relaxed" style={{ color: "#8892a0" }}>{options.message}</p>}
            </div>

            <div className="flex gap-2.5">
              <motion.button
                className="flex-1 py-3 rounded-xl text-sm font-bold"
                style={{ background: "rgba(255,255,255,0.06)", color: "#8892a0", border: "1px solid rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.96 }}
                onClick={() => close(false)}
              >
                {options.cancelLabel ?? "취소"}
              </motion.button>
              <motion.button
                className="flex-1 py-3 rounded-xl text-sm font-black"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)`, color: "#0f1117" }}
                whileTap={{ scale: 0.96 }}
                onClick={() => close(true)}
              >
                {options.confirmLabel ?? "확인"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
