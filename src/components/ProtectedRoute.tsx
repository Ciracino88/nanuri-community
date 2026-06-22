import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import LoadingScreen from "./LoadingScreen";

interface Props {
  children: React.ReactNode;
  memberOnly?: boolean;
  guestOnly?: boolean;
  setupPage?: boolean;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, memberOnly, guestOnly, setupPage, adminOnly }: Props) {
  const { user, isAnonymous, userProfile, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;

  if (!user) return <Navigate to="/" />;

  if (memberOnly && isAnonymous) return <Navigate to="/" />;
  if (guestOnly && !isAnonymous) return <Navigate to="/" />;

  if (adminOnly && userProfile?.role !== "admin") return <Navigate to="/member/form" />;

  // setupPage면 프로필 체크 스킵
  if (!setupPage && !adminOnly && memberOnly && !isAnonymous && (!userProfile || !userProfile.account_number || !userProfile.bank_name)) {
    return <Navigate to="/member/setup" />;
  }

  return <>{children}</>;
}