import { useNavigate, Navigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import LoadingScreen from "../../components/LoadingScreen";

const FEATURES = [
  { icon: "ti-credit-card", label: "청구서 제출" },
  { icon: "ti-chart-bar", label: "설문 참여" },
  { icon: "ti-salad", label: "메뉴 종합" },
];

export default function GatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { user, isAnonymous, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (user && !isAnonymous) return <Navigate to="/home" replace />;

  const handleGuest = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (!error) navigate("/guest/form");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8 animate-[fadeUp_0.5s_ease_both]">

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center animate-[float_3s_ease-in-out_infinite]">
            <i className="ti ti-seeding text-3xl text-gray-500" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1.5">나누리 청년부</p>
            <h1 className="text-2xl font-medium text-gray-800 mb-2.5 leading-snug">
              우리들의 작은<br />커뮤니티 공간
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              비용 청구부터 설문, 메뉴 종합까지<br />나누리 활동에 필요한 것들을 모았어요
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {FEATURES.map((f, i) => (
            <span
              key={f.label}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-full text-xs text-gray-500"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <i className={`ti ${f.icon} text-sm`} aria-hidden="true" />
              {f.label}
            </span>
          ))}
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => navigate("/member/login")}
            className="w-full py-3.5 px-4 rounded-xl bg-gray-800 text-sm font-medium text-white hover:bg-gray-700 transition flex items-center justify-center gap-2"
          >
            <i className="ti ti-user text-base" aria-hidden="true" />
            나누리 멤버입니다
          </button>
          <button
            onClick={handleGuest}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><i className="ti ti-loader-2 text-base animate-spin" aria-hidden="true" />연결 중...</>
            ) : (
              <><i className="ti ti-user-question text-base" aria-hidden="true" />외부 방문자입니다</>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-300">나누리 회계팀</p>

      </div>
    </div>
  );
}
