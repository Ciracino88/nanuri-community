import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import Button from "../../components/ui/Button";
import MoodRating from "../../components/ui/MoodRating";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { useFormSubmit } from "../../hooks/useFormSubmit";
import SuccessScreen from "../../components/SuccessScreen";
import LoadingScreen from "../../components/LoadingScreen";
import { generateNickname } from "../../lib/generateNickname";

interface Survey {
  id: string;
  title: string;
  image_url: string | null;
  place_name: string | null;
  items: { label: string; isStar: boolean }[];
  status: string;
}

export default function SurveyResponsePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [existingResponseId, setExistingResponseId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { submitting, success: submitted, error, submit } = useFormSubmit();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: surveyData } = await supabase
        .from("surveys").select("*").eq("id", id).single();
      setSurvey(surveyData);

      if (user) {
        const { data: existing } = await supabase
          .from("survey_responses")
          .select("id, answers")
          .eq("survey_id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (existing) setExistingResponseId(existing.id);
      }
    };
    load();
  }, [id, user]);

  const handleSubmit = async () => {
    if (!survey) return;
    await submit(async () => {
      if (existingResponseId) {
        const { error } = await supabase
          .from("survey_responses")
          .update({ answers })
          .eq("id", existingResponseId);
        if (error) throw error;
      } else {
        const nickname = generateNickname();
        const { error } = await supabase.from("survey_responses").insert({
          survey_id: survey.id,
          user_id: user?.id ?? null,
          nickname,
          answers,
        });
        if (error) throw error;
      }
    });
  };

  const handleStartEdit = async () => {
    if (!existingResponseId) return;
    const { data } = await supabase
      .from("survey_responses")
      .select("answers")
      .eq("id", existingResponseId)
      .single();
    if (data) setAnswers(data.answers);
    setIsEditing(true);
  };

  const isValid = survey?.items.every((item, i) =>
    item.isStar ? (answers[i] as number) > 0 : true
  );

  if (!survey) {
    return (
      <LoadingScreen />
    );
  }

  if (survey.status === "closed") {
    return (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6">
          <p className="text-4xl">🔒</p>
          <p className="text-emphasis font-medium text-fg">종료된 설문입니다</p>
        </div>
    );
  }

  if (existingResponseId && !isEditing) {
    return (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6">
          <p className="text-4xl">✅</p>
          <p className="text-emphasis font-medium text-fg">이미 참여한 설문입니다</p>
          <button
            onClick={handleStartEdit}
            className="text-body text-info mt-2"
          >
            응답 수정하기
          </button>
        </div>
    );
  }

  if (submitted) {
    return (
      <SuccessScreen
        message={isEditing ? "응답이 수정되었습니다" : "참여해주셔서 감사합니다"}
        buttonText="홈으로 돌아가기"
        onButtonClick={() => navigate("/home")}
      />
    );
  }

  return (
    <PageContainer width="default">

          <div>
            <h1 className="text-heading font-medium text-fg-strong">{survey.title}</h1>
            <p className="text-body text-fg-faint mt-1">
              {isEditing ? "응답을 수정하고 다시 제출해주세요" : "아래 항목을 평가해주세요"}
            </p>
          </div>

          <div className="flex flex-col divide-y divide-line-soft">
            {survey.items.map((item, i) => (
              <div key={i} className="py-4 flex flex-col gap-2.5">
                <label className="text-body font-medium text-fg-muted">{item.label}</label>
                {item.isStar ? (
                  <MoodRating
                    value={(answers[i] as number) ?? 0}
                    onChange={(v) => setAnswers((prev) => ({ ...prev, [i]: v }))}
                  />
                ) : (
                  <textarea
                    rows={3}
                    placeholder="자유롭게 의견을 작성해주세요"
                    value={(answers[i] as string) ?? ""}
                    className="w-full px-3 py-2.5 text-body border border-line rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-info-soft focus:border-info transition"
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>

          {error && <p className="text-caption text-danger text-center">{error}</p>}

          <Button onClick={handleSubmit} loading={submitting} disabled={!isValid}>
            {isEditing ? "수정 완료" : "제출하기"}
          </Button>

    </PageContainer>
  );
}
