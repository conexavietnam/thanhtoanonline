import { createBrowserRouter, Navigate, Outlet } from "react-router";

import AppLayout from "../components/layout/AppLayout.jsx";
import AuthLayout from "../components/layout/AuthLayout.jsx";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import PartnerLayout from "../components/layout/PartnerLayout.jsx";
import ProtectedRoute from "../components/routing/ProtectedRoute.jsx";
import MaintenanceGuard from "../components/routing/MaintenanceGuard.jsx";

// Public pages
import LandingPage from "../pages/public/LandingPage.jsx";
import AboutPage from "../pages/public/AboutPage.jsx";
import ContactPage from "../pages/public/ContactPage.jsx";
import PricingPage from "../pages/public/PricingPage.jsx";
import CheckoutPage from "../pages/public/CheckoutPage.jsx";
import ThankYouPage from "../pages/public/ThankYouPage.jsx";
import NotFoundPage from "../pages/public/NotFoundPage.jsx";
import ForbiddenPage from "../pages/public/ForbiddenPage.jsx";
import ServerErrorPage from "../pages/public/ServerErrorPage.jsx";
import MaintenancePage from "../pages/public/MaintenancePage.jsx";
import VnPayReturnPage from "../pages/public/VnPayReturnPage.jsx";

// Auth pages
import SignIn from "../pages/auth/SignIn.jsx";
import SignUp from "../pages/auth/SignUp.jsx";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage.jsx";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage.jsx";

// User pages
import UserDashboard from "../pages/user/UserDashboard.jsx";
import ProfilePage from "../pages/user/ProfilePage.jsx";
import MySubscriptionsPage from "../pages/user/MySubscriptionsPage.jsx";
import MyOrdersPage from "../pages/user/MyOrdersPage.jsx";
import DiscTestPage from "../pages/user/DiscTestPage.jsx";
import ResultsPage from "../pages/user/ResultsPage.jsx";

// Partner pages
import PartnerDashboardPage from "../pages/partner/PartnerDashboardPage.jsx";
import ReferralListPage from "../pages/partner/ReferralListPage.jsx";
import PartnerCustomizationPage from "../pages/partner/PartnerCustomizationPage.jsx";
import PartnerPlanManagementPage from "../pages/partner/PartnerPlanManagementPage.jsx";

// Admin pages
import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx";
import UserPlanManagementPage from "../pages/admin/UserPlanManagementPage.jsx";
import AdminPartnerPlanManagementPage from "../pages/admin/PartnerPlanManagementPage.jsx";
import QuestionManagementPage from "../pages/admin/QuestionManagementPage.jsx";
import UserManagementPage from "../pages/admin/UserManagementPage.jsx";
import CareerManagementPage from "../pages/admin/CareerManagementPage.jsx";
import InsightManagementPage from "../pages/admin/InsightManagementPage.jsx";
import DevelopmentPlanManagementPage from "../pages/admin/DevelopmentPlanManagementPage.jsx";
import FinanceManagementPage from "../pages/admin/FinanceManagementPage.jsx";
import ReferralManagementPage from "../pages/admin/ReferralManagementPage.jsx";
import AdminPartnerCustomizationPage from "../pages/admin/AdminPartnerCustomizationPage.jsx";
import AdvancedReportsPage from "../pages/admin/AdvancedReportsPage.jsx";
import AuditLogsPage from "../pages/admin/AuditLogsPage.jsx";
// import PartnerManagementPage from "../pages/admin/PartnerManagementPage.jsx";
import SettingsPage from "../pages/admin/SettingsPage.jsx";
import DiscAnalyticsPage from "../pages/admin/DiscAnalyticsPage.jsx";
import PartnerPdfPackageManagementPage from "../pages/admin/PartnerPdfPackageManagementPage.jsx";
import PartnerCustomerManagementPage from "../pages/admin/PartnerCustomerManagementPage.jsx";


