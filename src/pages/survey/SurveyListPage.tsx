import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import PageContainer from "../../components/PageContainer";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuthStore } from "../../store/authStore";
import { useActiveSurveys } from "../../hooks/useActiveSurveys";
import { useRespondedIds } from "../../hooks/useRespondedIds";

export default function SurveyListPage() {
  const navigate = useNavigate();
  const { userProfile, signOut, user } = useAuthStore();
  const { surveys, loading } = useActiveSurveys();
  const respondedIds = useRespondedIds(user?.id);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar
        userName={userProfile?.name}
        onLogout={signOut}

        onProfileEdit={() => navigate("/member/setup")}
      />

      <PageContainer width="default">

        <div>
          <h1 className="text-heading font-medium text-fg-strong">참여 가능한 설문</h1>
          <p className="text-body text-fg-faint mt-0.5">아래 설문에 참여해주세요</p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : surveys.length === 0 ? (
          <div className="bg-card border border-line-soft rounded-xl p-6 text-center text-body text-fg-faint">
            현재 진행 중인 설문이 없습니다
          </div>
        ) : (
          surveys.map((survey) => {
            const responded = respondedIds.has(survey.id);
            return (
              <div key={survey.id} className="bg-card border border-line-soft rounded-xl overflow-hidden">
                {survey.image_url && (
                  <div className="w-full aspect-video">
                    <img src={survey.image_url} alt="장소 사진" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-body font-medium text-fg-strong">{survey.title}</p>
                    {survey.place_name && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <i className="ti ti-map-pin text-caption text-fg-faint" aria-hidden="true" />
                        <p className="text-caption text-fg-faint">{survey.place_name}</p>
                      </div>
                    )}
                    <p className="text-caption text-fg-faint mt-0.5">항목 {survey.items?.length ?? 0}개 · {formatDate(survey.created_at)}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/survey/${survey.id}`)}
                    className={`text-body font-medium whitespace-nowrap ml-3 ${responded ? "text-fg-faint" : "text-info"}`}
                  >
                    {responded ? "수정하기 →" : "참여하기 →"}
                  </button>
                </div>
              </div>
            );
          })
        )}

      </PageContainer>
    </div>
  );
}
