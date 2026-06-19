import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Button from "../../components/ui/Button";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";

interface Survey {
  id: string;
  title: string;
  image_url: string | null;
  items: { label: string; isStar: boolean }[];
  status: string;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-3xl transition ${star <= (hovered || value) ? "text-yellow-400" : "text-gray-200"}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function SurveyResponsePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile, signOut, user } = useAuthStore();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: surveyData } = await supabase
        .from("surveys").select("*").eq("id", id).single();
      setSurvey(surveyData);

      if (user) {
        const { data: existing } = await supabase
          .from("survey_responses")
          .select("id")
          .eq("survey_id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (existing) setAlreadySubmitted(true);
      }
    };
    load();
  }, [id, user]);

  const handleSubmit = async () => {
    if (!survey || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.from("survey_responses").insert({
        survey_id: survey.id,
        user_id: user.id,
        answers,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "제출에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = survey?.items.every((item, i) =>
    item.isStar ? (answers[i] as number) > 0 : true
  );

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-300">
        불러오는 중...
      </div>
    );
  }

  if (survey.status === "closed") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar userName={userProfile?.name} onLogout={signOut} onHome={() => navigate("/home")} onProfileEdit={() => navigate("/member/setup")} />
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6">
          <p className="text-4xl">🔒</p>
          <p className="text-base font-medium text-gray-600">종료된 설문입니다</p>
        </div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar userName={userProfile?.name} onLogout={signOut} onHome={() => navigate("/home")} onProfileEdit={() => navigate("/member/setup")} />
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6">
          <p className="text-4xl">✅</p>
          <p className="text-base font-medium text-gray-600">이미 참여한 설문입니다</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar userName={userProfile?.name} onLogout={signOut} onHome={() => navigate("/home")} onProfileEdit={() => navigate("/member/setup")} />
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6">
          <p className="text-4xl">🎉</p>
          <p className="text-base font-medium text-gray-600">참여해주셔서 감사합니다!</p>
          <button onClick={() => navigate("/home")} className="text-sm text-blue-500 mt-2">홈으로 돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar userName={userProfile?.name} onLogout={signOut} onHome={() => navigate("/home")} onProfileEdit={() => navigate("/member/setup")} />

      <div className="max-w-lg mx-auto w-full flex flex-col">

        {/* 장소 사진 */}
        {survey.image_url ? (
          <div className="w-full aspect-square">
            <img src={survey.image_url} alt="장소 사진" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
            <i className="ti ti-photo text-4xl text-gray-300" aria-hidden="true" />
          </div>
        )}

        <div className="p-5 flex flex-col gap-6">

          <div>
            <h1 className="text-lg font-medium text-gray-800">{survey.title}</h1>
            <p className="text-sm text-gray-400 mt-1">아래 항목을 평가해주세요</p>
          </div>

          <div className="flex flex-col divide-y divide-gray-100">
            {survey.items.map((item, i) => (
              <div key={i} className="py-4 flex flex-col gap-2.5">
                <label className="text-sm font-medium text-gray-500">{item.label}</label>
                {item.isStar ? (
                  <StarRating
                    value={(answers[i] as number) ?? 0}
                    onChange={(v) => setAnswers((prev) => ({ ...prev, [i]: v }))}
                  />
                ) : (
                  <textarea
                    rows={3}
                    placeholder="자유롭게 의견을 작성해주세요"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <Button onClick={handleSubmit} loading={submitting} disabled={!isValid}>
            제출하기
          </Button>

        </div>
      </div>
    </div>
  );
}
