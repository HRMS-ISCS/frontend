import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, History, MailWarning, Search, Send, Trash2 } from 'lucide-react';

import { documentHistoryApi } from '@/api';
import { openExternal } from '@/lib/api';
import { DOCUMENT_TYPES } from '@/lib/constants';
import { formatBytes, formatDateTime } from '@/lib/format';
import { useDebounce } from '@/lib/hooks';
import { Button, Card, Checkbox, ConfirmDialog, EmptyState, ErrorState, Input, PageHeader, Pagination, Select, Skeleton, StatCard, useToast } from '@/components/ui';
import { EmailStatusBadge } from '@/components/StatusBadges';
import { ResponsiveTable } from '@/components/ResponsiveTable';

const PAGE_SIZE = 20;

export function DocumentHistoryPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(null);
  const debounced = useDebounce(search, 300);

  const documentType = params.get('document_type') || '';
  const emailStatus = params.get('email_status') || '';
  const fromDate = params.get('from_date') || '';
  const toDate = params.get('to_date') || '';

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [documentType, emailStatus, fromDate, toDate, debounced]);

  const summary = useQuery({ queryKey: ['document-history', 'summary'], queryFn: documentHistoryApi.summary });
  const list = useQuery({
    queryKey: ['document-history', 'list', documentType, emailStatus, fromDate, toDate, debounced, page],
    queryFn: () =>
      documentHistoryApi.list({
        document_type: documentType || undefined,
        email_status: emailStatus || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        search: debounced || undefined,
        page,
        page_size: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['document-history'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const download = async (row) => {
    setBusy(row.id);
    try {
      const res = await documentHistoryApi.download(row.id);
      openExternal(res.download_url);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(null);
    }
  };

  const doDelete = async () => {
    setBusy('delete');
    try {
      if (confirm.type === 'bulk') {
        const res = await documentHistoryApi.bulkRemove([...selected]);
        toast.success(res.message);
        if (res.orphaned_blob_paths?.length) toast.error(`${res.orphaned_blob_paths.length} archived file(s) could not be removed from storage.`);
        setSelected(new Set());
      } else {
        const res = await documentHistoryApi.remove(confirm.row.id);
        toast.success(res.message);
      }
      setConfirm(null);
      refresh();
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(null);
    }
  };

  const s = summary.data;
  const rows = list.data?.documents || [];
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-6">
      <PageHeader title="Document dispatch history" subtitle="Every letter and payslip HR has issued — who received it, when, and whether the email landed." />

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="All documents" value={s?.total_documents} icon={FileText} />
        <StatCard label="This month" value={s?.documents_this_month} icon={Send} tone="info" />
        <StatCard label="Email failures" value={s?.emails_failed} icon={MailWarning} tone={s?.emails_failed ? 'danger' : 'neutral'} onClick={() => setParam('email_status', 'failed')} />
        <StatCard label="Last dispatch" value={s?.last_dispatch_at ? formatDateTime(s.last_dispatch_at).split(',')[0] : '—'} sub={s?.last_dispatch_at ? formatDateTime(s.last_dispatch_at) : undefined} icon={History} tone="violet" />
      </div>

      <Card flush>
        <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-2 xl:grid-cols-[1fr_200px_180px_150px_150px]">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Recipient name, employee ID or email" prefix={<Search size={15} />} />
          <Select value={documentType} onChange={(e) => setParam('document_type', e.target.value)} placeholder="All document types" options={Object.entries(DOCUMENT_TYPES).map(([value, label]) => ({ value, label }))} />
          <Select
            value={emailStatus}
            onChange={(e) => setParam('email_status', e.target.value)}
            placeholder="Any delivery"
            options={[
              { value: 'sent', label: 'Delivered' },
              { value: 'failed', label: 'Failed' },
              { value: 'not_requested', label: 'Download only' },
            ]}
          />
          <Input type="date" value={fromDate} onChange={(e) => setParam('from_date', e.target.value)} aria-label="From date" />
          <Input type="date" value={toDate} onChange={(e) => setParam('to_date', e.target.value)} aria-label="To date" />
        </div>

        {selected.size > 0 && (
          <div className="flex items-center justify-between border-b border-slate-100 bg-brand-50/60 px-4 py-2.5 text-sm">
            <span className="font-medium text-brand-800">{selected.size} selected</span>
            <Button variant="danger" size="sm" icon={Trash2} onClick={() => setConfirm({ type: 'bulk' })}>
              Delete selected
            </Button>
          </div>
        )}

        {list.isLoading ? (
          <div className="space-y-2 p-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.refetch} />
        ) : rows.length === 0 ? (
          <EmptyState icon={History} title="No dispatches match" description="Generate a letter or payslip and it will appear here." />
        ) : (
          <>
            <ResponsiveTable
              rows={rows}
              rowKey={(row) => row.id}
              breakpoint="lg"
              columns={[
                {
                  key: 'select',
                  role: 'select',
                  headerClassName: 'w-10',
                  header: (
                    <Checkbox
                      checked={allOnPage}
                      onChange={(v) =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          rows.forEach((r) => (v ? next.add(r.id) : next.delete(r.id)));
                          return next;
                        })
                      }
                    />
                  ),
                  cell: (row) => <Checkbox checked={selected.has(row.id)} onChange={() => toggle(row.id)} />,
                },
                {
                  key: 'document',
                  header: 'Document',
                  role: 'primary',
                  cell: (row) => (
                    <>
                      <p className="font-semibold text-slate-800">{row.document_type_label}</p>
                      <p className="max-w-[240px] truncate text-xs text-slate-500">{row.key_details || '—'}</p>
                    </>
                  ),
                },
                {
                  key: 'recipient',
                  header: 'Recipient',
                  cell: (row) => (
                    <>
                      <p className="font-semibold text-slate-800">{row.recipient_name || '—'}</p>
                      {row.employee_id ? (
                        <Link to={`/employees/${row.employee_id}`} className="text-xs text-brand-600 hover:underline">{row.employee_id}</Link>
                      ) : (
                        <span className="text-xs text-slate-400">Candidate</span>
                      )}
                    </>
                  ),
                },
                {
                  key: 'to',
                  header: 'Sent to',
                  className: 'max-w-[220px] text-xs text-slate-500',
                  cell: (row) => (
                    <>
                      <span className="block truncate" title={row.to_emails}>{row.to_emails || '—'}</span>
                      {row.recipient_count > 1 && <span className="text-slate-400">+{row.recipient_count - 1} more incl. CC/BCC</span>}
                    </>
                  ),
                },
                { key: 'delivery', header: 'Delivery', role: 'badge', cell: (row) => <EmailStatusBadge status={row.email_status} /> },
                {
                  key: 'issued',
                  header: 'Issued',
                  className: 'tabular whitespace-nowrap text-slate-500',
                  cell: (row) => (
                    <>
                      <span className="tabular">{formatDateTime(row.generated_at)}</span>
                      <span className="block text-xs">by {row.generated_by || 'system'}</span>
                    </>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  role: 'actions',
                  align: 'right',
                  cell: (row) => (
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Download}
                        disabled={!row.has_archive}
                        loading={busy === row.id}
                        onClick={() => download(row)}
                        title={row.has_archive ? `Download (${formatBytes(row.file_size_bytes)})` : row.archive_error || 'No archived copy'}
                      />
                      <Button variant="ghost" size="sm" icon={Trash2} className="text-red-600 hover:bg-red-50" onClick={() => setConfirm({ type: 'single', row })} aria-label="Delete" />
                    </div>
                  ),
                },
              ]}
            />
            <Pagination page={page} totalPages={list.data.total_pages} total={list.data.total} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        loading={busy === 'delete'}
        title={confirm?.type === 'bulk' ? `Delete ${selected.size} entries?` : 'Delete this entry?'}
        message="The audit record and the archived PDF are removed permanently. This cannot be undone."
        confirmLabel="Delete permanently"
      />
    </div>
  );
}
