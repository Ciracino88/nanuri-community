import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Check, ChevronRight, Plus, Search, Users, X } from "lucide-react";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuthStore } from "../../store/authStore";
import { useGatherings, type GatheringData } from "../../hooks/useGatherings";
import { useToggleGatheringJoin } from "../../hooks/useToggleGatheringJoin";
import { PAGE_BOTTOM_PAD_WITH_FAB } from "../../constants/layout";
import {
  computeGatheringStatus,
  formatGatheringWhen,
  GATHERING_STATUS_LABEL,
  type GatheringStatus,
} from "../../lib/gatheringTime";
import type { GatheringCategory, GatheringRecord, ParticipantProfile } from "../../types/gathering";

// 배지는 식별용이라 Primary 를 쓰지 않는다 — 누를 수 없는 것에 상호작용 색을 쓰면
// 규칙이 깨진다. 원티드가 시맨틱에 물려둔 상태 배경 둘을 그대로 쓴다.
const STATUS_BADGE: Record<GatheringStatus, string> = {
  open: "bg-status-bg-active text-primary-normal",
  closed: "bg-status-bg-idle text-label-neutral",
  done: "bg-status-bg-idle text-label-neutral",
};

// 상태 축 하나만 담는다. 성격(원데이/챌린지)은 여기 섞지 않는다 —
// 곱해지는 축이라 한 줄에 두면 "종료된 챌린지"에 도달할 수 없다(docs/data-model.md).
const STATUS_TABS = [
  { key: "live", label: "현재" },
  { key: "all", label: "전체" },
  { key: "done", label: "종료" },
] as const;
type StatusTab = (typeof STATUS_TABS)[number]["key"];

const MAX_FACES = 5;

function AvatarStack({ profiles }: { profiles: ParticipantProfile[] }) {
  if (profiles.length === 0) {
    return <span className="text-label2 font-medium text-label-neutral">아직 아무도 없어요</span>;
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
            className="rounded-full overflow-hidden flex items-center justify-center bg-bg-alternative border-2 border-bg-normal"
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
              <span className="text-[10px] font-bold text-label-neutral">{p.name.slice(0, 1)}</span>
            )}
          </div>
        ))}
      </div>
      <span className="text-label2 font-medium text-label-neutral">
        {rest > 0 ? `+${rest} · ` : ""}{profiles.length}명
      </span>
    </div>
  );
}

