// src/router/index.tsx
import { createBrowserRouter } from "react-router-dom";
import GatePage from "../pages/auth/GatePage";
import MemberLoginPage from "../pages/auth/MemberLoginPage";
import MemberBillFormPage from "../pages/bill/MemberBillFormPage";
import MemberProfileSetupPage from "../pages/MemberProfileSetupPage";
import BillFormPage from "../pages/bill/BillFormPage";
import ProtectedRoute from "../components/ProtectedRoute";
import AppShell from "../components/AppShell";
import AccountingReportPage from "../pages/accounting/AccountingReportPage";
import AccountingListPage from "../pages/accounting/AccountingListPage";
import AccountingDetailPage from "../pages/accounting/AccountingDetailPage";
import HomePage from "../pages/HomePage";
import ProfilePage from "../pages/ProfilePage";
import WorshipSchedulePage from "../pages/worship/WorshipSchedulePage";
import GalleryPage from "../pages/GalleryPage";
import EventAdminPage from "../pages/event/EventAdminPage";
import EventBuilderPage from "../pages/event/EventBuilderPage";
import EventDetailPage from "../pages/event/EventDetailPage";
import EventListPage from "../pages/event/EventListPage";
import EventTimelinePage from "../pages/event/EventTimelinePage";
import EventResultsPage from "../pages/event/EventResultsPage";

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
    path: "/guest/form",
    element: (
      <ProtectedRoute>
        <BillFormPage />
      </ProtectedRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute memberOnly>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: "/home", element: <HomePage /> },
      { path: "/events", element: <EventListPage /> },
      { path: "/event/:id", element: <EventTimelinePage /> },
      { path: "/profile", element: <ProfilePage /> },
      { path: "/gallery", element: <GalleryPage /> },
      { path: "/worship", element: <WorshipSchedulePage /> },
      { path: "/member/form", element: <MemberBillFormPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute memberOnly setupPage>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: "/member/setup", element: <MemberProfileSetupPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute memberOnly adminOnly>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: "/admin/events", element: <EventAdminPage /> },
      { path: "/admin/events/new", element: <EventBuilderPage /> },
      { path: "/admin/events/:id", element: <EventDetailPage /> },
      { path: "/admin/events/:id/results", element: <EventResultsPage /> },
      { path: "/accounting", element: <AccountingListPage /> },
      { path: "/accounting/new", element: <AccountingReportPage /> },
      { path: "/accounting/:id", element: <AccountingDetailPage /> },
    ],
  },
]);
