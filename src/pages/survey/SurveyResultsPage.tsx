import { useEffect, useMemo, useState } from "react";
import LoadingScreen from "../../components/LoadingScreen";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuthStore } from "../../store/authStore";
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

const MOOD_LEVELS = [
  { value: 1, icon: "ti-mood-sad", label: "불만족", color: "text-red-400" },
  { value: 2, icon: "ti-mood-empty", label: "평범", color: "text-amber-400" },
  { value: 3, icon: "ti-mood-happy", label: "만족", color: "text-emerald-500" },
];

const BAR_COLORS = ["bg-red-400", "bg-amber-400", "bg-emerald-500"];

export default function SurveyResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile, signOut } = useAuthStore();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: surveyData }, { data: responseData }] = await Promise.all([
        supabase.from("surveys").select("id, title, place_name, items").eq("id", id).single(),
        supabase
          .from("survey_responses")
          .select("answers, nickname")
          .eq("survey_id", id),
      ]);
      setSurvey(surveyData);
      setResponses((responseData ?? []).map((r) => ({ answers: r.answers, nickname: r.nickname ?? null })));
      setLoading(false);
    };
    load();
  }, [id]);

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        userName={userProfile?.name}
        onLogout={signOut}
        onProfileEdit={() => navigate("/member/setup")}
      />

      <div className="max-w-lg mx-auto w-full p-5 flex flex-col gap-5">

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/surveys")}
            className="text-gray-300 hover:text-gray-500 transition"
          >
            <i className="ti ti-arrow-left text-lg" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-lg font-medium text-gray-800">{survey.title}</h1>
            {survey.place_name && (
              <a
                href={`https://map.kakao.com/link/search/${encodeURIComponent(survey.place_name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 mt-0.5 w-fit"
              >
                <i className="ti ti-map-pin text-xs text-gray-300" aria-hidden="true" />
                <span className="text-xs text-gray-400 hover:underline">{survey.place_name}</span>
              </a>
            )}
          </div>
        </div>

        {/* 요약 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400">전체 응답자</p>
            <p className="text-2xl font-medium text-gray-800 mt-1">{total}명</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400">설문 항목</p>
            <p className="text-2xl font-medium text-gray-800 mt-1">{survey.items.length}개</p>
          </div>
        </div>

        {total === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-6 text-center text-sm text-gray-300">
            아직 응답이 없습니다
          </div>
        ) : (
          <>
            {/* 만족도 항목 */}
            {survey.items.some((item) => item.isStar) && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-400 font-medium">만족도 항목</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {survey.items.map((item, i) => {
                    if (!item.isStar) return null;
                    const counts = getMoodCounts(i);
                    const max = Math.max(...counts.map((m) => m.count), 1);
                    return (
                      <div key={i} className="group aspect-square bg-white border border-gray-100 hover:border-gray-300 hover:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] rounded-xl p-3.5 flex flex-col items-center justify-between transition-all cursor-pointer">
                        <p className="text-sm font-medium text-gray-700 text-center leading-tight line-clamp-2">{item.label}</p>
                        <div className="flex items-end justify-center gap-2 w-full px-3" style={{ height: "72px" }}>
                          {counts.map((mood, mi) => (
                            <div key={mood.value} className="flex flex-col items-center gap-1 flex-1">
                              <span className="text-xs font-medium text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity h-3.5 leading-none">{mood.count}</span>
                              <div className="w-full bg-gray-100 rounded-t overflow-hidden flex flex-col justify-end" style={{ height: "56px" }}>
                                <div
                                  className={`w-full rounded-t transition-all group-hover:brightness-110 ${BAR_COLORS[mi]}`}
                                  style={{ height: `${Math.round((mood.count / max) * 100)}%` }}
                                />
                              </div>
                              <i className={`ti ${mood.icon} text-sm ${mood.color}`} aria-hidden="true" />
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
                  <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                  <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-100">
                    {answers.map(({ text, nickname }, j) => (
                      <div key={j} className="px-4 py-3 flex flex-col gap-1">
                        {nickname && (
                          <p className="text-xs text-gray-400">{nickname}</p>
                        )}
                        <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

      </div>
    </div>
  );
}
