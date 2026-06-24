import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuthStore } from "../store/authStore";

export default function AppShell() {
  const navigate = useNavigate();
  const { userProfile, signOut } = useAuthStore();

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar
        userName={userProfile?.name}
        onLogout={async () => { await signOut(); navigate("/"); }}
        onProfileEdit={() => navigate("/member/setup")}
      />
      <Outlet />
    </div>
  );
}
