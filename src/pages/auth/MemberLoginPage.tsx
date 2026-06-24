import { Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import LoadingScreen from "../../components/LoadingScreen";

const isAndroid = /android/i.test(navigator.userAgent);
const isInAppBrowser = /KAKAOTALK|Instagram|NAVER|FB_IAB|FBAN|FBAV/i.test(navigator.userAgent);
const shouldRedirectToBrowser = isAndroid && isInAppBrowser;

function openInChrome() {
  const url = window.location.href;
  window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
}

export default function MemberLoginPage() {
  const { user, isAnonymous, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (user && !isAnonymous) return <Navigate to="/home" replace />;

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

        {shouldRedirectToBrowser ? (
          <div className="flex flex-col gap-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3.5 text-sm text-amber-700 leading-relaxed">
              카카오톡 내부 브라우저에서는 Google 로그인이 제한돼요. 크롬 브라우저에서 열어주세요.
            </div>
            <button
              onClick={openInChrome}
              className="w-full py-3.5 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <i className="ti ti-brand-chrome text-lg" aria-hidden="true" />
              크롬으로 열기
            </button>
          </div>
        ) : (
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3.5 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
            Google로 로그인
          </button>
        )}
      </div>
    </div>
  );
}