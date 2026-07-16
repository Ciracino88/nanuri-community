import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Plus, Users } from "lucide-react";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuthStore } from "../../store/authStore";
import { useCreateGathering, useGatherings, type GatheringData } from "../../hooks/useGatherings";
import { useToggleGatheringJoin } from "../../hooks/useToggleGatheringJoin";
import {
  computeGatheringStatus,
  formatGatheringAt,
  GATHERING_STATUS_LABEL,
  type GatheringStatus,
} from "../../lib/gatheringTime";
import type { GatheringDraft, GatheringRecord, ParticipantProfile } from "../../types/gathering";
import GatheringFormSheet from "./GatheringFormSheet";

// 상태 배지는 식별용이라 액센트를 쓰지 않는다. 모집 중 = 소모임 카테고리 틴트(앰버).
const STATUS_BADGE: Record<GatheringStatus, string> = {
  open: "bg-amber-subtle text-amber-strong",
  closed: "bg-sunken text-fg-muted",
  done: "bg-sunken text-fg-muted",
};

const MAX_FACES = 5;

function AvatarStack({ profiles }: { profiles: ParticipantProfile[] }) {
  if (profiles.length === 0) {
    return <span className="text-caption font-semibold text-fg-muted">아직 아무도 없어요</span>;
  }

  const shown = profiles.slice(0, MAX_FACES);
  const rest = profiles.length - shown.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {shown.map((p, i) => (
          <div
            key={p.id}
            // 얼굴이 겹쳐도 서로 분리돼 보이도록 카드 색 테두리를 두른다.
            className="rounded-full overflow-hidden flex items-center justify-center bg-sunken border-2 border-card"
            style={{
              width: 26, height: 26,
              marginLeft: i === 0 ? 0 : -8,
              zIndex: MAX_FACES - i,
            }}
            title={p.name}
          >
            {p.avatar_url ? (
              <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-fg-muted">{p.name.slice(0, 1)}</span>
            )}
          </div>
        ))}
      </div>
      <span className="text-caption font-semibold text-fg-muted">
        {rest > 0 ? `+${rest} · ` : ""}{profiles.length}명
      </span>
    </div>
  );
}

