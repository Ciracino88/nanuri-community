// src/components/Navbar.tsx
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

interface Props {
  userName?: string;
  onLogout?: () => void;
  onProfileEdit?: () => void;
  onHome?: () => void;
  isGuest?: boolean;
}

export default function Navbar({ userName, onLogout, onProfileEdit, onHome, isGuest }: Props) {
  const navigate = useNavigate();
  const { userProfile } = useAuthStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout?.();
  };

  return (
    <nav className="w-full border-b border-gray-100 bg-white px-4 py-3 flex items-center justify-between">
      <button
        onClick={onHome}
        className="text-sm font-medium text-gray-700 hover:text-gray-900 transition"
      >
        나누리
      </button>
      <div className="flex items-center gap-2">
        {isGuest ? (
          <button
            onClick={() => navigate("/member/login")}
            className="text-sm text-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
          >
            교회 멤버이신가요?
          </button>
        ) : (
          <>
            {userProfile?.role === "admin" && (
              <button
                onClick={() => navigate("/accounting")}
                className="text-sm text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
              >
                회계 보고서
              </button>
            )}
            <button
              onClick={() => navigate("/location-feedback")}
              className="text-sm text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
            >
              장소 피드백
            </button>
            <button
              onClick={onProfileEdit}
              className="text-sm text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
            >
              {userName ? `${userName}님` : "프로필 수정"}
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              로그아웃
            </button>
          </>
        )}
      </div>
    </nav>
  );
}