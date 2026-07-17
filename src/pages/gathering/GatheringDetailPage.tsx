import { useState } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, Heart, MapPin, Pencil, Users } from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "../../components/BackButton";
import LoadingSpinner from "../../components/LoadingSpinner";
import Button from "../../components/ui/Button";
import TextArea from "../../components/ui/TextArea";
import TextField from "../../components/ui/TextField";
import { useAuthStore } from "../../store/authStore";
import { useGatherings, type GatheringData } from "../../hooks/useGatherings";
import { useToggleGatheringJoin } from "../../hooks/useToggleGatheringJoin";
import { useUpdateGatheringPlace } from "../../hooks/useGatheringRpc";
import {
  useCreateReview,
  useDeleteReview,
  useGatheringReviews,
  useToggleReviewLike,
  useUpdateReview,
} from "../../hooks/useGatheringReviews";
import { PAGE_BOTTOM_PAD } from "../../constants/layout";
import {
  computeGatheringStatus,
  formatGatheringWhen,
  GATHERING_STATUS_LABEL,
} from "../../lib/gatheringTime";
import type { ParticipantProfile } from "../../types/gathering";

function relativeDay(iso: string, now = new Date()) {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86400_000);
  if (days <= 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function Avatar({ profile, size = 40 }: { profile: ParticipantProfile; size?: number }) {
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center bg-bg-alternative shrink-0"
      style={{ width: size, height: size }}
    >
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-label2 font-bold text-label-neutral">{profile.name.slice(0, 1)}</span>
      )}
    </div>
  );
}

