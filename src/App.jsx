import { Navigate, Route, Routes } from 'react-router-dom';

import { ROLES } from '@/lib/constants';
import { AppShell } from '@/components/layout/AppShell';
import { HomeRedirect, PublicOnly, RequireAuth, RequireRole } from '@/components/layout/Guards';
import { EmptyState } from '@/components/ui';

import { LandingPage } from '@/features/landing/LandingPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';

import { OnboardingPage } from '@/features/onboarding/OnboardingPage';

import { EmployeeHomePage } from '@/features/me/EmployeeHomePage';
import { MyProfilePage } from '@/features/me/MyProfilePage';
import { MyDocumentsPage } from '@/features/me/MyDocumentsPage';
import { MyPayslipsPage } from '@/features/me/MyPayslipsPage';
import { MySigningPage } from '@/features/me/MySigningPage';
import { HelpDeskPage } from '@/features/help/HelpDeskPage';

import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { OnboardingTrackerPage } from '@/features/dashboard/OnboardingTrackerPage';
import { EmployeesPage } from '@/features/employees/EmployeesPage';
import { EmployeeDetailPage } from '@/features/employees/EmployeeDetailPage';
import { LettersPage } from '@/features/letters/LettersPage';
import { SignatureHubPage } from '@/features/signatures/SignatureHubPage';
import { ZohoHealthPage } from '@/features/signatures/ZohoHealthPage';
import { DocumentHistoryPage } from '@/features/documents/DocumentHistoryPage';
import { SalaryStructuresPage } from '@/features/payroll/SalaryStructuresPage';
import { RunPayrollPage } from '@/features/payroll/RunPayrollPage';
import { PayslipUploadsPage } from '@/features/payroll/PayslipUploadsPage';
import { UsersPage } from '@/features/admin/UsersPage';
import { HolidaysPage } from '@/features/admin/HolidaysPage';
import { PositionsPage } from '@/features/admin/PositionsPage';
import { EmailDirectoryPage } from '@/features/admin/EmailDirectoryPage';

const HR = [ROLES.HR, ROLES.SUPERADMIN];
const EMPLOYEE = [ROLES.EMPLOYEE];
const HR_AND_ADMIN = [ROLES.HR, ROLES.SUPERADMIN, ROLES.ADMIN];

const guard = (roles, element) => <RequireRole roles={roles}>{element}</RequireRole>;

export default function App() {
  return (
    <Routes>
      {/* Public marketing page. Deliberately not wrapped in PublicOnly and not
          mounted at "/", so signed-in users can still open it and the existing
          "/" behaviour (redirect to the role's portal, or to login) is
          untouched. */}
      <Route path="/welcome" element={<LandingPage />} />

      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
      {/* Target of the password setup (welcome) and reset emails. */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={guard(EMPLOYEE, <OnboardingPage />)} />

        <Route element={<AppShell />}>
          <Route index element={<HomeRedirect />} />

          {/* Employee self-service */}
          <Route path="/home" element={guard(EMPLOYEE, <EmployeeHomePage />)} />
          <Route path="/me/profile" element={guard(EMPLOYEE, <MyProfilePage />)} />
          <Route path="/me/documents" element={guard(EMPLOYEE, <MyDocumentsPage />)} />
          <Route path="/me/payslips" element={guard(EMPLOYEE, <MyPayslipsPage />)} />
          <Route path="/me/signing" element={guard(EMPLOYEE, <MySigningPage />)} />
          <Route path="/me/help" element={guard(EMPLOYEE, <HelpDeskPage />)} />

          {/* Shared */}
          <Route path="/holidays" element={<HolidaysPage />} />

          {/* HR & Superadmin */}
          <Route path="/dashboard" element={guard(HR, <DashboardPage />)} />
          <Route path="/employees" element={guard(HR, <EmployeesPage />)} />
          <Route path="/employees/:employeeId" element={guard(HR, <EmployeeDetailPage />)} />
          <Route path="/onboarding-tracker" element={guard(HR, <OnboardingTrackerPage />)} />
          <Route path="/letters" element={<Navigate to="/letters/proposed-offer" replace />} />
          <Route path="/letters/:type" element={guard(HR, <LettersPage />)} />
          <Route path="/signatures" element={guard(HR, <SignatureHubPage />)} />
          <Route path="/signatures/health" element={guard(HR, <ZohoHealthPage />)} />
          <Route path="/documents/history" element={guard(HR, <DocumentHistoryPage />)} />
          <Route path="/payroll/salary" element={guard(HR, <SalaryStructuresPage />)} />
          <Route path="/payroll/run" element={guard(HR, <RunPayrollPage />)} />
          <Route path="/payroll/uploads" element={guard(HR_AND_ADMIN, <PayslipUploadsPage />)} />
          <Route path="/admin/users" element={guard(HR_AND_ADMIN, <UsersPage />)} />
          <Route path="/admin/positions" element={guard(HR, <PositionsPage />)} />
          <Route path="/admin/email-directory" element={guard(HR, <EmailDirectoryPage />)} />

          <Route
            path="*"
            element={<EmptyState title="Page not found" description="The page you are looking for does not exist." className="min-h-[50vh]" />}
          />
        </Route>
      </Route>
    </Routes>
  );
}
