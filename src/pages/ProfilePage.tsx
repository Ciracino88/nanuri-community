import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronRight, LogOut, MessageSquareText, Pencil, Users } from "lucide-react";
import toast from "react-hot-toast";
import { confirmDialog } from "../components/ConfirmDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuthStore } from "../store/authStore";
import { useGatherings, type GatheringData } from "../hooks/useGatherings";
import { useMyReviews, useDeleteMyReview } from "../hooks/useMyReviews";
import { PAGE_BOTTOM_PAD } from "../constants/layout";
import {
  computeGatheringStatus,
  formatGatheringWhen,
  GATHERING_STATUS_LABEL,
} from "../lib/gatheringTime";
import type { GatheringCategory, GatheringRecord } from "../types/gathering";

const INTRO = "나누리 청년부와 함께하고 있어요";

function relativeDay(iso: string, now = new Date()) {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86400_000);
  if (days <= 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 소모임 썸네일 → 카테고리 이모지 → 기본 아이콘. 목록 카드와 같은 폴백(docs/design.md). */
function GatheringThumb({ gathering, category }: {
  gathering: GatheringRecord;
  category: GatheringCategory | null;
}) {
  if (gathering.thumbnail_url) {
    return <img src={gathering.thumbnail_url} alt="" className="w-11 h-11 rounded-field object-cover shrink-0" />;
  }
  return (
    <div className="w-11 h-11 rounded-field bg-status-bg-active text-primary-normal flex items-center justify-center shrink-0">
      {category ? <span style={{ fontSize: 22 }}>{category.emoji}</span> : <Users size={20} strokeWidth={2.25} />}
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-baseline gap-2 px-1">
      <h2 className="text-headline2 font-bold text-label-normal">{title}</h2>
      {count > 0 && <span className="text-label2 font-semibold text-label-neutral">{count}</span>}
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card bg-bg-normal shadow-small px-4 py-6 text-center">
      <p className="text-label1 text-label-neutral">{children}</p>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuthStore();
  const name = userProfile?.name ?? "이름 없음";
  const avatar = userProfile?.avatar_url;

  const { data, isLoading } = useGatherings();
  const empty: GatheringData = { gatherings: [], participants: [], profiles: [], categories: [] };
  const { gatherings, participants, categories } = data ?? empty;
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  // 내가 참가한 소모임. participants 는 이미 소모임 탭에서 캐시돼 있어 추가 요청이 없다.
  const myGatherings = gatherings.filter((g) =>
    participants.some((p) => p.gathering_id === g.id && p.user_id === user?.id)
  );

  const { data: myReviews, isLoading: reviewsLoading } = useMyReviews(user?.id);
  const deleteReview = useDeleteMyReview(user?.id);
  const gatheringById = new Map(gatherings.map((g) => [g.id, g]));

  const removeReview = async (id: string, gatheringId: string) => {
    const ok = await confirmDialog({
      title: "후기를 지울까요?",
      message: "지운 후기는 되돌릴 수 없어요.",
      confirmLabel: "삭제",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteReview.mutateAsync({ id, gatheringId });
      toast.success("후기를 지웠어요");
    } catch (err) {
      console.error("[deleteMyReview] error:", err);
      toast.error("후기를 지우지 못했어요");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div
        className="w-full max-w-md mx-auto px-4 pt-6 flex flex-col gap-6"
        style={{ paddingBottom: PAGE_BOTTOM_PAD }}
      >
        <h1 className="sr-only">내 정보</h1>

        {/* 프로필 헤더 */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-status-bg-active text-primary-normal text-title3 font-bold shrink-0">
            {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-title3 font-bold text-label-normal truncate">{name}</p>
            <p className="text-label2 text-label-neutral truncate">{INTRO}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/member/setup")}
            aria-label="프로필 편집"
            className="w-9 h-9 rounded-full bg-bg-normal shadow-xsmall text-label-neutral flex items-center justify-center shrink-0 active:scale-90 transition"
          >
            <Pencil size={16} />
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* 내 소그룹 */}
            <section className="flex flex-col gap-3">
              <SectionHeader title="내 소그룹" count={myGatherings.length} />
              {myGatherings.length === 0 ? (
                <EmptyRow>아직 참가한 소그룹이 없어요</EmptyRow>
              ) : (
                <div className="flex flex-col gap-2">
                  {myGatherings.map((g, i) => {
                    const category = g.category_id ? categoryById.get(g.category_id) ?? null : null;
                    const status = computeGatheringStatus(g);
                    const isLeader = g.leader_id === user?.id;
                    return (
                      <motion.button
                        key={g.id}
                        onClick={() => navigate(`/gatherings/${g.id}`)}
                        className="w-full text-left rounded-card bg-bg-normal shadow-small p-3 flex items-center gap-3 active:scale-[0.99] transition"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i, 6) * 0.04 }}
                      >
                        <GatheringThumb gathering={g} category={category} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {isLeader && (
                              <span className="text-caption1 font-semibold px-2 py-0.5 rounded-full bg-status-bg-active text-primary-normal shrink-0">
                                리더
                              </span>
                            )}
                            {status !== "open" && (
                              <span className="text-caption1 font-medium px-2 py-0.5 rounded-full bg-status-bg-idle text-label-neutral shrink-0">
                                {GATHERING_STATUS_LABEL[status]}
                              </span>
                            )}
                          </div>
                          <p className="text-body1 font-semibold text-label-normal truncate">{g.title}</p>
                          <p className="text-label2 text-label-neutral truncate">
                            {formatGatheringWhen(g)}
                            {g.place_name ? ` · ${g.place_name}` : ""}
                          </p>
                        </div>
                        <ChevronRight size={18} className="text-label-assistive shrink-0" />
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 내 후기 */}
            <section className="flex flex-col gap-3">
              <SectionHeader title="내 후기" count={myReviews?.length ?? 0} />
              {reviewsLoading ? (
                <LoadingSpinner />
              ) : (myReviews?.length ?? 0) === 0 ? (
                <EmptyRow>아직 남긴 후기가 없어요</EmptyRow>
              ) : (
                <div className="flex flex-col gap-2">
                  {myReviews!.map((r, i) => {
                    const g = gatheringById.get(r.gathering_id);
                    return (
                      <motion.div
                        key={r.id}
                        className="rounded-card bg-bg-normal shadow-small p-4 flex flex-col gap-2"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i, 6) * 0.04 }}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquareText size={14} className="text-label-assistive shrink-0" />
                          <button
                            type="button"
                            onClick={() => navigate(`/gatherings/${r.gathering_id}`)}
                            className="text-label2 font-semibold text-label-normal truncate min-w-0 active:opacity-70 transition"
                          >
                            {g?.title ?? "삭제된 소모임"}
                          </button>
                          <span className="text-caption1 text-label-neutral shrink-0">
                            {relativeDay(r.created_at)}
                            {r.updated_at ? " · 수정됨" : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeReview(r.id, r.gathering_id)}
                            disabled={deleteReview.isPending}
                            className="ml-auto text-caption1 text-label-neutral active:scale-95 transition disabled:opacity-50 shrink-0"
                          >
                            삭제
                          </button>
                        </div>
                        <p className="text-label1 text-label-normal whitespace-pre-wrap">{r.content}</p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* 로그아웃 */}
        <button
          type="button"
          onClick={async () => {
            const ok = await confirmDialog({
              title: "로그아웃할까요?",
              message: "다시 로그인하려면 구글 계정 인증이 필요해요.",
              confirmLabel: "로그아웃",
              danger: true,
            });
            if (!ok) return;
            await signOut();
            navigate("/");
          }}
          className="w-full py-3.5 rounded-field flex items-center justify-center gap-2 text-body1 font-semibold text-label-neutral bg-bg-normal shadow-xsmall active:bg-bg-alternative transition"
        >
          <LogOut size={16} />
          로그아웃
        </button>
      </div>
    </div>
  );
}
