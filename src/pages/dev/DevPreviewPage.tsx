import { useState } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import BottomNav from "../../components/BottomNav";
import TopBar from "../../components/TopBar";
import GatePage from "../auth/GatePage";
import MemberLoginPage from "../auth/MemberLoginPage";
import HomePage from "../HomePage";
import GatheringListPage from "../gathering/GatheringListPage";
import GatheringDetailPage from "../gathering/GatheringDetailPage";
import GatheringFormPage from "../gathering/GatheringFormPage";
import WorshipSchedulePage from "../worship/WorshipSchedulePage";
import ProfilePage from "../ProfilePage";
import MemberProfileSetupPage from "../MemberProfileSetupPage";
import { ConfirmHost } from "../../components/ConfirmDialog";
import { useAuthStore } from "../../store/authStore";
import { gatheringKeys } from "../../hooks/useGatherings";
import { reviewKeys, type GatheringReviewData } from "../../hooks/useGatheringReviews";
import { myReviewKeys } from "../../hooks/useMyReviews";
import type { GatheringData } from "../../hooks/useGatherings";
import type { WorshipData } from "../../hooks/useWorshipSchedule";
import type { GatheringReview } from "../../types/gathering";

// 개발 전용 미리보기. 앱 라우터 바깥에서 마운트된다(main.tsx) — 그래야 여기서
// MemoryRouter 로 원하는 경로·상태를 꾸며 띄울 수 있다. 라우터는 중첩이 안 된다.
//
// 왜 필요한가: 화면 대부분이 로그인 뒤에 있어 UI 만 손봐도 확인이 막힌다. 반대로
// 게이트/로그인은 로그인'된' 브라우저에서는 홈으로 리다이렉트돼 볼 수 없다.
// 여기서는 authStore 를 원하는 상태로 고정해 어느 쪽이든 띄운다.

// 게이트/로그인은 "로그아웃 + 로딩 끝" 이어야 보인다. isLoading 기본값이 true 라
// 그냥 띄우면 LoadingScreen 만 나온다.
function asLoggedOut() {
  useAuthStore.setState({ user: null, userProfile: null, isAnonymous: false, isLoading: false });
}

const ME = "dev-user-1";

function asLoggedIn() {
  useAuthStore.setState({
    user: { id: ME } as never,
    userProfile: { id: ME, name: "미리보기" } as never,
    isAnonymous: false,
    isLoading: false,
  });
}

// 찬양팀 미리보기용: 포지션·팀이 있어야 내 슬롯(점선)과 토글 가능 여부가 화면에 드러난다.
function asWorshipMember() {
  useAuthStore.setState({
    user: { id: ME } as never,
    userProfile: { id: ME, name: "미리보기", position: ["인도자", "일렉"], team: "나누리" } as never,
    isAnonymous: false,
    isLoading: false,
  });
}

/**
 * 쿼리 캐시를 미리 채워 네트워크 없이 페이지를 띄운다.
 * useState 초기화 함수라 자식이 마운트되기 전(이 컴포넌트의 첫 렌더 중)에 딱 한 번 심긴다 —
 * 그래야 안쪽 useQuery 가 캐시 히트로 시작하고 로그인 없는 요청으로 새지 않는다.
 *
 * setQueryDefaults 로 staleTime 을 무한대로 박는 게 핵심이다. 심어만 두면 훅에 staleTime 이
 * 없는 쿼리는 마운트하자마자 재조회하고, 로그인이 없어 빈 배열이 성공으로 돌아오면서
 * 목 데이터를 덮어쓴다.
 */
