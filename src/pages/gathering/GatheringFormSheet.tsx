import { useState } from "react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import TextField from "../../components/ui/TextField";
import TextArea from "../../components/ui/TextArea";
import { TAB_COLORS } from "../../constants/theme";
import { defaultGatheringAt, localInputToISO } from "../../lib/gatheringTime";
import type { GatheringDraft } from "../../types/gathering";

const ACCENT = TAB_COLORS.gatherings;

// 번개에서 자주 쓸 법한 것들. 안 고르면 목록 카드에서 아이콘으로 폴백된다.
const EMOJI_PRESET = ["☕", "🍽️", "🍜", "🏃", "🎬", "🎳", "🛍️", "🎤"];

export default function GatheringFormSheet({ onSave, onClose, saving }: {
  onSave: (draft: GatheringDraft) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [at, setAt] = useState(defaultGatheringAt());
  const [place, setPlace] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ title?: string; at?: string }>({});

  const submit = () => {
    const e: typeof errors = {};
    if (!title.trim()) e.title = "제목을 입력해주세요";
    if (!at) e.at = "모이는 시각을 정해주세요";
    if (e.title || e.at) { setErrors(e); return; }

    onSave({
      title: title.trim(),
      gathering_at: localInputToISO(at),
      place_name: place.trim() || null,
      description: description.trim() || null,
      emoji,
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-md rounded-t-3xl px-6 pt-3 flex flex-col gap-4"
        style={{
          background: "rgba(22,25,35,0.99)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 -12px 48px rgba(0,0,0,0.6)",
          paddingBottom: "calc(1.75rem + env(safe-area-inset-bottom))",
        }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-2" style={{ background: "rgba(255,255,255,0.15)" }} />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ color: "#f0f2f8" }}>소모임 만들기</h2>
          <button
            type="button" onClick={onClose} aria-label="닫기"
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", color: "#8892a0" }}
          >
            <X size={16} />
          </button>
        </div>

        <TextField
          label="무엇을 하나요" accent={ACCENT} placeholder="예) 예배 끝나고 카페"
          value={title} error={errors.title} onChange={(e) => setTitle(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold" style={{ color: "#6b7785" }}>아이콘 (선택)</span>
          <div className="flex flex-wrap gap-2">
            {EMOJI_PRESET.map((em) => {
              const active = emoji === em;
              return (
                <button
                  key={em} type="button"
                  onClick={() => setEmoji(active ? null : em)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition"
                  style={{
                    fontSize: 20,
                    background: active ? `${ACCENT}22` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${active ? ACCENT : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  {em}
                </button>
              );
            })}
          </div>
        </div>

        <TextField
          label="언제" type="datetime-local" accent={ACCENT}
          value={at} error={errors.at} onChange={(e) => setAt(e.target.value)}
        />
        <TextField
          label="어디서 (선택)" accent={ACCENT} placeholder="예) 스타벅스 강남점"
          value={place} onChange={(e) => setPlace(e.target.value)}
        />
        <TextArea
          label="한마디 (선택)" rows={2} accent={ACCENT} placeholder="예) 커피 마시면서 얘기해요"
          value={description} onChange={(e) => setDescription(e.target.value)}
        />

        <button
          type="button" onClick={submit} disabled={saving}
          className="w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 mt-1 disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, color: "#0f1117", boxShadow: `0 6px 24px ${ACCENT}44` }}
        >
          <Check size={18} />
          {saving ? "만드는 중..." : "만들기"}
        </button>
      </motion.div>
    </motion.div>
  );
}
