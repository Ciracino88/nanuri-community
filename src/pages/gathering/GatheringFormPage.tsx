import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { Check, ImagePlus, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "../../components/BackButton";
import TextField from "../../components/ui/TextField";
import TextArea from "../../components/ui/TextArea";
import Button from "../../components/ui/Button";
import { useAuthStore } from "../../store/authStore";
import { useCreateGathering, useGatherings, type GatheringData } from "../../hooks/useGatherings";
import { useReceiptUpload } from "../../hooks/useReceiptUpload";
import { uploadReceipt } from "../../lib/uploadReceipt";
import { defaultGatheringAt, localInputToISO } from "../../lib/gatheringTime";
import { PAGE_BOTTOM_PAD } from "../../constants/layout";
import type { GatheringKind } from "../../types/gathering";
import CategoryFormSheet from "./CategoryFormSheet";

// 한 화면에 다 넣으면 고를 게 너무 많아 복잡했다. 세 걸음으로 쪼갠다.
//   1. 성격 — 아래 두 걸음의 모양을 바꾸므로 먼저 묻는다(챌린지면 3단계에서 일시가 사라진다)
//   2. 무엇을 — 제목·카테고리
//   3. 자세히 — 일시·장소·설명·사진. 전부 선택이라 마지막이다
const STEPS = ["성격", "무엇을", "자세히"] as const;

// 아이콘은 3D 렌더 PNG(투명 배경) 다. public/icons-3d/ 에 있고 코드에선 public 을 뺀 절대경로로 부른다.
//   원데이=달력(정한 하루), 챌린지=나침반(끝을 안 정하고 계속 나아가는 여정)
const KIND_OPTIONS: {
  key: GatheringKind;
  label: string;
  hint: string;
  detail: string;
  img: string;
}[] = [
  {
    key: "oneday",
    label: "원데이",
    hint: "한 번 모이고 끝나요",
    detail: "예배 끝나고 카페, 점심 같이 먹기처럼 날짜와 시각을 정해 한 번 모이는 모임이에요. 그 시각이 지나면 자동으로 끝납니다.",
    img: "/icons-3d/gathering-oneday.png",
  },
  {
    key: "challenge",
    label: "챌린지",
    hint: "기한 없이 계속해요",
    detail: "성경 통독반, 저녁 마라톤처럼 계속 이어가는 모임이에요. 끝나는 날을 정하지 않고, 리더가 종료할 때까지 계속됩니다.",
    img: "/icons-3d/gathering-challenge.png",
  },
];

export default function GatheringFormPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data } = useGatherings();
  const createGathering = useCreateGathering();

  const [step, setStep] = useState(0);
  // 기본값을 두지 않는다 — 기본이 있으면 1단계가 그냥 지나치는 화면이 되는데,
  // 이 선택이 아래 두 걸음의 모양을 바꾸므로 의식적으로 고르게 해야 한다.
  const [kind, setKind] = useState<GatheringKind | null>(null);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [at, setAt] = useState(defaultGatheringAt());
  const [place, setPlace] = useState("");
  const [description, setDescription] = useState("");
  const [catSheetOpen, setCatSheetOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; at?: string }>({});

  const { receiptFile: thumbFile, receiptPreview: thumbPreview, handleReceiptChange, reset: resetThumb } =
    useReceiptUpload();

  const empty: GatheringData = { gatherings: [], participants: [], profiles: [], categories: [] };
  const { categories } = data ?? empty;

  const isChallenge = kind === "challenge";

  const goBack = () => {
    if (step === 0) navigate("/gatherings");
    else setStep((s) => s - 1);
  };

  const next = () => {
    if (step === 1) {
      if (!title.trim()) { setErrors({ title: "제목을 입력해주세요" }); return; }
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const submit = async () => {
    if (!user || !kind) return;
    // 챌린지는 모이는 시각이 없다 — DB check 제약이 null 을 강제한다.
    if (!isChallenge && !at) { setErrors({ at: "모이는 시각을 정해주세요" }); return; }

    let thumbnail_url: string | null = null;
    if (thumbFile) {
      setUploading(true);
      try {
        thumbnail_url = await uploadReceipt(thumbFile, "gatherings");
      } catch (err) {
        console.error("[uploadGatheringThumb] error:", err);
        toast.error("사진을 올리지 못했어요");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    try {
      const created = await createGathering.mutateAsync({
        draft: {
          kind,
          title: title.trim(),
          gathering_at: isChallenge ? null : localInputToISO(at),
          place_name: place.trim() || null,
          description: description.trim() || null,
          category_id: categoryId,
          thumbnail_url,
        },
        userId: user.id,
      });
      toast.success("소모임을 만들었어요");
      navigate(`/gatherings/${created.id}`, { replace: true });
    } catch (err) {
      console.error("[createGathering] error:", err);
      toast.error("잠시 후 다시 시도해주세요");
    }
  };

  const canAdvance = step === 0 ? kind !== null : true;
  const busy = createGathering.isPending || uploading;

  return (
    <div className="flex-1 flex flex-col relative">
      <div
        className="w-full max-w-md mx-auto px-4 pt-4 flex flex-col gap-5"
        style={{ paddingBottom: PAGE_BOTTOM_PAD }}
      >
        <div className="flex items-center gap-3">
          <BackButton onClick={goBack} />
          <div className="flex-1 flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition ${
                  i <= step ? "bg-primary-normal" : "bg-fill-strong"
                }`}
              />
            ))}
          </div>
          <span className="text-label2 font-medium text-label-neutral shrink-0">
            {step + 1}/{STEPS.length}
          </span>
        </div>

        {/* 1. 성격 */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-title3 font-bold text-label-normal">어떤 모임인가요?</h1>
              <p className="text-label1 text-label-neutral mt-1">
                한 번 모이는지, 계속 이어가는지에 따라 다음 단계가 달라져요.
              </p>
            </div>

            {/* 레퍼런스 배치: 꽉 찬 컬러 카드 — 왼쪽 헤드라인·서브텍스트, 오른쪽 큰 3D 아이콘.
                긴 detail 은 이 히어로 배치에 안 맞아 카드 밖(선택 시 안내)으로 뺀다. */}
            <div className="flex flex-col gap-3">
              {KIND_OPTIONS.map((o) => {
                const active = kind === o.key;
                return (
                  <button
                    key={o.key} type="button"
                    onClick={() => setKind(o.key)}
                    className={`w-full text-left rounded-sheet px-5 py-6 flex items-center gap-3 transition active:scale-[0.99] ${
                      active ? "bg-primary-normal shadow-small" : "bg-bg-normal shadow-small"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-title3 font-bold ${active ? "text-static-white" : "text-label-normal"}`}>
                        {o.label}
                      </p>
                      <p className={`text-body1 font-medium mt-1 ${active ? "text-static-white/90" : "text-label-neutral"}`}>
                        {o.hint}
                      </p>
                    </div>
                    {/* 3D 아이콘은 자체 색을 가진 이미지라 상태에 따라 색을 바꾸지 않는다 — 선택은 카드 채움색으로 표시한다 */}
                    <img
                      src={o.img}
                      alt=""
                      aria-hidden
                      className="w-28 h-28 shrink-0 object-contain drop-shadow-md"
                    />
                  </button>
                );
              })}
            </div>

            {/* 고른 성격의 자세한 설명 — 카드 아래에서 바뀐다 */}
            {kind && (
              <p className="text-label1 text-label-neutral px-1">
                {KIND_OPTIONS.find((o) => o.key === kind)?.detail}
              </p>
            )}
          </div>
        )}

        {/* 2. 무엇을 */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-title3 font-bold text-label-normal">무엇을 하나요?</h1>
              <p className="text-label1 text-label-neutral mt-1">
                {isChallenge ? "무엇을 계속 이어갈지 알려주세요." : "무엇을 하러 모이는지 알려주세요."}
              </p>
            </div>

            <TextField
              label="제목" placeholder={isChallenge ? "예) 성경 통독반" : "예) 예배 끝나고 카페"}
              value={title} error={errors.title}
              onChange={(e) => { setTitle(e.target.value); setErrors({}); }}
            />

            <div className="flex flex-col gap-1.5">
              <span className="text-label2 font-medium text-label-normal">카테고리 (선택)</span>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const active = categoryId === c.id;
                  return (
                    <button
                      key={c.id} type="button"
                      onClick={() => setCategoryId(active ? null : c.id)}
                      className={`text-label2 font-medium px-3 py-1.5 rounded-full transition active:scale-95 border ${
                        active
                          ? "bg-status-bg-active border-primary-normal text-primary-normal"
                          : "bg-bg-normal border-line-solid text-label-neutral"
                      }`}
                    >
                      {c.emoji} {c.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setCatSheetOpen(true)}
                  className="text-label2 font-medium px-3 py-1.5 rounded-full border border-dashed border-line-solid text-label-neutral flex items-center gap-1 active:scale-95 transition"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  추가
                </button>
              </div>
              <p className="text-caption1 text-label-neutral mt-0.5">
                카테고리 이모지가 사진 없는 카드의 아이콘이 돼요.
              </p>
            </div>
          </div>
        )}

        {/* 3. 자세히 */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-title3 font-bold text-label-normal">조금만 더 알려주세요</h1>
              <p className="text-label1 text-label-neutral mt-1">전부 선택이에요. 나중에 고칠 수 있어요.</p>
            </div>

            {/* 챌린지는 모이는 시각이 없다. 필드를 그냥 빼면 "왜 날짜를 못 넣지?"가 되므로
                왜 없는지 대신 말해준다. */}
            {isChallenge ? (
              <div className="rounded-field bg-bg-alternative px-3.5 py-3">
                <p className="text-label2 font-medium text-label-normal">언제 — 무기한</p>
                <p className="text-caption1 text-label-neutral mt-0.5">
                  챌린지는 끝나는 날을 정하지 않아요. 리더가 종료할 때까지 계속됩니다.
                </p>
              </div>
            ) : (
              <TextField
                label="언제" type="datetime-local"
                value={at} error={errors.at}
                onChange={(e) => { setAt(e.target.value); setErrors({}); }}
              />
            )}

            <div className="flex flex-col gap-1.5">
              <TextField
                label="어디서 (선택)"
                placeholder={isChallenge ? "예) 본당 소예배실" : "예) 스타벅스 강남점"}
                value={place} onChange={(e) => setPlace(e.target.value)}
              />
              {isChallenge && (
                <p className="text-caption1 text-label-neutral">
                  장소는 참여한 사람 누구나 나중에 고칠 수 있어요.
                </p>
              )}
            </div>

            <TextArea
              label="한마디 (선택)" rows={3}
              placeholder={isChallenge ? "예) 창세기부터 같이 읽어요" : "예) 커피 마시면서 얘기해요"}
              value={description} onChange={(e) => setDescription(e.target.value)}
            />

            <div className="flex flex-col gap-1.5">
              <span className="text-label2 font-medium text-label-normal">사진 (선택)</span>
              {thumbPreview ? (
                <div className="relative w-24 h-24">
                  <img src={thumbPreview} alt="" className="w-24 h-24 rounded-field object-cover" />
                  <button
                    type="button" onClick={resetThumb} aria-label="사진 지우기"
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-label-normal text-static-white active:scale-90 transition"
                  >
                    <X size={13} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <label className="w-24 h-24 rounded-field border border-dashed border-line-solid bg-bg-normal flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition">
                  <ImagePlus size={20} className="text-label-assistive" />
                  <span className="text-caption1 text-label-neutral">사진 추가</span>
                  <input
                    type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReceiptChange(f); }}
                  />
                </label>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 하단 고정 버튼. 목록의 플로팅 버튼과 같은 이유로 sticky + mt-auto 다 —
          스크롤 컨테이너가 Layout 의 main 이라 fixed 면 데스크톱에서 앱 프레임 밖으로 튄다. */}
      <div className="sticky mt-auto z-40 px-4 pointer-events-none" style={{ bottom: "1.5rem" }}>
        <div className="w-full max-w-md mx-auto pointer-events-auto">
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next} disabled={!canAdvance}>
              다음
            </Button>
          ) : (
            <Button
              type="button" onClick={submit}
              loading={busy}
              loadingText={uploading ? "사진 올리는 중..." : "만드는 중..."}
            >
              <span className="flex items-center justify-center gap-2">
                <Check size={18} />
                만들기
              </span>
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {catSheetOpen && (
          <CategoryFormSheet
            existing={categories}
            onClose={() => setCatSheetOpen(false)}
            onCreated={(c) => { setCategoryId(c.id); setCatSheetOpen(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