function Seed({ entries, children }: {
  entries: [readonly unknown[], unknown][];
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  useState(() => {
    entries.forEach(([key, value]) => {
      queryClient.setQueryDefaults(key, {
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: false,
      });
      queryClient.setQueryData(key, value);
    });
    return null;
  });
  return <>{children}</>;
}

// ── 목 데이터 ────────────────────────────────────────────
// 상대 시각이라 오늘 기준으로 만든다 — 고정 날짜면 시간이 지나 전부 "종료"로 굳는다.
const inDays = (d: number) => new Date(Date.now() + d * 86400_000).toISOString();

function getSundaysInMonth(year: number, month: number): Date[] {
  const sundays: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  while (d.getMonth() === month) {
    sundays.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return sundays;
}

// 카테고리는 DB 테이블이다(멤버가 직접 만들 수 있다). 마이그레이션이 심는 기본 8개 중 일부.
const CAT_STUDY = "cat-study";
const CAT_CAFE = "cat-cafe";
const CAT_MEAL = "cat-meal";

// 챌린지(g-4)를 하나 섞어 둔다 — gathering_at 이 null 인 경로가 화면에서 실제로 밟힌다.
// g-3 은 카테고리가 없다 — 썸네일도 카테고리도 없을 때 기본 아이콘으로 떨어지는 경로다.
const MOCK_GATHERINGS: GatheringData = {
  categories: [
    { id: CAT_CAFE, emoji: "☕️", label: "카페" },
    { id: CAT_MEAL, emoji: "🍽️", label: "식사" },
    { id: CAT_STUDY, emoji: "📖", label: "스터디" },
    // 아무 소모임도 안 달린 카테고리. 필터 칩에 뜨면 안 된다.
    { id: "cat-volunteer", emoji: "🤝", label: "봉사" },
  ],
  gatherings: [
    { id: "g-4", kind: "challenge", title: "성경 통독반", gathering_at: null,
      place_name: "본당 소예배실", place_updated_by: "u2", place_updated_at: inDays(-1),
      // 마커-라이트 본문 — DescriptionBody 렌더러(#, >, ❓/💬, -)를 한 화면에서 확인한다.
      description: [
        "# 무엇을 함께 하나요",
        "> 혼자 읽다 멈췄던 성경, 이번엔 끝까지 함께 가요.",
        "",
        "창세기부터 요한계시록까지,",
        "매일 조금씩 같이 읽습니다.",
        "",
        "❓ 언제 모이나요",
        "💬 정해진 시각은 없어요. 각자 읽고 소예배실에서 편히 나눠요.",
        "❓ 준비물이 있나요",
        "💬 성경과 마음만 있으면 됩니다.",
        "",
        "# 이렇게 진행해요",
        "- 매일 한 장씩 읽기",
        "- 주 1회 소예배실에서 나눔",
        "- 완독하면 다음 회차로",
      ].join("\n"),
      category_id: CAT_STUDY, thumbnail_url: null,
      leader_id: "other", ended_at: null },
    { id: "g-1", kind: "oneday", title: "예배 끝나고 카페", gathering_at: inDays(1),
      place_name: "스타벅스 강남점", place_updated_by: null, place_updated_at: null,
      description: "커피 마시면서 얘기해요", category_id: CAT_CAFE, thumbnail_url: null,
      leader_id: ME, ended_at: null },
    { id: "g-2", kind: "oneday", title: "점심 같이 먹어요", gathering_at: inDays(3),
      place_name: null, place_updated_by: null, place_updated_at: null,
      description: null, category_id: CAT_MEAL, thumbnail_url: null,
      leader_id: "other", ended_at: null },
    { id: "g-3", kind: "oneday", title: "볼링 한 판", gathering_at: inDays(-2),
      place_name: "강남 볼링장", place_updated_by: null, place_updated_at: null,
      description: null, category_id: null, thumbnail_url: null,
      leader_id: "other", ended_at: null },
    // g-5: ME 가 리더이자 유일한 참가자. 나가면 삭제되는 경로(확인창)를 밟는다.
    { id: "g-5", kind: "oneday", title: "나 혼자 산책", gathering_at: inDays(2),
      place_name: "양재천", place_updated_by: null, place_updated_at: null,
      description: "아직 아무도 안 왔어요", category_id: null, thumbnail_url: null,
      leader_id: ME, ended_at: null },
  ],
  // created_at 으로 들어온 순서를 준다 — 리더(ME)가 나갈 때 승계 대상이 결정적으로 정해진다.
  participants: [
    { gathering_id: "g-1", user_id: ME, created_at: inDays(-5) },
    { gathering_id: "g-1", user_id: "u2", created_at: inDays(-4) },
    { gathering_id: "g-1", user_id: "u3", created_at: inDays(-3) },
    { gathering_id: "g-3", user_id: ME, created_at: inDays(-8) },
    { gathering_id: "g-4", user_id: "other", created_at: inDays(-20) },
    { gathering_id: "g-4", user_id: "u2", created_at: inDays(-18) },
    { gathering_id: "g-5", user_id: ME, created_at: inDays(-1) },
  ],
  profiles: [
    { id: ME, name: "나", avatar_url: null },
    { id: "other", name: "박믿음", avatar_url: null },
    { id: "u2", name: "김하늘", avatar_url: null },
    { id: "u3", name: "이바다", avatar_url: null },
  ],
};

// user_id: null 인 후기를 하나 섞는다 — 계정이 지워져도 글은 남는 경로(gathering_reviews 는
// user_id 가 SET NULL 이다)가 화면에서 실제로 밟힌다.
const MOCK_REVIEWS: GatheringReviewData = {
  reviews: [
    { id: "r-1", gathering_id: "g-4", user_id: "u2", content: "다들 꾸준히 나와서 좋아요. 창세기 끝났습니다!",
      created_at: inDays(-1), updated_at: null },
    { id: "r-2", gathering_id: "g-4", user_id: null, content: "덕분에 성경을 처음 끝까지 읽었어요.",
      created_at: inDays(-9), updated_at: inDays(-8) },
  ],
  profiles: MOCK_GATHERINGS.profiles,
  // r-1 에 좋아요 둘(내가 누른 것 하나 포함) — 채워진 하트·카운트 경로가 밟힌다.
  likes: [
    { review_id: "r-1", user_id: ME },
    { review_id: "r-1", user_id: "u3" },
  ],
};

// 내가 쓴 후기(삭제 버튼이 뜬다) + 남이 쓴 후기(안 뜬다).
const MOCK_MY_REVIEWS: GatheringReviewData = {
  reviews: [
    { id: "r-3", gathering_id: "g-1", user_id: ME, content: "케이크가 맛있었어요.",
      created_at: inDays(-2), updated_at: null },
    { id: "r-4", gathering_id: "g-1", user_id: "u3", content: "다음엔 좀 더 조용한 데로 가요.",
      created_at: inDays(-3), updated_at: null },
  ],
  profiles: MOCK_GATHERINGS.profiles,
  // 남이 쓴 후기(r-4)에 좋아요 하나 — 아직 내가 안 누른(빈 하트) 경로.
  likes: [{ review_id: "r-4", user_id: "u2" }],
};

const today = new Date();

// 찬양팀 시트. 이번 달 주일들을 오늘 기준으로 만든다 — 고정 날짜면 달이 바뀌며 빈 화면이 된다.
// 첫 주일부터 하나 걸러 확정을 채워, 확정 슬롯·미정 슬롯·내 자리(점선)가 한 화면에 다 나온다.
const wsSundays = getSundaysInMonth(today.getFullYear(), today.getMonth());
const wsActive = wsSundays.find((d) => d >= today) ?? wsSundays[wsSundays.length - 1];
const wsActiveId = "ws-active";
const MOCK_WORSHIP: WorshipData = {
  schedules: wsSundays.map((d, i) => ({
    id: d === wsActive ? wsActiveId : `ws-${i}`,
    date: d.toISOString().slice(0, 10),
  })),
  members: [
    { id: ME, name: "미리보기", position: ["인도자", "일렉"], avatar_url: null, team: "나누리" },
    { id: "m2", name: "김하늘", position: ["싱어1"], avatar_url: null, team: "나누리" },
    { id: "m3", name: "이바다", position: ["메인 피아노"], avatar_url: null, team: "나누리" },
    { id: "m4", name: "박믿음", position: ["드럼"], avatar_url: null, team: "나누리" },
    { id: "m5", name: "정소망", position: ["베이스"], avatar_url: null, team: "섬김이" },
  ],
  availability: [
    { schedule_id: wsActiveId, user_id: "m2", position: "싱어1", available: true },
    { schedule_id: wsActiveId, user_id: "m3", position: "메인 피아노", available: true },
    { schedule_id: wsActiveId, user_id: "m4", position: "드럼", available: true },
  ],
};

// 프로필의 "내 후기": 소모임을 가로질러 ME 가 쓴 후기만. g-1(카페)·g-4(통독반) 두 곳.
const MY_REVIEW_ROWS: GatheringReview[] = [
  { id: "mr-1", gathering_id: "g-1", user_id: ME, content: "케이크가 맛있었어요.",
    created_at: inDays(-2), updated_at: null },
  { id: "mr-2", gathering_id: "g-4", user_id: ME, content: "창세기 완독! 다음 회차도 기대돼요.",
    created_at: inDays(-6), updated_at: inDays(-5) },
];

const NAV_ROUTES = ["/gatherings", "/worship", "/profile"];

function NavPreview() {
  return (
    <div className="p-4 flex flex-col gap-6">
      <h1 className="text-heading font-bold">BottomNav — 탭별 활성 상태</h1>
      {NAV_ROUTES.map((route) => (
        <div key={route}>
          <p className="text-caption text-fg-muted mb-1">활성: {route}</p>
          {/* 캡슐은 떠 있는 조각이라 실제처럼 캔버스 위에 중앙 정렬해 띄운다. */}
          <div className="mx-auto w-full max-w-md flex justify-center bg-bg-alternative rounded-card py-6">
            <MemoryRouter initialEntries={[route]}>
              <BottomNav />
            </MemoryRouter>
          </div>
        </div>
      ))}
    </div>
  );
}

// 앱 셸과 같은 폭·스크롤 구조로 감싸야 실제 화면처럼 보인다.
// 실제 Layout 을 그대로 흉내 낸다: 바깥은 h-dvh overflow-hidden 프레임, 안쪽은 flex-1
// overflow-y-auto 스크롤 영역. 이래야 sticky(상세 상단 바 등)가 실제 앱과 똑같이 스크롤
// 영역에 붙는다 — min-h-dvh(윈도우 스크롤)로 두면 sticky 가 붙을 컨테이너가 없어 안 먹는다.
// flex-col 인 이유: 페이지들이 flex-1 / mt-auto 로 셸의 세로 흐름에 기댄다.
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md h-dvh border-x border-line flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col overflow-y-auto min-h-0">{children}</div>
    </div>
  );
}

