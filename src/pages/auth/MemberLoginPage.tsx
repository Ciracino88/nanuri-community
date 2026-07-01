import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
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

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" className="shrink-0">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 29 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 29 5 24 5 16.3 5 9.6 9 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5 0 9.5-1.9 12.9-5l-6-5.2C29.2 36.5 26.7 37.5 24 37.5c-5.2 0-9.6-3.5-11.2-8.2l-6.5 5C9.5 41 16.3 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6 5.2C41.4 36.5 44 31 44 25c0-1.3-.1-2.5-.4-3.5z" />
    </svg>
  );
}

export default function MemberLoginPage() {
  const navigate = useNavigate();
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
    <div className="min-h-dvh flex flex-col">
      {/* 뒤로 */}
      <div className="px-5 pt-6">
        <motion.button
          className="flex items-center justify-center rounded-full"
          style={{ width: 36, height: 36, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.88 }}
          onClick={() => navigate("/")}
          aria-label="뒤로"
        >
          <ChevronLeft size={18} color="#f0f2f8" />
        </motion.button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-10">
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
        >
          <h1 className="text-xl font-black" style={{ color: "#f0f2f8" }}>로그인</h1>
          <p className="text-xs text-center leading-relaxed" style={{ color: "#4a5568" }}>
            Google 계정으로 간편하게 로그인해요
          </p>
        </motion.div>

        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 28 }}
        >
          {shouldRedirectToBrowser ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl px-4 py-3.5 text-xs leading-relaxed" style={{ background: "rgba(255,179,71,0.12)", border: "1px solid rgba(255,179,71,0.25)", color: "#FFB347" }}>
                카카오톡 내부 브라우저에서는 Google 로그인이 제한돼요. 크롬 브라우저에서 열어주세요.
              </div>
              <motion.button
                className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                whileTap={{ scale: 0.97 }}
                onClick={openInChrome}
              >
                <span className="text-sm font-bold" style={{ color: "#f0f2f8" }}>크롬으로 열기</span>
              </motion.button>
            </div>
          ) : (
            <motion.button
              className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
              whileTap={{ scale: 0.97 }}
              onClick={handleGoogleLogin}
            >
              <GoogleLogo />
              <span className="text-sm font-bold" style={{ color: "#f0f2f8" }}>Google 계정으로 로그인</span>
            </motion.button>
          )}
        </motion.div>
      </div>

      <motion.p
        className="text-center text-xs pb-10 px-8"
        style={{ color: "#363d47" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        로그인하면 나누리 서비스 이용약관 및<br />개인정보 처리방침에 동의하는 것으로 간주돼요
      </motion.p>
    </div>
  );
}
