import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileArchive, Receipt, Trash2 } from 'lucide-react';

import { payslipsApi } from '@/api';
import { openExternal, saveBlob } from '@/lib/api';
import { formatDate, MONTHS } from '@/lib/format';
import { Button, Card, ConfirmDialog, EmptyState, ErrorState, Select, Skeleton, useToast } from '@/components/ui';
import { ResponsiveTable } from '@/components/ResponsiveTable';

export function PayslipsPanel({ employeeId, canDelete = false }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [year, setYear] = useState('');
  const [busy, setBusy] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payslips', employeeId, year],
    queryFn: () => payslipsApi.list(employeeId, year || undefined),
    enabled: Boolean(employeeId),
  });

  const payslips = data?.payslips || [];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => String(currentYear - i));

  const open = async (p) => {
    setBusy(p.id);
    try {
      const res = await payslipsApi.downloadUrl(employeeId, p.year, p.month);
      openExternal(res.download_url);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(null);
    }
  };

  const downloadAll = async () => {
    setBusy('all');
    try {
      const { blob, filename } = await payslipsApi.downloadAll(employeeId, year || undefined);
      saveBlob(blob, filename !== 'download' ? filename : `payslips_${employeeId}_${year || 'all'}.zip`);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy('delete');
    try {
      await payslipsApi.remove(employeeId, toDelete.id);
      toast.success('Payslip deleted');
      setToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['payslips', employeeId] });
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card
      title="Payslips"
      icon={Receipt}
      flush
      actions={
        <>
          <Select value={year} onChange={(e) => setYear(e.target.value)} options={years} placeholder="All years" className="w-32 py-1.5" />
          <Button variant="secondary" size="sm" icon={FileArchive} onClick={downloadAll} loading={busy === 'all'} disabled={!payslips.length}>
            Download all
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="space-y-2 p-5">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : payslips.length === 0 ? (
        <EmptyState icon={Receipt} title="No payslips yet" description="Payslips appear here once payroll is processed." />
      ) : (
        <ResponsiveTable
          rows={payslips}
          rowKey={(p) => p.id}
          breakpoint="sm"
          columns={[
            {
              key: 'period',
              header: 'Period',
              role: 'primary',
              className: 'font-semibold text-slate-800',
              cell: (p) => (
                <span className="font-semibold text-slate-800">
                  {MONTHS[p.month - 1]} {p.year}
                </span>
              ),
            },
            { key: 'published', header: 'Published', cell: (p) => formatDate(p.uploaded_at) },
            { key: 'by', header: 'Published by', cell: (p) => p.uploaded_by || '—' },
            {
              key: 'actions',
              header: 'Actions',
              role: 'actions',
              align: 'right',
              cell: (p) => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" icon={Download} onClick={() => open(p)} loading={busy === p.id}>
                    View
                  </Button>
                  {canDelete && (
                    <Button variant="ghost" size="sm" icon={Trash2} className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(p)} aria-label="Delete payslip" />
                  )}
                </div>
              ),
            },
          ]}
        />
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={busy === 'delete'}
        title="Delete payslip?"
        message={toDelete && `The ${MONTHS[toDelete.month - 1]} ${toDelete.year} payslip will be removed from storage permanently.`}
        confirmLabel="Delete"
      />
    </Card>
  );
}
