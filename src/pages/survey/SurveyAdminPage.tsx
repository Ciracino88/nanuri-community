import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar";
import LoadingSpinner from "../../components/LoadingSpinner";
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
  template_id: string | null;
  title: string;
  image_url: string | null;
  place_name: string | null;
  items: { label: string; isStar: boolean }[];
  created_at: string;
  responseCount: number;
}

interface AdminData {
  templates: Template[];
  activeSurveys: ActiveSurvey[];
}

async function fetchAdminData(): Promise<AdminData> {
  const [{ data: tplData }, { data: surveyData }] = await Promise.all([
    supabase.from("survey_templates").select("*").order("created_at", { ascending: false }),
    supabase.from("surveys").select("*").eq("status", "active").order("created_at", { ascending: false }),
  ]);

  const surveys = surveyData ?? [];
  const activeSurveys = await Promise.all(
    surveys.map(async (s) => {
      const { count } = await supabase
        .from("survey_responses")
        .select("*", { count: "exact", head: true })
        .eq("survey_id", s.id);
      return { ...s, responseCount: count ?? 0 };
    })
  );

  return { templates: tplData ?? [], activeSurveys };
}

async function deleteR2Image(imageUrl: string) {
  await fetch(`${import.meta.env.VITE_CF_WORKER_URL}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ receiptUrl: imageUrl }),
  });
}

export default function SurveyAdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userProfile, signOut } = useAuthStore();

  const { data, isLoading: loading } = useQuery({
    queryKey: ["survey_admin"],
    queryFn: fetchAdminData,
  });
  const templates = data?.templates ?? [];
  const activeSurveys = data?.activeSurveys ?? [];

  useEffect(() => {
    const channel = supabase
      .channel("survey_admin_responses")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "survey_responses",
      }, (payload) => {
        const surveyId = (payload.new as { survey_id: string }).survey_id;
        queryClient.setQueryData(["survey_admin"], (old: AdminData | undefined) => {
          if (!old) return old;
          return {
            ...old,
            activeSurveys: old.activeSurveys.map((s) =>
              s.id === surveyId ? { ...s, responseCount: s.responseCount + 1 } : s
            ),
          };
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("survey_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["survey_admin"] }),
    onError: () => toast.error("템플릿 삭제에 실패했어요"),
  });

  const closeSurveyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("surveys").update({ status: "closed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["survey_admin"] }),
    onError: () => toast.error("설문 종료에 실패했어요"),
  });

  const deleteSurveyMutation = useMutation({
    mutationFn: async ({ id, imageUrl }: { id: string; imageUrl: string | null }) => {
      if (imageUrl) await deleteR2Image(imageUrl);
      const { error } = await supabase.from("surveys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["survey_admin"] }),
    onError: () => toast.error("설문 삭제에 실패했어요"),
  });

  const handleDelete = (id: string) => {
    if (!confirm("템플릿을 삭제할까요?")) return;
    deleteTemplateMutation.mutate(id);
  };

  const handleCloseSurvey = (id: string) => {
    if (!confirm("설문을 종료할까요?")) return;
    closeSurveyMutation.mutate(id);
  };

  const handleDeleteSurvey = (id: string, imageUrl: string | null) => {
    if (!confirm("설문을 삭제할까요? 응답 데이터도 모두 삭제됩니다.")) return;
    deleteSurveyMutation.mutate({ id, imageUrl });
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
          <LoadingSpinner />
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
                        {survey.place_name && (
                          <a
                            href={`https://map.kakao.com/link/search/${encodeURIComponent(survey.place_name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 mt-0.5 w-fit"
                          >
                            <i className="ti ti-map-pin text-xs text-blue-300" aria-hidden="true" />
                            <span className="text-xs text-blue-400 hover:underline">{survey.place_name}</span>
                          </a>
                        )}
                        <p className="text-xs text-blue-400 mt-0.5">
                          항목 {survey.items?.length ?? 0}개 · {formatDate(survey.created_at)} 배포 · 참여 {survey.responseCount}명
                        </p>
                      </div>
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-md font-medium">진행 중</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/admin/surveys/${survey.id}/results`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-blue-100 rounded-lg text-xs text-blue-500 hover:bg-blue-50 transition"
                      >
                        <i className="ti ti-chart-bar text-sm" aria-hidden="true" />
                        결과 보기
                      </button>
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
