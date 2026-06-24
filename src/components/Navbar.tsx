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
    <nav
      className="w-full border-b border-line-soft bg-card px-5 pb-3 flex items-center justify-between"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
    >
      <button
        onClick={() => navigate("/home")}
        className="flex items-center gap-2 hover:opacity-70 transition"
      >
        <div className="w-7 h-7 rounded-lg bg-sunken border border-line flex items-center justify-center">
          <i className="ti ti-seeding text-base text-fg-muted" aria-hidden="true" />
        </div>
        <span className="text-body font-medium text-fg-strong">나누리</span>
      </button>
      <div className="flex items-center gap-1">
        {isGuest ? (
          <button
            onClick={() => navigate("/member/login")}
            className="text-body text-info px-3 py-1.5 rounded-lg hover:bg-info-subtle transition"
          >
            교회 멤버이신가요?
          </button>
        ) : (
          <>
            <button
              onClick={onProfileEdit}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-fg-faint hover:bg-surface hover:text-fg transition"
              title={userName ? `${userName}님` : "프로필 수정"}
            >
              <i className="ti ti-user text-lg" aria-hidden="true" />
            </button>
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-fg-faint hover:bg-surface hover:text-danger transition"
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