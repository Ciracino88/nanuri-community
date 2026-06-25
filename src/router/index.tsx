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
import SurveyNewPage from "../pages/survey/SurveyNewPage";
import SurveyAdminPage from "../pages/survey/SurveyAdminPage";
import SurveyDeployPage from "../pages/survey/SurveyDeployPage";
import SurveyResponsePage from "../pages/survey/SurveyResponsePage";
import SurveyListPage from "../pages/survey/SurveyListPage";
import SurveyResultsPage from "../pages/survey/SurveyResultsPage";
import VoteListPage from "../pages/vote/VoteListPage";
import VoteResponsePage from "../pages/vote/VoteResponsePage";
import WorshipSchedulePage from "../pages/worship/WorshipSchedulePage";

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
    path: "/member/setup",
    element: (
      <ProtectedRoute memberOnly setupPage>
        <MemberProfileSetupPage />
      </ProtectedRoute>
    ),
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
      { path: "/surveys", element: <SurveyListPage /> },
      { path: "/vote", element: <VoteListPage /> },
      { path: "/worship", element: <WorshipSchedulePage /> },
      { path: "/member/form", element: <MemberBillFormPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute memberOnly adminOnly>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: "/admin/surveys", element: <SurveyAdminPage /> },
      { path: "/admin/surveys/new", element: <SurveyNewPage /> },
      { path: "/admin/surveys/:id/deploy", element: <SurveyDeployPage /> },
      { path: "/admin/surveys/:id/results", element: <SurveyResultsPage /> },
      { path: "/accounting", element: <AccountingListPage /> },
      { path: "/accounting/new", element: <AccountingReportPage /> },
      { path: "/accounting/:id", element: <AccountingDetailPage /> },
    ],
  },
  {
    path: "/survey/:id",
    element: <SurveyResponsePage />,
  },
  {
    path: "/vote/candidate/:candidateId",
    element: <VoteResponsePage />,
  },
]);
