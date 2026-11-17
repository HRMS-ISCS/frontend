import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Clock, FileCheck2, FileSignature, PenLine, Search, Send, ShieldCheck } from 'lucide-react';

import { dashboardApi, signatureAdminApi } from '@/api';
import { SIGNATURE_STATUS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { useDebounce } from '@/lib/hooks';
import { Avatar, Button, Card, Checkbox, ErrorState, Input, PageHeader, Pagination, Select, Skeleton, StatCard } from '@/components/ui';
import { AadhaarBadge } from '@/components/StatusBadges';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { CountersignModal, EmptySignatures, RequestActions, RequestSummary, SendEnvelopeModal, SignedDocumentsModal } from './components';

const PAGE_SIZE = 20;

export function SignatureHubPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [countersign, setCountersign] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [sending, setSending] = useState(false);
  const status = params.get('status') || '';
  const awaiting = params.get('awaiting_countersign') === 'true';
  const debounced = useDebounce(search, 300);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => setPage(1), [status, awaiting, debounced]);

  const summary = useQuery({ queryKey: ['dashboard', 'signature-status'], queryFn: dashboardApi.signatureStatus });
  const list = useQuery({
    queryKey: ['signatures', 'list', status, awaiting, debounced, page],
    queryFn: () =>
      signatureAdminApi.list({
        status: status || undefined,
        awaiting_countersign: awaiting || undefined,
        search: debounced || undefined,
        page,
        page_size: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  const s = summary.data;
  const data = list.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="E-signatures"
        subtitle="Zoho Sign — two envelopes per employee (appointment letter; NDA, policies & declaration), each Aadhaar eSigned and countersigned by HR."
        actions={
          <>
            <Link to="/signatures/health">
              <Button variant="secondary" icon={ShieldCheck}>Setup & health</Button>
            </Link>
            <Button icon={Send} onClick={() => setSending(true)}>Send envelope for signing</Button>
          </>
        }
      />

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Counted per employee - each employee has two envelopes. */}
        <StatCard
          label="Awaiting your countersign"
          value={s?.awaiting_countersign_total}
          sub={s?.awaiting_countersign_envelopes ? `employees · ${s.awaiting_countersign_envelopes} envelope(s)` : 'employees'}
          icon={PenLine}
          tone="warning"
          onClick={() => setParam('awaiting_countersign', 'true')}
        />
        <StatCard label="Awaiting employee" value={s?.pending_candidate_otp_total} sub="employees" icon={Clock} tone="info" onClick={() => setParam('status', 'sent')} />
        <StatCard label="Completed" value={s?.completed_total} sub="employees, both envelopes signed" icon={FileCheck2} tone="success" onClick={() => setParam('status', 'completed')} />
        <StatCard
          label="Aadhaar verified"
          value={s?.aadhaar?.available ? `${s.aadhaar.compliance_rate_percentage}%` : '—'}
          sub={s?.aadhaar?.non_aadhaar ? `${s.aadhaar.non_aadhaar} without Aadhaar` : 'of signed envelopes'}
          icon={ShieldCheck}
          tone={s?.aadhaar?.non_aadhaar ? 'danger' : 'violet'}
        />
      </div>

      <Card flush>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee name, ID or email" prefix={<Search size={15} />} fieldClassName="lg:w-80" />
          <Select
            value={status}
            onChange={(e) => {
              setParam('status', e.target.value);
              if (e.target.value) setParam('awaiting_countersign', '');
            }}
            placeholder="All statuses"
            options={Object.entries(SIGNATURE_STATUS).map(([value, cfg]) => ({ value, label: cfg.label }))}
            fieldClassName="lg:w-60"
            disabled={awaiting}
          />
          <Checkbox label="Only awaiting my countersign" checked={awaiting} onChange={(v) => setParam('awaiting_countersign', v ? 'true' : '')} className="lg:ml-auto" />
        </div>

        {list.isLoading ? (
          <div className="space-y-2 p-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.refetch} />
        ) : !data?.requests?.length ? (
          <EmptySignatures />
        ) : (
          <>
            <ResponsiveTable
              rows={data.requests}
              rowKey={(r) => r.id}
              breakpoint="lg"
              columns={[
                {
                  key: 'employee',
                  header: 'Employee',
                  role: 'primary',
                  cell: (r) => (
                    <div className="flex items-center gap-3">
                      <Avatar name={r.employee_name} size="sm" />
                      <div className="min-w-0">
                        <Link to={`/employees/${r.employee_id}`} className="block truncate font-semibold text-slate-800 transition-colors hover:text-brand-600">
                          {r.employee_name || r.employee_id}
                        </Link>
                        {/* Two rows per employee - name the envelope so they read as two documents, not two people. */}
                        <span className="block truncate text-xs font-medium text-brand-700">{r.envelope_label}</span>
                        <span className="tabular block text-xs text-slate-500">
                          {r.employee_id} · #{r.id}
                        </span>
                      </div>
                    </div>
                  ),
                },
                { key: 'status', header: 'Status', role: 'badge', className: 'max-w-[280px]', cell: (r) => <RequestSummary request={r} /> },
                { key: 'signature', header: 'Signature', cell: (r) => <AadhaarBadge signMethod={r.sign_method} confirmed={r.aadhaar_confirmed} /> },
                {
                  key: 'documents',
                  header: 'Documents',
                  cell: (r) => (
                    <span className="tabular flex items-center gap-1.5 font-medium text-slate-600">
                      <FileSignature size={14} className="text-slate-400" /> {r.document_count}
                    </span>
                  ),
                },
                { key: 'sent', header: 'Sent', className: 'tabular whitespace-nowrap text-slate-500', cell: (r) => <span className="tabular">{formatDate(r.sent_at)}</span> },
                { key: 'completed', header: 'Completed', className: 'tabular whitespace-nowrap text-slate-500', cell: (r) => <span className="tabular">{formatDate(r.completed_at)}</span> },
                {
                  key: 'actions',
                  header: 'Actions',
                  role: 'actions',
                  align: 'right',
                  cell: (r) => <RequestActions request={r} onCountersign={setCountersign} onDocuments={setDocuments} compact />,
                },
              ]}
            />
            <Pagination page={page} totalPages={data.total_pages} total={data.total} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </Card>

      {countersign && <CountersignModal request={countersign} onClose={() => setCountersign(null)} />}
      {documents && <SignedDocumentsModal request={documents} onClose={() => setDocuments(null)} />}
      {sending && <SendEnvelopeModal onClose={() => setSending(false)} />}
    </div>
  );
}