const router = createBrowserRouter([
  {
    element: <MaintenanceGuard />,
    children: [
      // Maintenance page - accessible even during maintenance
      { path: "maintenance", element: <MaintenancePage /> },
      { index: true, element: <LandingPage /> },
      {
        element: <AppLayout />,
        children: [
          // Public routes
          // LandingPage moved out of AppLayout
          { path: "about", element: <AboutPage /> },
          { path: "contact", element: <ContactPage /> },
          { path: "plans", element: <PricingPage /> },
          { path: "test", element: <DiscTestPage /> },
          { path: "checkout", element: <CheckoutPage /> },
          { path: "payment/vnpay-return", element: <VnPayReturnPage /> },
          { path: "thank-you", element: <ThankYouPage /> },
          {
            path: "dashboard",
            element: (
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            ),
            children: [
              { index: true, element: <UserDashboard /> },
              { path: "profile", element: <ProfilePage /> },
              { path: "my-subscriptions", element: <MySubscriptionsPage /> },
              { path: "my-orders", element: <MyOrdersPage /> },
              { path: "results", element: <ResultsPage /> },
              { path: "results", element: <ResultsPage /> },
              {
                path: "partner",
                element: (
                  <ProtectedRoute roles={["PARTNER", "SUPER_ADMIN"]}>
                    <Outlet />
                  </ProtectedRoute>
                ),
                children: [
                  { index: true, element: <PartnerDashboardPage /> },
                  { path: "referrals", element: <ReferralListPage /> },
                  { path: "customization", element: <PartnerCustomizationPage /> },
                  { path: "plans", element: <PartnerPlanManagementPage /> },
                ]
              }
            ],
          },

        ],
      },
      // Admin routes - Tách riêng, không chung với AppLayout
      {
        path: "admin",
        element: (
          <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN", "CONTENT_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: "plans", element: <Navigate to="/admin/plans/user" replace /> },
          { path: "plans/user", element: <UserPlanManagementPage /> },
          { path: "plans/partner", element: <AdminPartnerPlanManagementPage /> },
          { path: "questions", element: <QuestionManagementPage /> },
          { path: "users", element: <UserManagementPage /> },
          { path: "careers", element: <CareerManagementPage /> },
          { path: "insights", element: <InsightManagementPage /> },
          { path: "development-plans", element: <DevelopmentPlanManagementPage /> },
          { path: "development-plans", element: <DevelopmentPlanManagementPage /> },
          // Merged into FinanceManagementPage
          { path: "finance", element: <FinanceManagementPage /> },
          // Obsolete routes redirect to finance for backward compatibility if needed, or just removed. 
          // For now, removing them as per plan.
          // { path: "subscriptions", element: <SubscriptionManagementPage /> },
          // { path: "payments", element: <PaymentManagementPage /> },

          { path: "referrals", element: <ReferralManagementPage /> },
          // { path: "partners", element: <PartnerManagementPage /> }, // Merged into users
          { path: "partners/:partnerId/customers", element: <PartnerCustomerManagementPage /> },
          { path: "partner-customizations", element: <AdminPartnerCustomizationPage /> },
          { path: "reports/advanced", element: <AdvancedReportsPage /> },
          { path: "analytics/disc", element: <DiscAnalyticsPage /> },
          { path: "partner-pdf-packages", element: <PartnerPdfPackageManagementPage /> },
          { path: "audit-logs", element: <AuditLogsPage /> },
          { path: "settings", element: <SettingsPage /> },

        ],
      },
      {
        element: <AuthLayout />,
        children: [
          { path: "login", element: <SignIn /> },
          { path: "register", element: <SignUp /> },
          { path: "forgot-password", element: <ForgotPasswordPage /> },
          { path: "reset-password", element: <ResetPasswordPage /> },
          { path: "verify-email", element: <VerifyEmailPage /> },
        ],
      },
      // Error pages
      { path: "/403", element: <ForbiddenPage /> },
      { path: "/500", element: <ServerErrorPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default router;