/** 선택 = 상호작용이라 Primary 가 담당한다(docs/design.md). 안 고른 칩은 카드 면에 얹는다. */
function Chip({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-label1 font-semibold px-3.5 py-2 rounded-full whitespace-nowrap shrink-0 transition active:scale-95 ${
        active
          ? "bg-primary-normal text-static-white"
          : "bg-bg-normal text-label-neutral shadow-xsmall"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * 썸네일 → 카테고리 이모지 → 기본 아이콘 순으로 떨어진다.
 *
 * 소모임 자체의 이모지는 없앴다. 썸네일도 카테고리도 없던 1단계에는 그게 유일한 시각
 * 식별자였지만, 둘 다 생긴 지금은 같은 걸 두 번 고르게 하는 셈이었다(아이콘 ☕ + 카테고리 ☕️ 카페).
 */
function GatheringThumb({ gathering, category, dim }: {
  gathering: GatheringRecord;
  category: GatheringCategory | null;
  dim: boolean;
}) {
  if (gathering.thumbnail_url) {
    return (
      <img
        src={gathering.thumbnail_url}
        alt=""
        className={`w-14 h-14 rounded-field object-cover shrink-0 ${dim ? "opacity-60" : ""}`}
      />
    );
  }
  return (
    <div
      className={`w-14 h-14 rounded-field flex items-center justify-center shrink-0 ${
        dim ? "bg-bg-alternative text-label-assistive" : "bg-status-bg-active text-primary-normal"
      }`}
    >
      {category
        ? <span style={{ fontSize: 26 }}>{category.emoji}</span>
        : <Users size={22} strokeWidth={2.25} />}
    </div>
  );
}

function GatheringCard({ gathering, category, profiles, joined, isLeader, toggling, index, onToggle, onOpen }: {
  gathering: GatheringRecord;
  category: GatheringCategory | null;
  profiles: ParticipantProfile[];
  joined: boolean;
  isLeader: boolean;
  toggling: boolean;
  index: number;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const status = computeGatheringStatus(gathering);
  const dim = status !== "open";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.05, type: "spring", stiffness: 360, damping: 30 }}
      className="rounded-card bg-bg-normal shadow-small p-4 flex flex-col gap-3"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
        className="flex items-center gap-3 text-left cursor-pointer"
      >
        <GatheringThumb gathering={gathering} category={category} dim={dim} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {/* 챌린지에만 배지를 단다. 원데이가 기본이라 전부에 찍으면 노이즈가 되고,
                오히려 챌린지가 안 보인다. 배지는 예외를 표시할 때 값을 한다. */}
            {gathering.kind === "challenge" && (
              <span className="text-caption1 font-semibold px-2 py-0.5 rounded-full shrink-0 bg-status-bg-idle text-label-neutral">
                챌린지
              </span>
            )}
            {status !== "open" && (
              <span className={`text-caption1 font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[status]}`}>
                {GATHERING_STATUS_LABEL[status]}
              </span>
            )}
            {category && (
              <span className="text-caption1 font-medium text-label-neutral shrink-0">
                {category.emoji} {category.label}
              </span>
            )}
          </div>

          <p className={`text-body1 font-semibold truncate ${dim ? "text-label-neutral" : "text-label-normal"}`}>
            {gathering.title}
          </p>
          <p className="text-label2 text-label-neutral truncate">
            {formatGatheringWhen(gathering)}
            {gathering.place_name ? ` · ${gathering.place_name}` : ""}
          </p>
        </div>

        <ChevronRight size={18} className="text-label-assistive shrink-0" />
      </div>

      {/* description 은 카드에 싣지 않는다 — 상세로 들어가면 있다.
          카드가 이미 제목·시각·장소·카테고리·참여자를 이고 있어서 한 줄 더 얹으면
          훑어보는 목록이 아니라 읽는 목록이 된다. */}

      <div className="flex items-center justify-between gap-3">
        <AvatarStack profiles={profiles} />

        {status === "open" ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            disabled={toggling}
            // 참여 = 선택 상태라 Primary 담당. 참여 중이면 채우지 않고 낮춘다.
            className={`text-label1 font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shrink-0 transition disabled:opacity-60 ${
              joined
                ? "bg-status-bg-active text-primary-normal"
                : "bg-primary-normal text-static-white"
            }`}
          >
            {joined && <Check size={14} strokeWidth={3} />}
            {joined ? (isLeader ? "리더" : "참여 중") : "참여하기"}
          </motion.button>
        ) : (
          <span className="text-label2 font-medium shrink-0 text-label-neutral">
            {joined ? "참여했어요" : ""}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function GatheringListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data, isLoading } = useGatherings();

  const [tab, setTab] = useState<StatusTab>("live");
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const empty: GatheringData = { gatherings: [], participants: [], profiles: [], categories: [] };
  const { gatherings, participants, profiles, categories } = data ?? empty;

  const { toggle, togglingId } = useToggleGatheringJoin(participants);

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const participantsOf = (gatheringId: string) =>
    participants
      .filter((p) => p.gathering_id === gatheringId)
      .map((p) => profileById.get(p.user_id))
      .filter((p): p is ParticipantProfile => !!p);

  // 필터 칩에는 **실제로 소모임이 달린 카테고리만** 띄운다.
  // 카테고리를 멤버가 직접 만들 수 있어서 목록이 무한히 길어질 수 있는데, 안 쓰이는 걸 걸러봐야
  // 어차피 빈 목록이라 필터의 목적상 나올 이유가 없다. 덕분에 삭제·정리 로직도 필요 없다 —
  // 아무도 안 쓰는 카테고리는 저절로 사라진다.
  const usedCategories = useMemo(() => {
    const used = new Set(gatherings.map((g) => g.category_id).filter(Boolean));
    return categories.filter((c) => used.has(c.id));
  }, [gatherings, categories]);

  // 정렬은 DB 가 한다(gathering_at desc nulls first — 챌린지가 위). 여기서는 거르기만 한다.
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gatherings.filter((g) => {
      const done = computeGatheringStatus(g) === "done";
      if (tab === "live" && done) return false;
      if (tab === "done" && !done) return false;
      if (category && g.category_id !== category) return false;
      if (q && !g.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [gatherings, tab, category, query]);

  const filtering = !!category || !!query.trim();

  return (
    <div className="flex-1 flex flex-col relative">
      <div
        className="w-full max-w-md mx-auto px-4 pt-6 flex flex-col gap-4"
        style={{ paddingBottom: PAGE_BOTTOM_PAD_WITH_FAB }}
      >
        {/* 화면 제목은 상단 바가 대신한다 — 여기 큰 "소모임" 라벨은 공간만 먹어 지웠다.
            다만 문서 구조상 h1 은 남겨야 하니 화면에는 안 보이게 둔다(스크린리더용). */}
        <h1 className="sr-only">소모임</h1>

        {/* 상태 축 */}
        <div className="flex items-center gap-2">
          {STATUS_TABS.map((t) => (
            <Chip key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
            </Chip>
          ))}
        </div>

        {/* 검색 — 제목 */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-assistive pointer-events-none"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="어떤 모임을 찾으세요?"
            // text-body1(16px) 밑으로 내리지 않는다 — iOS Safari 가 포커스 시 확대한다.
            className="w-full rounded-field bg-bg-normal shadow-xsmall pl-11 pr-10 py-3 text-body1 text-label-normal placeholder:text-label-assistive outline-none focus:ring-2 focus:ring-primary-normal"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="검색어 지우기"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-label-assistive active:scale-90 transition"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* 검색 — 카테고리. 색은 주지 않는다. 구분은 이모지가 한다(docs/design.md). */}
        {usedCategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Chip active={category === null} onClick={() => setCategory(null)}>
              전체
            </Chip>
            {usedCategories.map((c) => (
              <Chip
                key={c.id}
                active={category === c.id}
                onClick={() => setCategory(category === c.id ? null : c.id)}
              >
                {c.emoji} {c.label}
              </Chip>
            ))}
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner />
        ) : shown.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-2">
            <Users size={32} className="text-label-assistive" />
            <p className="text-body1 font-semibold text-label-neutral">
              {filtering ? "찾는 모임이 없어요" : "아직 소모임이 없어요"}
            </p>
            <p className="text-label1 text-label-neutral">
              {filtering ? "다른 조건으로 찾아보세요" : "먼저 하나 만들어보세요"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-1">
            {shown.map((g, i) => (
              <GatheringCard
                key={g.id}
                gathering={g}
                category={g.category_id ? categoryById.get(g.category_id) ?? null : null}
                profiles={participantsOf(g.id)}
                joined={participants.some((p) => p.gathering_id === g.id && p.user_id === user?.id)}
                isLeader={g.leader_id === user?.id}
                toggling={togglingId === g.id}
                index={i}
                onToggle={() => toggle(g.id)}
                onOpen={() => navigate(`/gatherings/${g.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 플로팅 만들기 버튼.
          sticky + height:0 인 이유: 스크롤 컨테이너는 Layout 의 main 이고 셸이 max-w-md 다.
          fixed 로 두면 데스크톱에서 앱 프레임 밖(뷰포트 오른쪽 끝)으로 튀고,
          absolute 로 두면 목록이 길어질 때 같이 스크롤돼 사라진다.
          mt-auto: 목록이 짧을 때도(빈 상태) 버튼이 위로 딸려 올라오지 않고 아래에 붙는다.

          bottom 을 캡슐 높이만큼 올린 이유: 떠 있는 탭바 캡슐이 중앙 하단에 뜨는데, 이 버튼은
          우하단이라 좁은 폭에서 캡슐과 가로로 겹친다. 캡슐 위로 올려 포개짐을 피한다
          (docs/design.md · PAGE_BOTTOM_PAD_WITH_FAB).

          ⚠ items-end 가 버튼을 띄우는 방식이다. 컨테이너가 height:0 이라 교차축 끝(아래 모서리)이
          곧 기준선이고, 거기에 버튼의 아래 모서리를 맞추면 버튼이 그 위로 넘쳐 그려진다.
          버튼에 transform 을 걸어 올리지 말 것 — whileTap 의 scale 도 transform 이라
          탭하는 순간 motion 이 덮어써서 버튼이 자기 높이만큼 아래로 뛴다(실제로 그랬다).
          transform 은 motion 몫으로 비워둔다. */}
      <div
        className="sticky z-50 mt-auto flex justify-end items-end px-5 pointer-events-none"
        style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))", height: 0 }}
      >
        <motion.button
          whileTap={{ scale: 0.96 }}
          // 시트가 아니라 페이지로 뺀다 — 개설은 세 걸음짜리 흐름이라 시트 하나에 다 넣으면
          // 고를 게 너무 많아 복잡해진다.
          onClick={() => navigate("/gatherings/new")}
          aria-label="소모임 만들기"
          // 알약이 아니라 rounded-field(14) 다. 반경 14 는 원티드 확인값이고, 알약은 옛 디자인의
          // 정체성이라 이 화면에서 유일하게 남은 원티드 아닌 면이었다(docs/design.md).
          // 칩·배지는 rounded-full 을 그대로 둔다 — 작고 글자만 있는 것들은 알약이 맞다.
          className="pointer-events-auto rounded-field flex items-center justify-center gap-1.5 px-4 py-3 bg-primary-normal text-static-white shadow-medium active:opacity-90 transition-opacity"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span className="text-label1 font-semibold">만들기</span>
        </motion.button>
      </div>
    </div>
  );
}
