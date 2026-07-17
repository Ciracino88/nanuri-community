import { useState } from "react";
import { Check } from "lucide-react";
import TextField from "../../components/ui/TextField";
import TextArea from "../../components/ui/TextArea";
import Button from "../../components/ui/Button";
import BottomSheet from "../../components/ui/BottomSheet";
import { defaultGatheringAt, localInputToISO } from "../../lib/gatheringTime";
import type { GatheringDraft } from "../../types/gathering";

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
    <BottomSheet title="소모임 만들기" onClose={onClose}>
      <TextField
        label="무엇을 하나요" placeholder="예) 예배 끝나고 카페"
        value={title} error={errors.title} onChange={(e) => setTitle(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-label2 font-medium text-label-normal">아이콘 (선택)</span>
        <div className="flex flex-wrap gap-2">
          {EMOJI_PRESET.map((em) => {
            const active = emoji === em;
            return (
              <button
                key={em} type="button"
                onClick={() => setEmoji(active ? null : em)}
                // 선택 상태는 상호작용이라 Primary 가 담당한다.
                className={`w-10 h-10 rounded-field flex items-center justify-center active:scale-95 transition border ${
                  active ? "bg-status-bg-active border-primary-normal" : "bg-bg-normal border-line-solid"
                }`}
                style={{ fontSize: 20 }}
              >
                {em}
              </button>
            );
          })}
        </div>
      </div>

      <TextField
        label="언제" type="datetime-local"
        value={at} error={errors.at} onChange={(e) => setAt(e.target.value)}
      />
      <TextField
        label="어디서 (선택)" placeholder="예) 스타벅스 강남점"
        value={place} onChange={(e) => setPlace(e.target.value)}
      />
      <TextArea
        label="한마디 (선택)" rows={2} placeholder="예) 커피 마시면서 얘기해요"
        value={description} onChange={(e) => setDescription(e.target.value)}
      />

      <Button type="button" onClick={submit} loading={saving} loadingText="만드는 중..." className="mt-1">
        <span className="flex items-center justify-center gap-2">
          <Check size={18} />
          만들기
        </span>
      </Button>
    </BottomSheet>
  );
}
