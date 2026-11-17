import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileSignature } from 'lucide-react';

import { employeesApi } from '@/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, EmptyState, ErrorState, PageHeader, PageLoader } from '@/components/ui';
import { EmployeeSigningPanel } from '@/features/signing/EmployeeSigningPanel';

export function MySigningPage() {
  const { user } = useAuth();
  const employeeId = user?.employee_id;
  const { data: record, isLoading, error, refetch } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeesApi.get(employeeId),
    enabled: Boolean(employeeId),
  });

  return (
    <div>
      <PageHeader
        title="Document signing"
        subtitle="Your appointment letter, NDA, company policies and declaration — signed once with Aadhaar eSign via Zoho Sign."
      />
      {!employeeId ? (
        <Card>
          <EmptyState
            icon={FileSignature}
            title="Complete your onboarding first"
            description="Your documents become available to sign at Step 6 of onboarding."
            action={<Link to="/onboarding"><Button>Go to onboarding</Button></Link>}
          />
        </Card>
      ) : isLoading ? (
        <PageLoader />
      ) : error ? (
        <Card><ErrorState error={error} onRetry={refetch} /></Card>
      ) : (
        <EmployeeSigningPanel employeeId={employeeId} employeeName={record?.name} hasDeclaration={Boolean(record?.declaration)} />
      )}
    </div>
  );
}
