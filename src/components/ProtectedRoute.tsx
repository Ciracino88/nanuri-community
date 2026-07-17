import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import LoadingScreen from "./LoadingScreen";

interface Props {
  children: React.ReactNode;
  memberOnly?: boolean;
  setupPage?: boolean;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, memberOnly, setupPage, adminOnly }: Props) {
  const { user, isAnonymous, userProfile, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;

  if (!user) return <Navigate to="/" />;

  if (memberOnly && isAnonymous) return <Navigate to="/" />;

  if (adminOnly && userProfile?.role !== "admin") return <Navigate to="/gatherings" />;

  // setupPage면 프로필 체크 스킵 (필수: 이름 / 팀은 기본값 보장)
  if (!setupPage && !adminOnly && memberOnly && !isAnonymous && (!userProfile || !userProfile.name)) {
    return <Navigate to="/member/setup" />;
  }

  return <>{children}</>;
}