const SCREENS: Record<string, () => React.ReactElement> = {
  nav: () => <NavPreview />,
  // 상단 바. 실제 앱처럼 캔버스 위에 얹고, 밑에 흰 카드를 하나 둬 하이라인 분리를 확인한다.
  topbar: () => (
    <MemoryRouter initialEntries={["/gatherings"]}>
      <div className="mx-auto w-full max-w-md min-h-dvh bg-bg-alternative flex flex-col">
        <TopBar />
        <div className="p-4 flex flex-col gap-3">
          <div className="rounded-card bg-bg-normal shadow-small p-4 text-body1 text-label-neutral">
            바 밑을 스치는 흰 카드
          </div>
        </div>
      </div>
    </MemoryRouter>
  ),
  gate: () => {
    asLoggedOut();
    return (
      <MemoryRouter initialEntries={["/"]}>
        <Phone><GatePage /></Phone>
      </MemoryRouter>
    );
  },
  login: () => {
    asLoggedOut();
    return (
      <MemoryRouter initialEntries={["/member/login"]}>
        <Phone><MemberLoginPage /></Phone>
      </MemoryRouter>
    );
  },
  home: () => {
    asLoggedIn();
    return (
      <MemoryRouter initialEntries={["/home"]}>
        <Phone><HomePage /></Phone>
      </MemoryRouter>
    );
  },
  gatherings: () => {
    asLoggedIn();
    return (
      <Seed entries={[[gatheringKeys.list, MOCK_GATHERINGS]]}>
        <MemoryRouter initialEntries={["/gatherings"]}>
          <Phone><GatheringListPage /></Phone>
        </MemoryRouter>
      </Seed>
    );
  },
  // 챌린지(g-4)로 띄운다 — 무기한 표기·장소 수정 이력·탈퇴한 사용자 후기가 한 화면에 다 나온다.
  "gathering-detail": () => {
    asLoggedIn();
    return (
      <Seed entries={[[gatheringKeys.list, MOCK_GATHERINGS], [reviewKeys.of("g-4"), MOCK_REVIEWS]]}>
        <MemoryRouter initialEntries={["/gatherings/g-4"]}>
          <Routes>
            <Route path="/gatherings/:id" element={<Phone><GatheringDetailPage /></Phone>} />
          </Routes>
        </MemoryRouter>
      </Seed>
    );
  },
  "gathering-new": () => {
    asLoggedIn();
    // 카테고리 칩이 DB 에서 오므로 목록 쿼리를 심어야 2단계가 빈 화면이 아니다.
    return (
      <Seed entries={[[gatheringKeys.list, MOCK_GATHERINGS]]}>
        <MemoryRouter initialEntries={["/gatherings/new"]}>
          <Phone><GatheringFormPage /></Phone>
        </MemoryRouter>
      </Seed>
    );
  },
  // 참가자 시점. 장소 수정 연필과 후기 입력은 참가자에게만 보이므로(RLS 와 같은 조건)
  // 위 화면으로는 그 둘을 볼 수 없다. g-1 은 ME 가 리더이자 참가자다.
  "gathering-detail-mine": () => {
    asLoggedIn();
    return (
      <Seed entries={[[gatheringKeys.list, MOCK_GATHERINGS], [reviewKeys.of("g-1"), MOCK_MY_REVIEWS]]}>
        <MemoryRouter initialEntries={["/gatherings/g-1"]}>
          <Routes>
            <Route path="/gatherings/:id" element={<Phone><GatheringDetailPage /></Phone>} />
          </Routes>
        </MemoryRouter>
      </Seed>
    );
  },
  // ME 가 리더이자 혼자다(g-5). "내가 이끄는 모임"을 누르면 삭제 확인창이 뜨고,
  // "모임 종료하기"로는 기록을 남긴 채 done 이 된다.
  "gathering-detail-solo": () => {
    asLoggedIn();
    return (
      <Seed entries={[[gatheringKeys.list, MOCK_GATHERINGS], [reviewKeys.of("g-5"), { reviews: [], profiles: MOCK_GATHERINGS.profiles, likes: [] }]]}>
        <MemoryRouter initialEntries={["/gatherings/g-5"]}>
          <Routes>
            <Route path="/gatherings/:id" element={<Phone><GatheringDetailPage /></Phone>} />
          </Routes>
        </MemoryRouter>
      </Seed>
    );
  },
  profile: () => {
    asLoggedIn();
    // 참가 소모임은 gatherings 캐시(participants 에 ME)로, 내 후기는 my_reviews 키로 심는다.
    return (
      <Seed entries={[[gatheringKeys.list, MOCK_GATHERINGS], [myReviewKeys.of(ME), MY_REVIEW_ROWS]]}>
        <MemoryRouter initialEntries={["/profile"]}>
          <Phone><ProfilePage /></Phone>
        </MemoryRouter>
      </Seed>
    );
  },
  "profile-setup": () => {
    asWorshipMember(); // 포지션·팀이 있는 프로필로 띄워 다중 셀렉터의 초기값을 확인한다.
    return (
      <MemoryRouter initialEntries={["/member/setup"]}>
        <Phone><MemberProfileSetupPage /></Phone>
      </MemoryRouter>
    );
  },
  worship: () => {
    asWorshipMember();
    // 쿼리 키가 ["worship", year, month] 라 이번 달로 심는다(useCalendar 기본값과 같은 today 기준).
    return (
      <Seed entries={[[["worship", today.getFullYear(), today.getMonth()], MOCK_WORSHIP]]}>
        <MemoryRouter initialEntries={["/worship"]}>
          <Phone><WorshipSchedulePage /></Phone>
        </MemoryRouter>
      </Seed>
    );
  },
};

export default function DevPreviewPage() {
  const key = window.location.pathname.replace("/__dev/", "");
  const screen = SCREENS[key];
  if (!screen) {
    return (
      <div className="p-4">
        <h1 className="text-heading font-bold mb-2">개발 미리보기</h1>
        <ul className="list-disc pl-5 text-body">
          {Object.keys(SCREENS).map((k) => (
            <li key={k}><a className="text-accent underline" href={`/__dev/${k}`}>/__dev/{k}</a></li>
          ))}
        </ul>
      </div>
    );
  }
  // ConfirmHost 를 같이 마운트한다 — 앱 루트(main.tsx Root)에만 있어서, 그냥 두면
  // 미리보기에서 confirmDialog() 가 아무것도 안 띄운다(삭제·로그아웃 확인이 안 보인다).
  return (
    <>
      {screen()}
      <ConfirmHost />
    </>
  );
}
