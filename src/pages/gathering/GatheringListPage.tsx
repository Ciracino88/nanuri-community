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
import { TAB_COLORS } from "../../constants/theme";
import type { GatheringDraft, GatheringRecord, ParticipantProfile } from "../../types/gathering";
import GatheringFormSheet from "./GatheringFormSheet";

const ACCENT = TAB_COLORS.gatherings;

const STATUS_META: Record<GatheringStatus, { bg: string; text: string }> = {
  open: { bg: `${ACCENT}26`, text: ACCENT },
  closed: { bg: "rgba(255,255,255,0.07)", text: "#8892a0" },
  done: { bg: "rgba(255,255,255,0.07)", text: "#8892a0" },
};

const MAX_FACES = 5;

function AvatarStack({ profiles }: { profiles: ParticipantProfile[] }) {
  if (profiles.length === 0) {
    return <span className="text-xs font-semibold" style={{ color: "#4a5568" }}>아직 아무도 없어요</span>;
  }

  const shown = profiles.slice(0, MAX_FACES);
  const rest = profiles.length - shown.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {shown.map((p, i) => (
          <div
            key={p.id}
            className="rounded-full overflow-hidden flex items-center justify-center"
            style={{
              width: 26, height: 26,
              marginLeft: i === 0 ? 0 : -8,
              border: "2px solid #0f1117",
              background: "rgba(255,255,255,0.1)",
              zIndex: MAX_FACES - i,
            }}
            title={p.name}
          >
            {p.avatar_url ? (
              <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-black" style={{ color: "#c0c8d4" }}>
                {p.name.slice(0, 1)}
              </span>
            )}
          </div>
        ))}
      </div>
      <span className="text-xs font-bold" style={{ color: "#8892a0" }}>
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
  const meta = STATUS_META[status];
  const dim = status !== "open";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 360, damping: 30 }}
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: dim ? "rgba(255,255,255,0.03)" : `${ACCENT}0f`,
        border: `1px solid ${dim ? "rgba(255,255,255,0.07)" : `${ACCENT}2b`}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 44, height: 44, background: "rgba(0,0,0,0.3)", border: `1px solid ${dim ? "rgba(255,255,255,0.07)" : `${ACCENT}30`}` }}
        >
          {gathering.emoji
            ? <span style={{ fontSize: 22 }}>{gathering.emoji}</span>
            : <Users size={20} color={dim ? "#6b7785" : ACCENT} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-black truncate" style={{ color: dim ? "#8892a0" : "#f0f2f8" }}>
              {gathering.title}
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: meta.bg, color: meta.text }}
            >
              {GATHERING_STATUS_LABEL[status]}
            </span>
          </div>
          <p className="text-xs truncate" style={{ color: dim ? "#4a5568" : "#8892a0" }}>
            {formatGatheringAt(gathering.gathering_at)}
            {gathering.place_name ? ` · ${gathering.place_name}` : ""}
          </p>
        </div>
      </div>

      {gathering.description && (
        <p className="text-xs leading-relaxed" style={{ color: dim ? "#4a5568" : "#8892a0" }}>
          {gathering.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <AvatarStack profiles={profiles} />

        {status === "open" ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            disabled={toggling}
            className="text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shrink-0 disabled:opacity-60"
            style={joined
              ? { background: `${ACCENT}22`, border: `1px solid ${ACCENT}`, color: ACCENT }
              : { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, color: "#0f1117" }}
          >
            {joined && <Check size={14} />}
            {joined ? (isCreator ? "개설자" : "참여 중") : "참여하기"}
          </motion.button>
        ) : (
          <span className="text-xs font-bold shrink-0" style={{ color: "#4a5568" }}>
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
    <div className="flex-1 flex flex-col relative" style={{ background: "#0f1117" }}>
      <div
        className="w-full max-w-md mx-auto px-4 pt-6 flex flex-col gap-6"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black" style={{ color: "#f0f2f8" }}>소모임</h1>
            <p className="text-xs font-semibold mt-0.5" style={{ color: "#4a5568" }}>
              {live.length}개 모집 중 · {past.length}개 지난 모임
            </p>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner color={ACCENT} />
        ) : gatherings.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-2">
            <Users size={32} color="#363d47" />
            <p className="text-sm font-bold" style={{ color: "#4a5568" }}>아직 소모임이 없어요</p>
            <p className="text-xs" style={{ color: "#363d47" }}>먼저 하나 만들어보세요</p>
          </div>
        ) : (
          <>
            {live.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold uppercase" style={{ color: ACCENT, letterSpacing: "0.15em" }}>모집 중</p>
                {live.map(renderCard)}
              </div>
            )}
            {past.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold uppercase" style={{ color: "#4a5568", letterSpacing: "0.15em" }}>지난 모임</p>
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
          className="pointer-events-auto rounded-2xl flex items-center justify-center gap-1.5 px-5 py-3.5"
          style={{
            transform: "translateY(-100%)",
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`,
            color: "#0f1117",
            boxShadow: `0 8px 28px ${ACCENT}55, 0 2px 8px rgba(0,0,0,0.4)`,
          }}
        >
          <Plus size={18} strokeWidth={3} />
          <span className="text-sm font-black">만들기</span>
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
