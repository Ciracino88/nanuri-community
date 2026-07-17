import { useState } from "react";
import { Check } from "lucide-react";
import toast from "react-hot-toast";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";
import BottomSheet from "../../components/ui/BottomSheet";
import { useCreateCategory } from "../../hooks/useGatherings";
import { useAuthStore } from "../../store/authStore";
import type { GatheringCategory } from "../../types/gathering";

// 소모임 아이콘 고르기가 없어지면서 이모지 피커가 여기로 왔다 — 새 카테고리에는 이모지가 필요하다.
// 카드의 시각 식별자는 이제 카테고리가 책임진다(썸네일 → 카테고리 이모지 → 기본 아이콘).
const EMOJI_PRESET = [
  "☕️", "🍽️", "🍜", "🍰", "🏃", "⚽️", "🧗", "🚴",
  "📖", "✍️", "🎬", "🎤", "🎨", "🎳", "🚗", "🏕️",
  "🤝", "🌱", "🐾", "🎲",
];

export default function CategoryFormSheet({ existing, onCreated, onClose }: {
  existing: GatheringCategory[];
  onCreated: (category: GatheringCategory) => void;
  onClose: () => void;
}) {
  const { user } = useAuthStore();
  const createCategory = useCreateCategory();
  const [emoji, setEmoji] = useState(EMOJI_PRESET[0]);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | undefined>();

  const submit = async () => {
    const name = label.trim();
    if (!name) { setError("이름을 입력해주세요"); return; }

    // DB 의 unique 제약이 최종 방어선이지만, 여기서 먼저 잡아야 사용자가 왜 실패했는지 안다.
    // 대소문자·공백 차이로 "카페"와 "카페 "가 따로 생기는 것도 여기서 막는다.
    if (existing.some((c) => c.label.trim().toLowerCase() === name.toLowerCase())) {
      setError("이미 있는 카테고리예요");
      return;
    }
    if (!user) return;

    try {
      const created = await createCategory.mutateAsync({ emoji, label: name, userId: user.id });
      onCreated(created);
      toast.success(`${emoji} ${name} 카테고리를 만들었어요`);
    } catch (err) {
      console.error("[createCategory] error:", err);
      toast.error("카테고리를 만들지 못했어요");
    }
  };

  return (
    <BottomSheet title="카테고리 만들기" onClose={onClose}>
      <div className="flex flex-col gap-1.5">
        <span className="text-label2 font-medium text-label-normal">이모지</span>
        <div className="flex flex-wrap gap-2">
          {EMOJI_PRESET.map((em) => {
            const active = emoji === em;
            return (
              <button
                key={em} type="button"
                onClick={() => setEmoji(em)}
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
        label="이름" placeholder="예) 등산"
        value={label} error={error}
        onChange={(e) => { setLabel(e.target.value); setError(undefined); }}
      />

      <div className="rounded-field bg-bg-alternative px-3.5 py-3">
        <p className="text-caption1 text-label-neutral">
          만든 카테고리는 모두가 같이 씁니다. 한번 만들면 지울 수 없어요 —
          이미 있는지 먼저 확인해주세요.
        </p>
      </div>

      <Button
        type="button" onClick={submit}
        loading={createCategory.isPending} loadingText="만드는 중..."
        disabled={!label.trim()}
      >
        <span className="flex items-center justify-center gap-2">
          <Check size={18} />
          만들기
        </span>
      </Button>
    </BottomSheet>
  );
}