function GatheringCard({ gathering, profiles, joined, isCreator, toggling, index, onToggle }: {
  gathering: GatheringRecord;
  profiles: ParticipantProfile[];
  joined: boolean;
  isCreator: boolean;
  toggling: boolean;
  index: number;
  onToggle: () => void;
}) {
  const status = computeGatheringStatus(gathering);
  const dim = status !== "open";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 360, damping: 30 }}
      className="rounded-card bg-card shadow-card p-4 flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-tile flex items-center justify-center shrink-0 ${
            dim ? "bg-sunken text-fg-faint" : "bg-amber-subtle text-amber"
          }`}
        >
          {gathering.emoji
            ? <span style={{ fontSize: 22 }}>{gathering.emoji}</span>
            : <Users size={20} strokeWidth={2.25} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-body font-semibold truncate ${dim ? "text-fg-muted" : "text-fg-strong"}`}>
              {gathering.title}
            </span>
            <span className={`text-caption font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[status]}`}>
              {GATHERING_STATUS_LABEL[status]}
            </span>
          </div>
          <p className="text-caption text-fg-muted truncate">
            {formatGatheringAt(gathering.gathering_at)}
            {gathering.place_name ? ` · ${gathering.place_name}` : ""}
          </p>
        </div>
      </div>

      {gathering.description && (
        <p className="text-caption leading-relaxed text-fg-muted">{gathering.description}</p>
      )}

      <div className="flex items-center justify-between gap-3">
        <AvatarStack profiles={profiles} />

        {status === "open" ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            disabled={toggling}
            // 참여 = 선택 상태라 액센트 담당. 참여 중이면 채우지 않고 틴트로 낮춘다.
            className={`text-caption font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shrink-0 transition disabled:opacity-60 ${
              joined
                ? "bg-accent-subtle border border-accent-soft text-accent-strong"
                : "bg-accent text-white shadow-accent"
            }`}
          >
            {joined && <Check size={14} />}
            {joined ? (isCreator ? "개설자" : "참여 중") : "참여하기"}
          </motion.button>
        ) : (
          <span className="text-caption font-semibold shrink-0 text-fg-muted">
            {joined ? "참여했어요" : ""}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function GatheringListPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useGatherings();
  const [sheetOpen, setSheetOpen] = useState(false);

  const empty: GatheringData = { gatherings: [], participants: [], profiles: [] };
  const { gatherings, participants, profiles } = data ?? empty;

  const { toggle, togglingId } = useToggleGatheringJoin(participants);
  const createGathering = useCreateGathering();

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const participantsOf = (gatheringId: string) =>
    participants
      .filter((p) => p.gathering_id === gatheringId)
      .map((p) => profileById.get(p.user_id))
      .filter((p): p is ParticipantProfile => !!p);

  const live = gatherings.filter((g) => computeGatheringStatus(g) !== "done");
  const past = gatherings.filter((g) => computeGatheringStatus(g) === "done");

  const handleCreate = async (draft: GatheringDraft) => {
    if (!user) return;
    try {
      await createGathering.mutateAsync({ draft, userId: user.id });
      setSheetOpen(false);
      toast.success("소모임을 만들었어요");
    } catch (err) {
      console.error("[createGathering] error:", err);
      toast.error("잠시 후 다시 시도해주세요");
    }
  };

  const renderCard = (g: GatheringRecord, i: number) => (
    <GatheringCard
      key={g.id}
      gathering={g}
      profiles={participantsOf(g.id)}
      joined={participants.some((p) => p.gathering_id === g.id && p.user_id === user?.id)}
      isCreator={g.created_by === user?.id}
      toggling={togglingId === g.id}
      index={i}
      onToggle={() => toggle(g.id)}
    />
  );

  return (
    <div className="flex-1 flex flex-col relative">
      <div
        className="w-full max-w-md mx-auto px-4 pt-6 flex flex-col gap-6"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-heading font-bold text-fg-strong">소모임</h1>
            <p className="text-caption font-semibold mt-0.5 text-fg-muted">
              {live.length}개 모집 중 · {past.length}개 지난 모임
            </p>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : gatherings.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-2">
            <Users size={32} className="text-fg-faint" />
            <p className="text-body font-semibold text-fg-muted">아직 소모임이 없어요</p>
            <p className="text-caption text-fg-muted">먼저 하나 만들어보세요</p>
          </div>
        ) : (
          <>
            {live.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-caption font-semibold uppercase text-fg-muted" style={{ letterSpacing: "0.15em" }}>모집 중</p>
                {live.map(renderCard)}
              </div>
            )}
            {past.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-caption font-semibold uppercase text-fg-muted" style={{ letterSpacing: "0.15em" }}>지난 모임</p>
                {past.map(renderCard)}
              </div>
            )}
          </>
        )}
      </div>

      {/* 플로팅 만들기 버튼.
          sticky + height:0 인 이유: 스크롤 컨테이너는 Layout 의 main 이고 셸이 max-w-md 다.
          fixed 로 두면 데스크톱에서 앱 프레임 밖(뷰포트 오른쪽 끝)으로 튀고,
          absolute 로 두면 목록이 길어질 때 같이 스크롤돼 사라진다. */}
      {/* mt-auto: 목록이 짧을 때도(빈 상태) 버튼이 위로 딸려 올라오지 않고 아래에 붙는다. */}
      <div
        className="sticky z-50 mt-auto flex justify-end px-5 pointer-events-none"
        style={{ bottom: "1.5rem", height: 0 }}
      >
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setSheetOpen(true)}
          aria-label="소모임 만들기"
          className="pointer-events-auto rounded-full flex items-center justify-center gap-1.5 px-5 py-3.5 bg-accent text-white shadow-accent"
          style={{ transform: "translateY(-100%)" }}
        >
          <Plus size={18} strokeWidth={3} />
          <span className="text-body font-semibold">만들기</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {sheetOpen && (
          <GatheringFormSheet
            onSave={handleCreate}
            onClose={() => setSheetOpen(false)}
            saving={createGathering.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
