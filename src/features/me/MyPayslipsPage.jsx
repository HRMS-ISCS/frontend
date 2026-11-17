import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/ui';
import { PayslipsPanel } from '@/features/employees/PayslipsPanel';

export function MyPayslipsPage() {
  const { user } = useAuth();
  return (
    <div>
      <PageHeader title="Payslips" subtitle="Your monthly payslips. They are confidential — please don't share them." />
      <PayslipsPanel employeeId={user?.employee_id} />
    </div>
  );
}
