// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface Props {
  children: React.ReactNode;
  memberOnly?: boolean;
  guestOnly?: boolean;
  setupPage?: boolean;
}

export default function ProtectedRoute({ children, memberOnly, guestOnly, setupPage }: Props) {
  const { user, isAnonymous, userProfile, isLoading } = useAuthStore();

  if (isLoading) return <p className="text-center text-gray-400 py-10">로딩 중...</p>;

  if (!user) return <Navigate to="/" />;

  if (memberOnly && isAnonymous) return <Navigate to="/" />;
  if (guestOnly && !isAnonymous) return <Navigate to="/" />;

  // setupPage면 프로필 체크 스킵
  if (!setupPage && memberOnly && !isAnonymous && (!userProfile || !userProfile.account_number || !userProfile.bank_name)) {
    return <Navigate to="/member/setup" />;
  }

  return <>{children}</>;
}