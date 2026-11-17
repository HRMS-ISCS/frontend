import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil, UserCircle2 } from 'lucide-react';

import { employeesApi } from '@/api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { Button, Card, EmptyState, ErrorState, PageHeader, PageLoader, Tabs } from '@/components/ui';
import { BankFamilySection, CareerSection, PersonalSection, ReferencesSection } from '@/features/employees/ProfileSections';
import { MyProfileHero } from './MyProfileHero';

export function MyProfilePage() {
  const { user } = useAuth();
  const employeeId = user?.employee_id;
  const [tab, setTab] = useState('personal');
  const { data: record, isLoading, error, refetch } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeesApi.get(employeeId),
    enabled: Boolean(employeeId),
  });

  if (!employeeId) {
    return (
      <Card>
        <EmptyState
          icon={UserCircle2}
          title="Your profile is not set up yet"
          description="Complete Step 1 of onboarding to create your employee record."
          action={<Link to="/onboarding"><Button>Start onboarding</Button></Link>}
        />
      </Card>
    );
  }
  if (isLoading) return <PageLoader />;
  if (error) return <Card><ErrorState error={error} onRetry={refetch} /></Card>;

  return (
    <div className="space-y-6">
      <PageHeader title="My profile" subtitle="The information HR holds about you." />
      <MyProfileHero
        record={record}
        employeeId={employeeId}
        photo={user?.profile_photo_url}
        actions={
          !record.declaration && (
            <Link to="/onboarding">
              <Button
                variant="secondary"
                icon={Pencil}
                className="border-white/25 bg-white/10 text-white shadow-none backdrop-blur hover:border-white/40 hover:bg-white/20 hover:text-white"
              >
                Update details
              </Button>
            </Link>
          )
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'personal', label: 'Personal' },
          { id: 'bank', label: 'Bank & family' },
          { id: 'career', label: 'Career & education' },
          { id: 'references', label: 'References' },
        ]}
      />
      {/* This is the employee looking at their own record, so nothing is
          masked. Masking existed to keep IDs off a shared HR screen; applying
          it to the owner of the data only hid it from the one person who
          already knows it. */}
      {tab === 'personal' && <PersonalSection record={record} revealIds />}
      {tab === 'bank' && <BankFamilySection record={record} revealIds />}
      {tab === 'career' && <CareerSection record={record} />}
      {tab === 'references' && <ReferencesSection record={record} />}
      {record.declaration && (
        <p className="text-center text-xs text-slate-500">
          Your declaration was submitted on {formatDate(record.declaration.date_of_declaration)}. Contact HR to change these details.
        </p>
      )}
    </div>
  );
}
