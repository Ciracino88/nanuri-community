import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import Navbar from "../components/Navbar";
import { useActiveSurveys } from "../hooks/useActiveSurveys";
import { supabase } from "../lib/supabase";

interface MenuCard {
  icon: string;
  title: string;
  description: string;
  path: string;
  adminOnly?: boolean;
}

const MENU_CARDS: MenuCard[] = [
  { icon: "ti-receipt", title: "청구서 제출", description: "비용 영수증 제출", path: "/member/form" },
  { icon: "ti-map-pin", title: "장소 피드백", description: "사진으로 위치 평가", path: "/location-feedback" },
];

const ADMIN_CARDS: MenuCard[] = [
  { icon: "ti-chart-bar", title: "회계 보고서", description: "지출 내역 조회", path: "/accounting" },
  { icon: "ti-clipboard-list", title: "설문 관리", description: "설문 작성 및 배포", path: "/admin/surveys" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { userProfile, signOut, user } = useAuthStore();
  const isAdmin = userProfile?.role === "admin";
  const { surveys } = useActiveSurveys();
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    supabase.from("survey_responses").select("survey_id").eq("user_id", user.id)
      .then(({ data }) => setRespondedIds(new Set((data ?? []).map((r: { survey_id: string }) => r.survey_id))));
  }, [user]);

  const unrespondedCount = surveys.filter((s) => !respondedIds.has(s.id)).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        userName={userProfile?.name}
        onLogout={signOut}

        onProfileEdit={() => navigate("/member/setup")}
      />

      <div className="max-w-lg mx-auto w-full p-5 flex flex-col gap-5">

        {unrespondedCount > 0 && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-500 font-medium mb-0.5">진행 중인 설문</p>
              <p className="text-sm font-medium text-blue-800">참여 가능한 설문이 {unrespondedCount}개 있습니다</p>
            </div>
            <button
              onClick={() => navigate("/surveys")}
              className="text-sm text-blue-500 font-medium whitespace-nowrap ml-3"
            >
              보러가기 →
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-400 font-medium">메뉴</p>
          <div className="grid grid-cols-2 gap-3">
            {MENU_CARDS.map((card) => (
              <button
                key={card.path}
                onClick={() => navigate(card.path)}
                className="bg-white rounded-xl border border-gray-100 p-4 text-left hover:bg-gray-50 transition"
              >
                <i className={`ti ${card.icon} text-2xl text-gray-400 mb-2.5 block`} aria-hidden="true" />
                <p className="text-sm font-medium text-gray-800 mb-0.5">{card.title}</p>
                <p className="text-xs text-gray-400">{card.description}</p>
              </button>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-400 font-medium">관리자</p>
            <div className="grid grid-cols-2 gap-3">
              {ADMIN_CARDS.map((card) => (
                <button
                  key={card.path}
                  onClick={() => navigate(card.path)}
                  className="bg-white rounded-xl border border-gray-100 p-4 text-left hover:bg-gray-50 transition"
                >
                  <i className={`ti ${card.icon} text-2xl text-gray-400 mb-2.5 block`} aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-800 mb-0.5">{card.title}</p>
                  <p className="text-xs text-gray-400">{card.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
