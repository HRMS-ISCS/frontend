import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Mail, Search, Workflow } from 'lucide-react';

import { dashboardApi } from '@/api';
import { ONBOARDING_STEPS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { useDebounce } from '@/lib/hooks';
import { Alert, Avatar, Badge, Card, Checkbox, EmptyState, ErrorState, Input, PageHeader, Pagination, ProgressBar, Select, Skeleton, StatCard } from '@/components/ui';
import { ResponsiveTable } from '@/components/ResponsiveTable';

const URGENCY_TONE = { High: 'danger', Medium: 'warning', Low: 'neutral' };
const PAGE_SIZE = 20;

export function OnboardingTrackerPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const urgency = params.get('urgency') || '';
  const step = params.get('step') || '';
  const includeOrphaned = params.get('include_orphaned') === 'true';
  const debounced = useDebounce(search, 300);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => setPage(1), [urgency, step, includeOrphaned, debounced]);

  const funnel = useQuery({ queryKey: ['dashboard', 'funnel'], queryFn: dashboardApi.funnel });
  const stuck = useQuery({
    queryKey: ['dashboard', 'stuck', urgency, step, includeOrphaned, debounced, page],
    queryFn: () =>
      dashboardApi.stuckEmployees({
        urgency: urgency || undefined,
        step: step || undefined,
        search: debounced || undefined,
        include_orphaned: includeOrphaned || undefined,
        page,
        page_size: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  const f = funnel.data;
  const s = stuck.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Onboarding tracker" subtitle="Everyone who started onboarding and stopped, most stale first." />

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Completed" value={f?.completed_count} icon={CheckCircle2} tone="success" />
        <StatCard label="In progress" value={f?.in_progress_count} icon={Workflow} />
        <StatCard label="Never started" value={f?.not_started_count} icon={Workflow} tone="warning" sub="Record created, wizard never opened" />
        <StatCard label="Completion rate" value={f ? `${f.completion_rate_percentage}%` : undefined} icon={Workflow} tone="violet" />
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {(f?.step_breakdown || []).map((st) => (
          <button
            key={st.step}
            type="button"
            onClick={() => setParam('step', String(step) === String(st.step) ? '' : String(st.step))}
            className={`card p-4 text-left transition hover:border-brand-300 ${String(step) === String(st.step) ? 'border-brand-400 ring-2 ring-brand-100' : ''}`}
          >
            <p className="text-xs font-medium text-slate-500">Step {st.step}</p>
            <p className="truncate text-sm font-semibold text-slate-800">{ONBOARDING_STEPS[st.step - 1]?.title}</p>
            <p className="mt-2 text-2xl font-semibold">{st.active_count}</p>
            <ProgressBar value={st.percentage_of_in_progress} size="sm" className="mt-2" tone={f?.biggest_drop_off_step?.step === st.step ? 'warning' : 'brand'} />
          </button>
        ))}
      </div>

      <Card flush>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or ID" prefix={<Search size={15} />} fieldClassName="lg:w-72" />
          <Select
            value={urgency}
            onChange={(e) => setParam('urgency', e.target.value)}
            placeholder="All urgencies"
            options={[
              { value: 'High', label: 'High · idle > 3 days' },
              { value: 'Medium', label: 'Medium · 1–3 days' },
              { value: 'Low', label: 'Low · < 24 hours' },
            ]}
            fieldClassName="lg:w-52"
          />
          <Select
            value={step}
            onChange={(e) => setParam('step', e.target.value)}
            placeholder="All steps"
            options={ONBOARDING_STEPS.map((st) => ({ value: String(st.step), label: `Step ${st.step} · ${st.title}` }))}
            fieldClassName="lg:w-60"
          />
          <Checkbox label="Include deleted accounts" checked={includeOrphaned} onChange={(v) => setParam('include_orphaned', v ? 'true' : '')} className="lg:ml-auto" />
        </div>

        {s?.orphaned_note && (
          <div className="border-b border-slate-100 p-4">
            <Alert tone="neutral">{s.orphaned_note}</Alert>
          </div>
        )}

        {stuck.isLoading ? (
          <div className="space-y-2 p-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : stuck.error ? (
          <ErrorState error={stuck.error} onRetry={stuck.refetch} />
        ) : !s?.stuck_employees?.length ? (
          <EmptyState icon={CheckCircle2} title="Nobody matches these filters" description="Every active onboarding session is moving." />
        ) : (
          <>
            <ResponsiveTable
              rows={s.stuck_employees}
              rowKey={(row) => row.tenant_id}
              breakpoint="lg"
              columns={[
                {
                  key: 'employee',
                  header: 'Employee',
                  role: 'primary',
                  cell: (row) => (
                    <div className="flex items-center gap-3">
                      <Avatar name={row.name} size="sm" />
                      <div className="min-w-0">
                        {row.employee_id ? (
                          <Link to={`/employees/${row.employee_id}`} className="block truncate font-medium text-slate-800 hover:text-brand-600">
                            {row.name || 'Unnamed'}
                          </Link>
                        ) : (
                          <span className="block truncate font-medium text-slate-800">{row.name || 'Unnamed'}</span>
                        )}
                        <span className="block truncate text-xs text-slate-500">
                          {row.employee_id || 'No employee record yet'}
                          {row.is_orphaned && ' · deleted account'}
                        </span>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'step',
                  header: 'Stopped at',
                  className: 'max-w-[220px]',
                  cell: (row) => <span className="block truncate">{row.current_step_name}</span>,
                },
                {
                  key: 'progress',
                  header: 'Progress',
                  className: 'w-40',
                  cell: (row) => (
                    <div className="flex items-center gap-2">
                      <ProgressBar value={row.progress_percentage} size="sm" />
                      <span className="shrink-0 text-xs text-slate-500">{row.last_completed_step}/{row.total_steps}</span>
                    </div>
                  ),
                },
                {
                  key: 'activity',
                  header: 'Last activity',
                  className: 'tabular whitespace-nowrap text-slate-500',
                  cell: (row) => (
                    <>
                      <span className="tabular">{formatDateTime(row.last_saved_at)}</span>
                      <span className="block text-xs">{row.days_inactive > 0 ? `${row.days_inactive} day(s) idle` : `${row.hours_inactive} hour(s) idle`}</span>
                    </>
                  ),
                },
                { key: 'urgency', header: 'Urgency', role: 'badge', cell: (row) => <Badge tone={URGENCY_TONE[row.urgency]}>{row.urgency}</Badge> },
                {
                  key: 'nudge',
                  header: 'Nudge',
                  role: 'actions',
                  align: 'right',
                  cell: (row) =>
                    row.email ? (
                      <a
                        href={`mailto:${row.email}?subject=${encodeURIComponent('Please complete your ISCS onboarding')}&body=${encodeURIComponent(
                          `Dear ${row.name || 'Colleague'},\n\nYour onboarding is paused at ${row.current_step_name}. Please sign in to the ISCS HR portal and complete the remaining steps.\n\nRegards,\nHR & Operations`,
                        )}`}
                        className="btn btn-secondary btn-sm"
                      >
                        <Mail size={14} /> Email
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">No email</span>
                    ),
                },
              ]}
            />
            <Pagination page={page} totalPages={s.total_pages} total={s.total} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
