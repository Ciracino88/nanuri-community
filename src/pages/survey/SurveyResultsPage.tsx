import { useEffect, useState } from "react";
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
          .select("answers")
          .eq("survey_id", id),
      ]);
      setSurvey(surveyData);
      setResponses((responseData ?? []).map((r) => ({ answers: r.answers })));
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading || !survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-300">
        불러오는 중...
      </div>
    );
  }

  const total = responses.length;

  const getMoodCounts = (itemIndex: number) =>
    MOOD_LEVELS.map((mood) => ({
      ...mood,
      count: responses.filter((r) => r.answers[itemIndex] === mood.value).length,
    }));

  const getTextAnswers = (itemIndex: number) =>
    responses
      .filter((r) => typeof r.answers[itemIndex] === "string" && (r.answers[itemIndex] as string).trim())
      .map((r) => r.answers[itemIndex] as string);

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
                <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-100">
                  {survey.items.map((item, i) => {
                    if (!item.isStar) return null;
                    const counts = getMoodCounts(i);
                    return (
                      <div key={i} className="p-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">{item.label}</p>
                        <div className="flex flex-col gap-2">
                          {counts.map((mood, mi) => (
                            <div key={mood.value} className="flex items-center gap-2.5">
                              <i className={`ti ${mood.icon} text-lg ${mood.color}`} aria-hidden="true" />
                              <span className="text-xs text-gray-400 w-10">{mood.label}</span>
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${BAR_COLORS[mi]}`}
                                  style={{ width: total > 0 ? `${Math.round((mood.count / total) * 100)}%` : "0%" }}
                                />
                              </div>
                              <span className="text-xs text-gray-400 w-6 text-right">{mood.count}</span>
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
                    {answers.map((text, j) => (
                      <div key={j} className="px-4 py-3">
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
