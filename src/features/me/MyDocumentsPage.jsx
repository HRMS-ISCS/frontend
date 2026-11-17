import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/ui';
import { DocumentsPanel } from '@/features/employees/DocumentsPanel';

export function MyDocumentsPage() {
  const { user } = useAuth();
  return (
    <div>
      <PageHeader title="My documents" subtitle="Files you uploaded during onboarding and documents HR issued to you." />
      <DocumentsPanel employeeId={user?.employee_id} />
    </div>
  );
}
