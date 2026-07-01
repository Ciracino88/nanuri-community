// src/router/index.tsx
import { createBrowserRouter } from "react-router-dom";
import GatePage from "../pages/auth/GatePage";
import MemberLoginPage from "../pages/auth/MemberLoginPage";
import MemberProfileSetupPage from "../pages/MemberProfileSetupPage";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../components/Layout";
import HomePage from "../pages/HomePage";
import ProfilePage from "../pages/ProfilePage";
import WorshipSchedulePage from "../pages/worship/WorshipSchedulePage";
import GalleryPage from "../pages/GalleryPage";
import EventBuilderPage from "../pages/event/EventBuilderPage";
import EventDetailPage from "../pages/event/EventDetailPage";
import EventListPage from "../pages/event/EventListPage";
import EventInfoPage from "../pages/event/EventInfoPage";
import EventResultsPage from "../pages/event/EventResultsPage";
import AdminPage from "../pages/AdminPage";

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
      { path: "/events", element: <EventListPage /> },
      { path: "/event/:id", element: <EventInfoPage /> },
      { path: "/profile", element: <ProfilePage /> },
      { path: "/gallery", element: <GalleryPage /> },
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
      { path: "/admin/events/new", element: <EventBuilderPage /> },
      { path: "/admin/events/:id", element: <EventDetailPage /> },
      { path: "/admin/events/:id/results", element: <EventResultsPage /> },
    ],
  },
]);
