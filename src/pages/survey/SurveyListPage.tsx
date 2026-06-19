import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { useActiveSurveys } from "../../hooks/useActiveSurveys";

export default function SurveyListPage() {
  const navigate = useNavigate();
  const { userProfile, signOut, user } = useAuthStore();
  const { surveys, loading } = useActiveSurveys();
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    supabase.from("survey_responses").select("survey_id").eq("user_id", user.id)
      .then(({ data }) => setRespondedIds(new Set((data ?? []).map((r: { survey_id: string }) => r.survey_id))));
  }, [user]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        userName={userProfile?.name}
        onLogout={signOut}

        onProfileEdit={() => navigate("/member/setup")}
      />

      <div className="max-w-lg mx-auto w-full p-5 flex flex-col gap-4">

        <div>
          <h1 className="text-lg font-medium text-gray-800">참여 가능한 설문</h1>
          <p className="text-sm text-gray-400 mt-0.5">아래 설문에 참여해주세요</p>
        </div>

        {loading ? (
          <div className="text-center text-sm text-gray-300 py-10">불러오는 중...</div>
        ) : surveys.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-6 text-center text-sm text-gray-300">
            현재 진행 중인 설문이 없습니다
          </div>
        ) : (
          surveys.map((survey) => {
            const responded = respondedIds.has(survey.id);
            return (
              <div key={survey.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                {survey.image_url && (
                  <div className="w-full aspect-video">
                    <img src={survey.image_url} alt="장소 사진" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{survey.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">항목 {survey.items?.length ?? 0}개 · {formatDate(survey.created_at)}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/survey/${survey.id}`)}
                    className={`text-sm font-medium whitespace-nowrap ml-3 ${responded ? "text-gray-300" : "text-blue-500"}`}
                  >
                    {responded ? "수정하기 →" : "참여하기 →"}
                  </button>
                </div>
              </div>
            );
          })
        )}

      </div>
    </div>
  );
}
