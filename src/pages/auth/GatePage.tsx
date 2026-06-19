import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function GatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGuest = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (!error) navigate("/guest/form");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-sm text-gray-400 mb-1">나누리 청년부</p>
          <h1 className="text-2xl font-semibold text-gray-800">비용 청구서 작성</h1>
          <p className="text-sm text-gray-400 mt-2">해당하는 항목을 선택해주세요</p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/member/login")}
            className="w-full py-3.5 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <span>👤</span> 나누리 멤버입니다
          </button>
          <button
            onClick={handleGuest}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-500 text-sm font-medium text-white hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><span className="animate-spin">⟳</span>연결 중...</> : <><span>🙋</span>외부 방문자입니다</>}
          </button>
        </div>
        <p className="text-center text-xs text-gray-300 mt-8">나누리 회계팀</p>
      </div>
    </div>
  );
}