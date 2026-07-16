import { useState } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import BottomNav from "../../components/BottomNav";
import GatePage from "../auth/GatePage";
import MemberLoginPage from "../auth/MemberLoginPage";
import HomePage from "../HomePage";
import GatheringListPage from "../gathering/GatheringListPage";
import EventSegmentsPage from "../admin/event/EventSegmentsPage";
import EventBuilderPage from "../admin/event/EventBuilderPage";
import EventTimelinePage from "../event/EventTimelinePage";
import { useAuthStore } from "../../store/authStore";
import { eventKeys } from "../../hooks/useEvents";
import { gatheringKeys } from "../../hooks/useGatherings";
import type { EventDetailData } from "../../hooks/useEvents";
import type { EventRecord } from "../../types/event";
import type { GatheringData } from "../../hooks/useGatherings";

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

/**
 * 쿼리 캐시를 미리 채워 네트워크 없이 페이지를 띄운다.
 * useState 초기화 함수라 자식이 마운트되기 전(이 컴포넌트의 첫 렌더 중)에 딱 한 번 심긴다 —
 * 그래야 안쪽 useQuery 가 캐시 히트로 시작하고 로그인 없는 요청으로 새지 않는다.
 *
 * setQueryDefaults 로 staleTime 을 무한대로 박는 게 핵심이다. 심어만 두면 훅에 staleTime 이
 * 없는 쿼리(useEventList)는 마운트하자마자 재조회하고, 로그인이 없어 빈 배열이 성공으로
 * 돌아오면서 목 데이터를 덮어쓴다.
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
const MOCK_EVENTS: EventRecord[] = [
  {
    id: "ev-1", title: "여름 수련회", event_date: "2026-08-14", start_time: "19:00",
    place_name: "본당", image_url: null, banner_url: null, emoji: null,
    description: null, details: [], results_public: false,
  },
];

// 상대 시각이라 오늘 기준으로 만든다 — 고정 날짜면 시간이 지나 전부 "종료"로 굳는다.
const inDays = (d: number) => new Date(Date.now() + d * 86400_000).toISOString();

const MOCK_GATHERINGS: GatheringData = {
  gatherings: [
    { id: "g-1", title: "예배 끝나고 카페", gathering_at: inDays(1), place_name: "스타벅스 강남점",
      description: "커피 마시면서 얘기해요", emoji: "☕", created_by: ME, closed_at: null },
    { id: "g-2", title: "점심 같이 먹어요", gathering_at: inDays(3), place_name: null,
      description: null, emoji: "🍽️", created_by: "other", closed_at: null },
    { id: "g-3", title: "볼링 한 판", gathering_at: inDays(-2), place_name: "강남 볼링장",
      description: null, emoji: "🎳", created_by: "other", closed_at: null },
  ],
  participants: [
    { gathering_id: "g-1", user_id: ME },
    { gathering_id: "g-1", user_id: "u2" },
    { gathering_id: "g-1", user_id: "u3" },
    { gathering_id: "g-3", user_id: ME },
  ],
  profiles: [
    { id: ME, name: "나", avatar_url: null },
    { id: "u2", name: "김하늘", avatar_url: null },
    { id: "u3", name: "이바다", avatar_url: null },
  ],
};

// 행사 상세(관리자·타임라인 공용). 타임라인의 "LIVE/현재 진행" 을 보려면 진행 중이어야 하므로
// 오늘 날짜 + 조금 전 시작으로 맞춘다. 고정 날짜면 항상 "종료"만 보인다.
const today = new Date();
const pad = (n: number) => String(n).padStart(2, "0");
const TODAY_DOTS = `${today.getFullYear()}.${pad(today.getMonth() + 1)}.${pad(today.getDate())}`;
const startedAt = new Date(Date.now() - 20 * 60_000); // 20분 전 시작 → 첫 순서가 진행 중
const START_TIME = `${pad(startedAt.getHours())}:${pad(startedAt.getMinutes())}`;

const MOCK_DETAIL: EventDetailData = {
  event: {
    id: "ev-1", title: "여름 수련회", event_date: TODAY_DOTS, start_time: START_TIME,
    place_name: "본당", image_url: null, banner_url: null, emoji: null,
    description: null, details: [{ label: "대상", value: "청년부 전체" }], results_public: false,
  },
  segments: [
    { id: "s-1", title: "오프닝 & 환영 인사", duration_min: 30, description: "찬양팀 인도로 시작합니다", sort: 0 },
    { id: "s-2", title: "말씀", duration_min: 45, description: null, sort: 1 },
    { id: "s-3", title: "조별 나눔", duration_min: 60, description: "조별로 흩어져 나눔의 시간을 갖습니다", sort: 2 },
    { id: "s-4", title: "마무리 기도", duration_min: 15, description: null, sort: 3 },
  ],
};

const NAV_ROUTES = ["/home", "/gatherings", "/gallery", "/worship", "/profile"];

function NavPreview() {
  return (
    <div className="p-4 flex flex-col gap-6">
      <h1 className="text-heading font-bold">BottomNav — 탭별 활성 상태</h1>
      {NAV_ROUTES.map((route) => (
        <div key={route}>
          <p className="text-caption text-fg-muted mb-1">활성: {route}</p>
          <div className="mx-auto w-full max-w-md border border-line rounded-card overflow-hidden">
            <MemoryRouter initialEntries={[route]}>
              <BottomNav />
            </MemoryRouter>
          </div>
        </div>
      ))}
    </div>
  );
}

// 앱 셸과 같은 폭으로 감싸야 실제 화면처럼 보인다.
// flex-col 인 이유: 페이지들이 flex-1 / mt-auto 로 셸(Layout)의 세로 흐름에 기댄다.
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md min-h-dvh border-x border-line flex flex-col">{children}</div>
  );
}

const SCREENS: Record<string, () => React.ReactElement> = {
  nav: () => <NavPreview />,
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
      <Seed entries={[[eventKeys.list, MOCK_EVENTS]]}>
        <MemoryRouter initialEntries={["/home"]}>
          <Phone><HomePage /></Phone>
        </MemoryRouter>
      </Seed>
    );
  },
  "home-empty": () => {
    asLoggedIn();
    return (
      <Seed entries={[[eventKeys.list, [] as EventRecord[]]]}>
        <MemoryRouter initialEntries={["/home"]}>
          <Phone><HomePage /></Phone>
        </MemoryRouter>
      </Seed>
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
  // 아래 셋은 useParams 로 :id 를 읽으므로 Routes 로 감싸야 한다 — MemoryRouter 만으로는 빈 params 다.
  segments: () => {
    asLoggedIn();
    return (
      <Seed entries={[[eventKeys.detail("ev-1"), MOCK_DETAIL]]}>
        <MemoryRouter initialEntries={["/admin/events/ev-1/segments"]}>
          <Routes>
            <Route path="/admin/events/:id/segments" element={<Phone><EventSegmentsPage /></Phone>} />
          </Routes>
        </MemoryRouter>
      </Seed>
    );
  },
  builder: () => {
    asLoggedIn();
    return (
      <Seed entries={[[eventKeys.detail("ev-1"), MOCK_DETAIL]]}>
        <MemoryRouter initialEntries={["/admin/events/ev-1/edit"]}>
          <Routes>
            <Route path="/admin/events/:id/edit" element={<Phone><EventBuilderPage /></Phone>} />
          </Routes>
        </MemoryRouter>
      </Seed>
    );
  },
  timeline: () => {
    asLoggedIn();
    return (
      <Seed entries={[[eventKeys.detail("ev-1"), MOCK_DETAIL]]}>
        <MemoryRouter initialEntries={["/event/ev-1/timeline"]}>
          <Routes>
            <Route path="/event/:id/timeline" element={<Phone><EventTimelinePage /></Phone>} />
          </Routes>
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
  return screen();
}
