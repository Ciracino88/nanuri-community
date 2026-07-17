// src/router/index.tsx
import { createBrowserRouter } from "react-router-dom";
import GatePage from "../pages/auth/GatePage";
import MemberLoginPage from "../pages/auth/MemberLoginPage";
import MemberProfileSetupPage from "../pages/MemberProfileSetupPage";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../components/Layout";
import HomePage from "../pages/HomePage";
import BillFormPage from "../pages/bill/BillFormPage";
import ProfilePage from "../pages/ProfilePage";
import WorshipSchedulePage from "../pages/worship/WorshipSchedulePage";
import GatheringListPage from "../pages/gathering/GatheringListPage";
import GatheringDetailPage from "../pages/gathering/GatheringDetailPage";
import GatheringFormPage from "../pages/gathering/GatheringFormPage";
import AdminPage from "../pages/admin/AdminPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <GatePage />,
  },
  {
    path: "/member/login",
    element: <MemberLoginPage />,
  },
  {
    element: (
      <ProtectedRoute memberOnly>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/home", element: <HomePage /> },
      { path: "/member/bill", element: <BillFormPage /> },
      { path: "/gatherings", element: <GatheringListPage /> },
      // /new 가 /:id 보다 먼저 와야 한다 — 순서가 바뀌면 "new" 가 id 로 잡힌다.
      { path: "/gatherings/new", element: <GatheringFormPage /> },
      { path: "/gatherings/:id", element: <GatheringDetailPage /> },
      { path: "/profile", element: <ProfilePage /> },
      { path: "/worship", element: <WorshipSchedulePage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute memberOnly setupPage>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/member/setup", element: <MemberProfileSetupPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute memberOnly adminOnly>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/admin", element: <AdminPage /> },
    ],
  },
]);