export default function GatheringDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuthStore();
  const { data, isLoading } = useGatherings();
  const { data: reviewData } = useGatheringReviews(id);

  const [editingPlace, setEditingPlace] = useState(false);
  const [placeDraft, setPlaceDraft] = useState("");
  const [reviewDraft, setReviewDraft] = useState("");
  // 편집 중인 후기 id 와 그 초안. null 이면 편집 중이 아니다.
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewEditDraft, setReviewEditDraft] = useState("");

  const empty: GatheringData = { gatherings: [], participants: [], profiles: [], categories: [] };
  const { gatherings, participants, profiles, categories } = data ?? empty;

  const { toggle, togglingId } = useToggleGatheringJoin(participants);
  const updatePlace = useUpdateGatheringPlace();
  const createReview = useCreateReview(id);
  const updateReview = useUpdateReview(id);
  const deleteReview = useDeleteReview(id);
  const toggleLike = useToggleReviewLike(id);

  const gathering = gatherings.find((g) => g.id === id);

  if (isLoading) return <LoadingSpinner />;
  if (!gathering) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4">
        <Users size={32} className="text-label-assistive" />
        <p className="text-body1 font-semibold text-label-neutral">없는 소모임이에요</p>
        <BackButton />
      </div>
    );
  }

  const status = computeGatheringStatus(gathering);
  const category = gathering.category_id
    ? categories.find((c) => c.id === gathering.category_id) ?? null
    : null;
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const members = participants
    .filter((p) => p.gathering_id === id)
    .map((p) => profileById.get(p.user_id))
    .filter((p): p is ParticipantProfile => !!p);

  const joined = participants.some((p) => p.gathering_id === id && p.user_id === user?.id);
  const isLeader = gathering.leader_id === user?.id;
  const leader = gathering.leader_id ? profileById.get(gathering.leader_id) : null;
  const placeEditor = gathering.place_updated_by ? profileById.get(gathering.place_updated_by) : null;

  const reviews = reviewData?.reviews ?? [];
  const reviewProfiles = new Map((reviewData?.profiles ?? []).map((p) => [p.id, p]));
  // 후기별 좋아요를 미리 묶는다 — 카드마다 카운트와 "내가 눌렀나"를 O(1) 로 읽는다.
  const likesByReview = new Map<string, string[]>();
  for (const l of reviewData?.likes ?? []) {
    const arr = likesByReview.get(l.review_id);
    if (arr) arr.push(l.user_id);
    else likesByReview.set(l.review_id, [l.user_id]);
  }

  const savePlace = async () => {
    try {
      await updatePlace.mutateAsync({ gatheringId: id, place: placeDraft.trim() });
      setEditingPlace(false);
      toast.success("장소를 바꿨어요");
    } catch (err) {
      console.error("[updateGatheringPlace] error:", err);
      toast.error("장소를 바꾸지 못했어요");
    }
  };

  const submitReview = async () => {
    if (!user || !reviewDraft.trim()) return;
    try {
      await createReview.mutateAsync({ content: reviewDraft.trim(), userId: user.id });
      setReviewDraft("");
      toast.success("후기를 남겼어요");
    } catch (err) {
      console.error("[createReview] error:", err);
      toast.error("후기를 남기지 못했어요");
    }
  };

  const removeReview = async (reviewId: string) => {
    try {
      await deleteReview.mutateAsync(reviewId);
    } catch (err) {
      console.error("[deleteReview] error:", err);
      toast.error("후기를 지우지 못했어요");
    }
  };

  const startEditReview = (reviewId: string, content: string) => {
    setEditingReviewId(reviewId);
    setReviewEditDraft(content);
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setReviewEditDraft("");
  };

  const saveReview = async (reviewId: string) => {
    const content = reviewEditDraft.trim();
    if (!content) return;
    try {
      await updateReview.mutateAsync({ id: reviewId, content });
      cancelEditReview();
      toast.success("후기를 고쳤어요");
    } catch (err) {
      console.error("[updateReview] error:", err);
      toast.error("후기를 고치지 못했어요");
    }
  };

  const likeReview = (reviewId: string, liked: boolean) => {
    if (!user) return;
    // 낙관적 반영이라 await 하지 않는다 — 실패는 훅이 스냅샷으로 되돌린다.
    toggleLike.mutate({ reviewId, userId: user.id, liked });
  };

  return (
    <div
      className="w-full max-w-md mx-auto px-4 pt-4 flex flex-col gap-5"
      style={{ paddingBottom: PAGE_BOTTOM_PAD }}
    >
      <BackButton to="/gatherings" />

      {/* 썸네일(프레임 전체 너비·정사각형) + 성격 배지. 상세는 항목이 하나라 원데이에도 배지를
          단다 — 목록과 달리 노이즈가 되지 않고, 여기서는 "이 모임이 어떻게 끝나는가"가 정보다.
          -mx-4 로 좌우 패딩을 넘어 프레임 끝까지 채우고, 배지는 썸네일 안쪽 우하단에 앉힌다. */}
      <div className="relative -mx-4 aspect-square">
        {gathering.thumbnail_url ? (
          <img src={gathering.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          // 썸네일 → 카테고리 이모지 → 기본 아이콘. 소모임 자체의 이모지는 없앴다.
          <div className="w-full h-full bg-status-bg-active text-primary-normal flex items-center justify-center">
            {/* 사진이 없을 때 뜨는 폴백 아이콘 — 통통 튀며 등장한 뒤 은은하게 떠 있게 한다 */}
            <motion.div
              className="flex items-center justify-center"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
              transition={{
                scale: { type: "spring", stiffness: 260, damping: 16 },
                opacity: { duration: 0.3 },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              {category
                ? <span style={{ fontSize: 96 }}>{category.emoji}</span>
                : <Users size={72} strokeWidth={2} />}
            </motion.div>
          </div>
        )}
        <span className="absolute bottom-3 right-3 text-caption1 font-semibold px-2.5 py-1 rounded-full bg-label-normal text-static-white">
          {gathering.kind === "challenge" ? "챌린지" : "원데이"}
        </span>
      </div>

      {/* 카테고리 칩 행 */}
      <div className="flex items-center gap-2 flex-wrap">
        {category && (
          <span className="text-label2 font-medium px-3 py-1.5 rounded-full bg-bg-normal shadow-xsmall text-label-neutral">
            {category.emoji} {category.label}
          </span>
        )}
        {status !== "open" && (
          <span className="text-label2 font-medium px-3 py-1.5 rounded-full bg-status-bg-idle text-label-neutral">
            {GATHERING_STATUS_LABEL[status]}
          </span>
        )}
      </div>

      <div>
        <h1 className="text-title3 font-bold text-label-normal">{gathering.title}</h1>
        {leader && (
          <p className="text-label2 text-label-neutral mt-1">{leader.name}님이 이끌어요</p>
        )}
      </div>

      {/* 장소 · 일시 */}
      <div className="rounded-card bg-bg-normal shadow-small p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-label2 font-medium text-label-neutral">언제</span>
          <span className="text-label1 font-semibold text-label-normal">
            {formatGatheringWhen(gathering)}
          </span>
        </div>

        <div className="h-px bg-line-solid" />

        {editingPlace ? (
          <div className="flex flex-col gap-2">
            <TextField
              label="어디서" placeholder="예) 한강공원 잠수교"
              value={placeDraft} onChange={(e) => setPlaceDraft(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="button" onClick={savePlace} loading={updatePlace.isPending} loadingText="바꾸는 중...">
                저장
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditingPlace(false)}>
                취소
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="text-label2 font-medium text-label-neutral">어디서</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-label1 font-semibold text-label-normal truncate">
                {gathering.place_name ?? "아직 안 정했어요"}
              </span>
              {/* 참가자 누구나 고칠 수 있다. 챌린지는 장소가 회차마다 바뀐다. */}
              {joined && (
                <button
                  type="button"
                  onClick={() => { setPlaceDraft(gathering.place_name ?? ""); setEditingPlace(true); }}
                  aria-label="장소 바꾸기"
                  className="w-7 h-7 rounded-full bg-bg-alternative text-label-neutral flex items-center justify-center shrink-0 active:scale-90 transition"
                >
                  <Pencil size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 덮어쓰기라 마지막에 쓴 사람이 이긴다. 책임 소재를 남기는 게 이 줄의 목적이다. */}
        {placeEditor && gathering.place_updated_at && !editingPlace && (
          <p className="text-caption1 text-label-neutral flex items-center gap-1">
            <MapPin size={11} />
            {placeEditor.name}님이 {relativeDay(gathering.place_updated_at)} 수정
          </p>
        )}
      </div>

      {/* 참여하는 사람들 */}
      <div className="flex flex-col gap-3">
        <p className="text-caption1 font-semibold text-label-neutral">
          참여하는 사람 {members.length}명
        </p>
        {members.length === 0 ? (
          <p className="text-label1 text-label-neutral">아직 아무도 없어요</p>
        ) : (
          <div className="flex items-start gap-3 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* 참여자가 늘거나 빠질 때 팝인/팝아웃, 남은 아바타는 layout 으로 자연스럽게 밀린다 */}
            <AnimatePresence initial={false}>
              {members.map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="flex flex-col items-center gap-1 w-12 shrink-0"
                >
                  <Avatar profile={m} />
                  <span className="text-caption1 text-label-neutral truncate w-full text-center">
                    {m.name}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 참여 버튼 */}
      {status === "open" ? (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => toggle(id)}
          disabled={togglingId === id}
          className={`w-full rounded-field py-3.5 text-body2 font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60 ${
            joined ? "bg-status-bg-active text-primary-normal" : "bg-primary-normal text-static-white"
          }`}
        >
          {joined && <Check size={17} strokeWidth={3} />}
          {joined ? (isLeader ? "내가 이끄는 모임" : "참여 중") : "참여하기"}
        </motion.button>
      ) : (
        <div className="w-full rounded-field py-3.5 bg-bg-alternative text-label-neutral text-body2 font-semibold text-center">
          끝난 모임이에요
        </div>
      )}

      {/* 참여 영역과 아래 내용을 가르는 구분선 */}
      <div className="h-px bg-line-solid" />

      {/* 세부 내용 + 끝 구분선 */}
      {gathering.description && (
        <>
          <p className="text-body1-reading text-label-normal whitespace-pre-wrap">
            {gathering.description}
          </p>
          <div className="h-px bg-line-solid" />
        </>
      )}

      {/* 후기 */}
      <div className="flex flex-col gap-3">
        <p className="text-caption1 font-semibold text-label-neutral">후기 {reviews.length}개</p>

        {joined && (
          <div className="flex flex-col gap-2">
            <TextArea
              label="" rows={2} placeholder="어땠는지 남겨주세요"
              value={reviewDraft} onChange={(e) => setReviewDraft(e.target.value)}
            />
            <Button
              type="button" onClick={submitReview}
              loading={createReview.isPending} loadingText="남기는 중..."
              disabled={!reviewDraft.trim()}
            >
              후기 남기기
            </Button>
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-label1 text-label-neutral">아직 후기가 없어요</p>
        ) : (
          // 후기를 남기거나 지울 때 팝인/팝아웃, 남은 카드는 layout 으로 밀린다
          <AnimatePresence initial={false}>
            {reviews.map((r) => {
            // user_id 가 null 이면 계정이 지워진 것이다. 후기는 기록이라 글은 남는다.
            const author = r.user_id ? reviewProfiles.get(r.user_id) : null;
            const mine = !!r.user_id && r.user_id === user?.id;
            const editing = editingReviewId === r.id;
            const likers = likesByReview.get(r.id) ?? [];
            const likedByMe = !!user && likers.includes(user.id);
            return (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="rounded-card bg-bg-normal shadow-small p-4 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  {author
                    ? <Avatar profile={author} size={28} />
                    : <div className="w-7 h-7 rounded-full bg-bg-alternative shrink-0" />}
                  <span className="text-label2 font-semibold text-label-normal">
                    {author?.name ?? "탈퇴한 사용자"}
                  </span>
                  <span className="text-caption1 text-label-neutral">
                    {relativeDay(r.created_at)}
                    {r.updated_at ? " · 수정됨" : ""}
                  </span>
                  {mine && !editing && (
                    <div className="ml-auto flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => startEditReview(r.id, r.content)}
                        className="text-caption1 text-label-neutral active:scale-95 transition"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => removeReview(r.id)}
                        className="text-caption1 text-label-neutral active:scale-95 transition"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
                {editing ? (
                  <div className="flex flex-col gap-2">
                    <TextArea
                      label="" rows={2} placeholder="어땠는지 남겨주세요"
                      value={reviewEditDraft} onChange={(e) => setReviewEditDraft(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button" onClick={() => saveReview(r.id)}
                        loading={updateReview.isPending} loadingText="고치는 중..."
                        disabled={!reviewEditDraft.trim()}
                      >
                        저장
                      </Button>
                      <Button type="button" variant="outline" onClick={cancelEditReview}>
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-label1 text-label-normal whitespace-pre-wrap">{r.content}</p>
                    <button
                      type="button"
                      onClick={() => likeReview(r.id, likedByMe)}
                      disabled={!user}
                      aria-label={likedByMe ? "좋아요 취소" : "좋아요"}
                      aria-pressed={likedByMe}
                      className={`self-start flex items-center gap-1.5 text-caption1 active:scale-95 transition
                        ${likedByMe ? "text-status-negative" : "text-label-neutral"}`}
                    >
                      <Heart size={15} strokeWidth={2} fill={likedByMe ? "currentColor" : "none"} />
                      {likers.length > 0 && <span className="tabular-nums">{likers.length}</span>}
                    </button>
                  </>
                )}
              </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
