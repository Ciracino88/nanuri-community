import { supabase } from "../../lib/supabase";

export default function MemberLoginPage() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/home` },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-sm text-gray-400 mb-1">나누리 청년부</p>
          <h1 className="text-2xl font-semibold text-gray-800">로그인</h1>
        </div>
        <button
          onClick={handleGoogleLogin}
          className="w-full py-3.5 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
        >
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
          Google로 로그인
        </button>
      </div>
    </div>
  );
}