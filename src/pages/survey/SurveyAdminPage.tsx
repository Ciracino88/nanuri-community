import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";

interface Template {
  id: string;
  title: string;
  items: { label: string; isStar: boolean }[];
  created_at: string;
}

interface ActiveSurvey {
  id: string;
  template_id: string;
  title: string;
  image_url: string | null;
  items: { label: string; isStar: boolean }[];
  created_at: string;
  responseCount: number;
}

export default function SurveyAdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, signOut } = useAuthStore();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeSurveys, setActiveSurveys] = useState<ActiveSurvey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: tplData }, { data: surveyData }] = await Promise.all([
      supabase.from("survey_templates").select("*").order("created_at", { ascending: false }),
      supabase.from("surveys").select("*").eq("status", "active").order("created_at", { ascending: false }),
    ]);
    setTemplates(tplData ?? []);

    const surveys = surveyData ?? [];
    const surveysWithCount = await Promise.all(
      surveys.map(async (s) => {
        const { count } = await supabase
          .from("survey_responses")
          .select("*", { count: "exact", head: true })
          .eq("survey_id", s.id);
        return { ...s, responseCount: count ?? 0 };
      })
    );
    setActiveSurveys(surveysWithCount);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [location.key]);

  useEffect(() => {
    if (activeSurveys.length === 0) return;
    const channels = activeSurveys.map((survey) =>
      supabase
        .channel(`survey_responses_${survey.id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "survey_responses",
          filter: `survey_id=eq.${survey.id}`,
        }, () => {
          setActiveSurveys((prev) =>
            prev.map((s) => s.id === survey.id ? { ...s, responseCount: s.responseCount + 1 } : s)
          );
        })
        .subscribe()
    );
    return () => { channels.forEach((ch) => supabase.removeChannel(ch)); };
  }, [activeSurveys.length]);

  const handleDelete = async (id: string) => {
    if (!confirm("템플릿을 삭제할까요?")) return;
    await supabase.from("survey_templates").delete().eq("id", id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCloseSurvey = async (id: string) => {
    if (!confirm("설문을 종료할까요?")) return;
    await supabase.from("surveys").update({ status: "closed" }).eq("id", id);
    setActiveSurveys((prev) => prev.filter((s) => s.id !== id));
  };

  const deleteR2Image = async (imageUrl: string) => {
    await fetch(`${import.meta.env.VITE_CF_WORKER_URL}/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptUrl: imageUrl }),
    });
  };

  const handleDeleteSurvey = async (id: string, imageUrl: string | null) => {
    if (!confirm("설문을 삭제할까요? 응답 데이터도 모두 삭제됩니다.")) return;
    if (imageUrl) await deleteR2Image(imageUrl);
    await supabase.from("surveys").delete().eq("id", id);
    setActiveSurveys((prev) => prev.filter((s) => s.id !== id));
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        userName={userProfile?.name}
        onLogout={signOut}

        onProfileEdit={() => navigate("/member/setup")}
      />

      <div className="max-w-lg mx-auto w-full p-5 flex flex-col gap-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-gray-800">설문 관리</h1>
            <p className="text-sm text-gray-400 mt-0.5">설문을 작성하고 배포하세요</p>
          </div>
          <button
            onClick={() => navigate("/admin/surveys/new")}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition"
          >
            <i className="ti ti-plus text-sm" aria-hidden="true" />
            새 설문
          </button>
        </div>

        {loading ? (
          <div className="text-center text-sm text-gray-300 py-10">불러오는 중...</div>
        ) : (
          <>
            {/* 진행 중인 설문 */}
            <div className="flex flex-col gap-2.5">
              <p className="text-xs text-gray-400 font-medium">
                진행 중인 설문 {activeSurveys.length > 0 && `(${activeSurveys.length}개)`}
              </p>

              {activeSurveys.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-xl p-4 text-center text-sm text-gray-300">
                  진행 중인 설문이 없습니다
                </div>
              ) : (
                activeSurveys.map((survey) => (
                  <div key={survey.id} className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-blue-800">{survey.title}</p>
                        <p className="text-xs text-blue-400 mt-0.5">
                          항목 {survey.items?.length ?? 0}개 · {formatDate(survey.created_at)} 배포 · 참여 {survey.responseCount}명
                        </p>
                      </div>
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-md font-medium">진행 중</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/survey/${survey.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-blue-100 rounded-lg text-xs text-blue-500 hover:bg-blue-50 transition"
                      >
                        <i className="ti ti-copy text-sm" aria-hidden="true" />
                        링크 복사
                      </button>
                      <button
                        onClick={() => handleCloseSurvey(survey.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-blue-100 rounded-lg text-xs text-red-400 hover:bg-red-50 transition"
                      >
                        <i className="ti ti-player-stop text-sm" aria-hidden="true" />
                        설문 닫기
                      </button>
                      <button
                        onClick={() => handleDeleteSurvey(survey.id, survey.image_url)}
                        className="px-3 py-2 bg-white border border-blue-100 rounded-lg text-xs text-gray-300 hover:text-red-400 hover:border-red-100 transition"
                      >
                        <i className="ti ti-trash text-sm" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 저장된 템플릿 */}
            <div className="flex flex-col gap-2.5">
              <p className="text-xs text-gray-400 font-medium">저장된 템플릿</p>

              {templates.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-xl p-4 text-center text-sm text-gray-300">
                  저장된 템플릿이 없습니다
                </div>
              ) : (
                templates.map((template) => (
                  <div key={template.id} className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-800">{template.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        항목 {template.items?.length ?? 0}개 · {formatDate(template.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {(() => {
                        const isDeployed = activeSurveys.some((s) => s.template_id === template.id);
                        return (
                          <button
                            onClick={() => !isDeployed && navigate(`/admin/surveys/${template.id}/deploy`)}
                            disabled={isDeployed}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 rounded-lg text-xs text-blue-500 font-medium hover:bg-blue-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <i className="ti ti-send text-sm" aria-hidden="true" />
                            {isDeployed ? "배포 중" : "배포하기"}
                          </button>
                        );
                      })()}
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="px-3 py-2 border border-gray-100 rounded-lg text-xs text-gray-300 hover:text-red-400 hover:border-red-100 transition"
                      >
                        <i className="ti ti-trash text-sm" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
