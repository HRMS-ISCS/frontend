import { useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Plus, Trash2 } from 'lucide-react';

import { frequentEmailsApi } from '@/api';
import { PATTERNS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { Badge, Button, Card, EmptyState, ErrorState, Input, PageHeader, Pagination, Skeleton, useToast } from '@/components/ui';
import { ResponsiveTable } from '@/components/ResponsiveTable';

const PAGE_SIZE = 20;

export function EmailDirectoryPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['frequent-emails', 'all', page],
    queryFn: () => frequentEmailsApi.all(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['frequent-emails'] });

  const add = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await frequentEmailsApi.add(email.trim().toLowerCase());
      toast.success(res.message);
      setEmail('');
      invalidate();
    } catch (err) {
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    setBusy(row.id);
    try {
      const res = await frequentEmailsApi.remove(row.id);
      toast.success(res.message);
      invalidate();
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(null);
    }
  };

  const rows = data?.emails || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Email directory" subtitle="Addresses suggested in To / CC / BCC fields. Saved automatically whenever a letter or payslip is emailed." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card flush title="Saved addresses" actions={<Badge>{data?.total ?? 0}</Badge>}>
          {isLoading ? (
            <div className="space-y-2 p-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : rows.length === 0 ? (
            <EmptyState icon={Mail} title="No saved addresses" />
          ) : (
            <>
              <ResponsiveTable
                rows={rows}
                rowKey={(row) => row.id}
                breakpoint="sm"
                columns={[
                  {
                    key: 'email',
                    header: 'Email',
                    role: 'primary',
                    className: 'font-semibold text-slate-800',
                    cell: (row) => <span className="block truncate font-semibold text-slate-800">{row.email}</span>,
                  },
                  { key: 'used', header: 'Times used', role: 'badge', cell: (row) => <Badge tone="brand">{row.usage_count}</Badge> },
                  {
                    key: 'last',
                    header: 'Last used',
                    className: 'text-slate-500',
                    cell: (row) => <span className="tabular">{formatDateTime(row.last_used_at)}</span>,
                  },
                  {
                    key: 'actions',
                    header: '',
                    role: 'actions',
                    align: 'right',
                    cell: (row) => (
                      <Button variant="ghost" size="sm" icon={Trash2} className="text-red-600 hover:bg-red-50" loading={busy === row.id} onClick={() => remove(row)} aria-label="Remove" />
                    ),
                  },
                ]}
              />
              <Pagination page={page} totalPages={data.total_pages} total={data.total} pageSize={PAGE_SIZE} onChange={setPage} />
            </>
          )}
        </Card>
        <Card title="Add address" className="lg:self-start">
          <form onSubmit={add} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="finance@iscstech.co.in" />
            <Button type="submit" icon={Plus} loading={saving} disabled={!PATTERNS.email.test(email.trim())} className="w-full">Add</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
