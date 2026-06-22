// src/components/Navbar.tsx
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface Props {
  userName?: string;
  onLogout?: () => void;
  onProfileEdit?: () => void;
  isGuest?: boolean;
}

export default function Navbar({ userName, onLogout, onProfileEdit, isGuest }: Props) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout?.();
  };

  return (
    <nav className="w-full border-b border-gray-100 bg-white px-5 py-3 flex items-center justify-between">
      <button
        onClick={() => navigate("/home")}
        className="text-sm font-medium text-gray-800 hover:text-gray-600 transition"
      >
        나누리
      </button>
      <div className="flex items-center gap-1">
        {isGuest ? (
          <button
            onClick={() => navigate("/member/login")}
            className="text-sm text-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
          >
            교회 멤버이신가요?
          </button>
        ) : (
          <>
            <button
              onClick={onProfileEdit}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition"
              title={userName ? `${userName}님` : "프로필 수정"}
            >
              <i className="ti ti-user text-lg" aria-hidden="true" />
            </button>
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-red-400 transition"
              title="로그아웃"
            >
              <i className="ti ti-logout text-lg" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </nav>
  );
}