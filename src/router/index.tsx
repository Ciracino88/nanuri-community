// src/router/index.tsx
import { createBrowserRouter } from "react-router-dom";
import GatePage from "../pages/GatePage";
import MemberLoginPage from "../pages/MemberLoginPage";
import MemberBillFormPage from "../pages/MemberBillFormPage";
import MemberProfileSetupPage from "../pages/MemberProfileSetupPage";
import BillFormPage from "../pages/BillFormPage";
import ProtectedRoute from "../components/ProtectedRoute";
import AccountingReportPage from "../pages/AccountingReportPage";
import LocationFeedbackPage from "../pages/LocationFeedbackPage";
import HomePage from "../pages/HomePage";
import SurveyNewPage from "../pages/SurveyNewPage";
import SurveyAdminPage from "../pages/SurveyAdminPage";

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
    path: "/member/form",
    element: (
      <ProtectedRoute memberOnly>
        <MemberBillFormPage/>
      </ProtectedRoute>
    ),
  },
  {
    path: "/guest/form",
    element: (
      <ProtectedRoute guestOnly>
        <BillFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/home",
    element: (
      <ProtectedRoute memberOnly>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/location-feedback",
    element: <LocationFeedbackPage />,
  },
  {
    path: "/admin/surveys",
    element: (
      <ProtectedRoute memberOnly adminOnly>
        <SurveyAdminPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/surveys/new",
    element: (
      <ProtectedRoute memberOnly adminOnly>
        <SurveyNewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/accounting",
    element: (
      <ProtectedRoute memberOnly adminOnly>
        <AccountingReportPage />
      </ProtectedRoute>
    ),
  },
]);