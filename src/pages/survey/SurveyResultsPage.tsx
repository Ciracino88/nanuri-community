import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import LoadingScreen from "../../components/LoadingScreen";
import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import { supabase } from "../../lib/supabase";

interface Survey {
  id: string;
  title: string;
  place_name: string | null;
  items: { label: string; isStar: boolean }[];
}

interface Response {
  answers: Record<string, number | string>;
  nickname: string | null;
}

interface ResultsData {
  survey: Survey | null;
  responses: Response[];
}

async function fetchResults(id: string): Promise<ResultsData> {
  const [{ data: surveyData }, { data: responseData }] = await Promise.all([
    supabase.from("surveys").select("id, title, place_name, items").eq("id", id).single(),
    supabase.from("survey_responses").select("answers, nickname").eq("survey_id", id),
  ]);
  return {
    survey: surveyData,
    responses: (responseData ?? []).map((r) => ({ answers: r.answers, nickname: r.nickname ?? null })),
  };
}

const MOOD_LEVELS = [
  { value: 1, icon: "ti-mood-sad", label: "불만족", color: "text-danger" },
  { value: 2, icon: "ti-mood-empty", label: "평범", color: "text-warning" },
  { value: 3, icon: "ti-mood-happy", label: "만족", color: "text-success" },
];

const BAR_COLORS = ["bg-danger", "bg-warning", "bg-success"];

export default function SurveyResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: ["survey_results", id],
    queryFn: () => fetchResults(id!),
    enabled: !!id,
  });
  const survey = data?.survey ?? null;
  const responses = data?.responses ?? [];

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`survey_results_${id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "survey_responses",
      }, (payload) => {
        const row = (payload.new ?? payload.old) as { survey_id?: string };
        if (row?.survey_id === id) {
          queryClient.invalidateQueries({ queryKey: ["survey_results", id] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);

  const getMoodCounts = useMemo(() => (itemIndex: number) =>
    MOOD_LEVELS.map((mood) => ({
      ...mood,
      count: responses.filter((r) => r.answers[itemIndex] === mood.value).length,
    })), [responses]);

  const getTextAnswers = useMemo(() => (itemIndex: number) =>
    responses
      .filter((r) => typeof r.answers[itemIndex] === "string" && (r.answers[itemIndex] as string).trim())
      .map((r) => ({ text: r.answers[itemIndex] as string, nickname: r.nickname })),
    [responses]);

  if (loading || !survey) {
    return <LoadingScreen />;
  }

  const total = responses.length;

  return (
    <PageContainer width="default">

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/surveys")}
            className="text-fg-faint hover:text-fg-muted transition"
          >
            <i className="ti ti-arrow-left text-heading" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-heading font-medium text-fg-strong">{survey.title}</h1>
            {survey.place_name && (
              <a
                href={`https://map.kakao.com/link/search/${encodeURIComponent(survey.place_name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 mt-0.5 w-fit"
              >
                <i className="ti ti-map-pin text-caption text-fg-faint" aria-hidden="true" />
                <span className="text-caption text-fg-faint hover:underline">{survey.place_name}</span>
              </a>
            )}
          </div>
        </div>

        {/* 요약 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-line-soft rounded-xl px-4 py-3">
            <p className="text-caption text-fg-faint">전체 응답자</p>
            <p className="text-display font-medium text-fg-strong mt-1">{total}명</p>
          </div>
          <div className="bg-card border border-line-soft rounded-xl px-4 py-3">
            <p className="text-caption text-fg-faint">설문 항목</p>
            <p className="text-display font-medium text-fg-strong mt-1">{survey.items.length}개</p>
          </div>
        </div>

        {total === 0 ? (
          <div className="bg-card border border-line-soft rounded-xl p-6 text-center text-body text-fg-faint">
            아직 응답이 없습니다
          </div>
        ) : (
          <>
            {/* 만족도 항목 */}
            {survey.items.some((item) => item.isStar) && (
              <div className="flex flex-col gap-2">
                <p className="text-caption text-fg-faint font-medium">만족도 항목</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {survey.items.map((item, i) => {
                    if (!item.isStar) return null;
                    const counts = getMoodCounts(i);
                    const max = Math.max(...counts.map((m) => m.count), 1);
                    return (
                      <div key={i} className="group aspect-square bg-card border border-line-soft hover:border-line-strong hover:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] rounded-xl p-3.5 flex flex-col items-center justify-between transition-all cursor-pointer">
                        <p className="text-body font-medium text-fg text-center leading-tight line-clamp-2">{item.label}</p>
                        <div className="flex items-end justify-center gap-2 w-full px-3" style={{ height: "72px" }}>
                          {counts.map((mood, mi) => (
                            <div key={mood.value} className="flex flex-col items-center gap-1 flex-1">
                              <span className="text-caption font-medium text-fg-faint opacity-0 group-hover:opacity-100 transition-opacity h-3.5 leading-none">{mood.count}</span>
                              <div className="w-full bg-sunken rounded-t overflow-hidden flex flex-col justify-end" style={{ height: "56px" }}>
                                <div
                                  className={`w-full rounded-t transition-all group-hover:brightness-110 ${BAR_COLORS[mi]}`}
                                  style={{ height: `${Math.round((mood.count / max) * 100)}%` }}
                                />
                              </div>
                              <i className={`ti ${mood.icon} text-body ${mood.color}`} aria-hidden="true" />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 텍스트 항목 */}
            {survey.items.map((item, i) => {
              if (item.isStar) return null;
              const answers = getTextAnswers(i);
              if (answers.length === 0) return null;
              return (
                <div key={i} className="flex flex-col gap-2">
                  <p className="text-caption text-fg-faint font-medium">{item.label}</p>
                  <div className="bg-card border border-line-soft rounded-xl divide-y divide-line-soft">
                    {answers.map(({ text, nickname }, j) => (
                      <div key={j} className="px-4 py-3 flex flex-col gap-1">
                        {nickname && (
                          <p className="text-caption text-fg-faint">{nickname}</p>
                        )}
                        <p className="text-body text-fg leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

    </PageContainer>
  );
}
