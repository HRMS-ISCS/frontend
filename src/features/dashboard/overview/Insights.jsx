/**
 * The analysis panels of the HR dashboard: onboarding funnel, workforce,
 * the signing pipeline, who is stalled, and document dispatch.
 *
 * Every figure comes straight from GET /dashboard/overview; nothing here is
 * derived beyond simple shares of numbers the payload already carries.
 */
import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, ChevronRight, FileSignature, FileText, MailWarning, ShieldCheck, UserCheck, Users, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';

import { DOCUMENT_TYPES } from '@/lib/constants';
import { Alert, Avatar, Badge, Card, EmptyState } from '@/components/ui';
import { Donut } from '@/components/Charts';
import { DotRow, HeaderLink, pct, Ring, SegmentBar } from './widgets';

/* ------------------------------------------------------------ Onboarding */
export function FunnelPanel({ funnel }) {
  if (!funnel) return null;
  const steps = funnel.step_breakdown || [];
  const max = Math.max(1, ...steps.map((s) => s.active_count || 0));
  const worst = funnel.biggest_drop_off_step?.step;
  const total = (funnel.completed_count || 0) + (funnel.in_progress_count || 0) + (funnel.not_started_count || 0);

  return (
    <Card title="Onboarding funnel" subtitle="Where every joiner is right now" icon={Workflow} actions={<HeaderLink to="/onboarding-tracker">Tracker</HeaderLink>}>
      <div className="grid gap-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8">
        <div className="flex items-center gap-5 md:flex-col md:items-start">
          <Ring value={funnel.completion_rate_percentage} size={104} stroke={10} color="#10b981">
            <span className="text-center leading-none">
              <span className="tabular block text-[22px] font-bold text-slate-950">{Math.round(funnel.completion_rate_percentage ?? 0)}%</span>
              <span className="mt-1 block text-[10.5px] font-medium text-slate-500">complete</span>
            </span>
          </Ring>
          <div className="w-full flex-1 space-y-2.5">
            <DotRow dot="bg-emerald-500" label="Completed" value={funnel.completed_count} />
            <DotRow dot="bg-brand-500" label="In progress" value={funnel.in_progress_count} />
            <DotRow dot="bg-slate-300" label="Not started" value={funnel.not_started_count} />
            <p className="border-t border-slate-100 pt-2.5 text-[12px] text-slate-400">
              <span className="tabular font-semibold text-slate-600">{total}</span> onboardings in total
            </p>
          </div>
        </div>

        <div>
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-400">In progress, by step</p>
          <ol className="space-y-3.5">
            {steps.map((s) => {
              const hot = s.step === worst && s.active_count > 0;
              return (
                <li key={s.step}>
                  <div className="mb-1.5 flex items-center gap-2.5 text-[13px]">
                    <span
                      className={clsx(
                        'tabular flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10.5px] font-bold',
                        hot ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {s.step}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-slate-700" title={s.step_name}>
                      {s.step_name}
                    </span>
                    <span className={clsx('tabular shrink-0 font-semibold', hot ? 'text-amber-700' : 'text-slate-900')}>
                      {s.active_count ?? 0}
                    </span>
                  </div>
                  <div className="ml-[30px] h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-[width] duration-700 ease-out',
                        hot ? 'bg-gradient-to-r from-amber-300 to-amber-500' : 'bg-gradient-to-r from-brand-300 to-brand-500',
                      )}
                      style={{ width: `${((s.active_count || 0) / max) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
          {funnel.biggest_drop_off_step?.active_count > 0 && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-amber-900 ring-1 ring-inset ring-amber-100">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
              <span>
                Most joiners are waiting at <strong className="font-semibold">{funnel.biggest_drop_off_step.step_label}</strong> (
                {funnel.biggest_drop_off_step.active_count}). A nudge here moves the most people.
              </span>
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------- Workforce */
export function WorkforcePanel({ headcount, gender }) {
  const h = headcount || {};
  return (
    <Card title="Workforce" subtitle="Internal and external split" icon={Users} actions={<HeaderLink to="/employees">Directory</HeaderLink>}>
      <div className="space-y-5">
        <div className="flex items-center gap-5">
          <Donut
            size={112}
            thickness={13}
            centerLabel="people"
            centerValue={h.total_employees}
            segments={[
              { label: 'Internal', value: h.internal_employees, color: '#3147e6' },
              { label: 'External', value: h.external_employees, color: '#a78bfa' },
            ]}
          />
          <div className="min-w-0 flex-1 space-y-2.5">
            <DotRow dot="bg-brand-600" label="Internal" value={h.internal_employees} sub={`${h.internal_percentage ?? 0}%`} />
            <DotRow dot="bg-accent-400" label="External" value={h.external_employees} sub={`${h.external_percentage ?? 0}%`} />
          </div>
        </div>
        {gender?.total_profiles > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <div className="mb-2 flex items-center justify-between text-[12px]">
              <span className="font-semibold uppercase tracking-wide text-slate-400">Gender</span>
              <span className="tabular text-slate-500">{gender.total_profiles} profiles</span>
            </div>
            <SegmentBar
              parts={[
                { value: gender.male, className: 'bg-brand-500' },
                { value: gender.female, className: 'bg-rose-400' },
                { value: gender.other, className: 'bg-accent-400' },
              ]}
            />
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-500">
              <span className="tabular">Male {gender.male_percentage}%</span>
              <span className="tabular">Female {gender.female_percentage}%</span>
              {gender.other > 0 && <span className="tabular">Other {gender.other_percentage}%</span>}
            </div>
          </div>
        )}
        {h.unclassified_employees > 0 && (
          <Alert tone="warning">
            {h.unclassified_employees} employee(s) have an ID outside the ISCSI/ISCSE convention.
          </Alert>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------ Signing pipeline */
function Stage({ label, hint, value, tone, last }) {
  const TONES = {
    sky: { bar: 'bg-sky-400', text: 'text-sky-700', bg: 'bg-sky-50/60 ring-sky-100' },
    amber: { bar: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50/70 ring-amber-100' },
    green: { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50/60 ring-emerald-100' },
    slate: { bar: 'bg-slate-300', text: 'text-slate-800', bg: 'bg-slate-50 ring-slate-200' },
  };
  const t = TONES[tone];
  return (
    <li className="relative flex-1">
      <div className={clsx('relative h-full overflow-hidden rounded-xl p-4 ring-1 ring-inset', t.bg)}>
        <span aria-hidden="true" className={clsx('absolute inset-x-0 top-0 h-[3px]', t.bar)} />
        <p className={clsx('tabular text-[28px] font-bold leading-none tracking-tight', t.text)}>{value ?? 0}</p>
        <p className="mt-2 text-[13px] font-semibold text-slate-800">{label}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-slate-500">{hint}</p>
      </div>
      {!last && (
        <span
          aria-hidden="true"
          className="absolute -right-[14px] top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-400 shadow-xs ring-1 ring-slate-200 sm:flex"
        >
          <ChevronRight size={14} />
        </span>
      )}
    </li>
  );
}

export function SignaturePanel({ signatures }) {
  if (!signatures) return null;
  if (!signatures.available) {
    return (
      <Card title="E-signatures" icon={FileSignature}>
        <Alert tone="neutral">{signatures.message}</Alert>
      </Card>
    );
  }
  const env = signatures.envelope || {};
  const aadhaar = signatures.aadhaar;

  return (
    <Card
      title="Signing pipeline"
      subtitle="Zoho Sign · Aadhaar eSign"
      icon={FileSignature}
      actions={<HeaderLink to="/signatures">Signature hub</HeaderLink>}
    >
      <ol className="flex flex-col gap-3 sm:flex-row sm:gap-5">
        <Stage label="With employee" hint="Waiting for their Aadhaar OTP" value={env.pending_candidate_otp} tone="sky" />
        <Stage
          label="With HR"
          hint="Waiting for your countersign"
          value={env.awaiting_hr_countersign}
          tone={env.awaiting_hr_countersign ? 'amber' : 'slate'}
        />
        <Stage label="Completed" hint="Sealed and filed" value={env.completed} tone="green" last />
      </ol>

      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div>
          <div className="mb-2 flex justify-between text-[12.5px]">
            <span className="text-slate-500">Completion rate</span>
            <span className="tabular font-semibold text-slate-900">{env.completion_rate_percentage ?? 0}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-700 ease-out"
              style={{ width: `${Math.min(100, env.completion_rate_percentage || 0)}%` }}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge tone={env.retryable ? 'warning' : 'neutral'}>Parked {env.retryable ?? 0}</Badge>
          <Badge tone={env.failed ? 'danger' : 'neutral'}>Failed {env.failed ?? 0}</Badge>
        </div>
      </div>

      {/* The figures above add both envelopes together; this splits them. */}
      {signatures.envelopes && (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {Object.values(signatures.envelopes).map((e) => (
            <li key={e.envelope_type} className="rounded-lg bg-slate-50 px-3 py-2 text-[12.5px]">
              <span className="block font-semibold text-slate-800">{e.envelope_label}</span>
              <span className="tabular text-slate-500">
                {e.completed ?? 0} completed · {e.awaiting_hr_countersign ?? 0} with HR · {e.pending_candidate_otp ?? 0} with employee
              </span>
            </li>
          ))}
        </ul>
      )}

      {aadhaar?.available && aadhaar.signed_total > 0 && (
        <div
          className={clsx(
            'mt-5 flex items-start gap-3 rounded-xl px-4 py-3 text-[13px] ring-1 ring-inset',
            aadhaar.compliant ? 'bg-emerald-50/60 text-emerald-900 ring-emerald-100' : 'bg-red-50/70 text-red-900 ring-red-100',
          )}
        >
          <ShieldCheck size={17} className={clsx('mt-px shrink-0', aadhaar.compliant ? 'text-emerald-500' : 'text-red-500')} />
          <p className="leading-relaxed">
            <span className="font-semibold">Aadhaar compliance {aadhaar.compliance_rate_percentage}%</span>
            <span className="opacity-80"> · {aadhaar.message}</span>
          </p>
        </div>
      )}
    </Card>
  );
}

/* --------------------------------------------------------------- Stalled */
const URGENCY_TONE = { High: 'danger', Medium: 'warning', Low: 'neutral' };
const URGENCY_LEVELS = [
  { level: 'High', cls: 'text-red-600' },
  { level: 'Medium', cls: 'text-amber-600' },
  { level: 'Low', cls: 'text-slate-700' },
];

export function StalledPanel({ stuck }) {
  if (!stuck) return null;
  const rows = stuck.top_stuck || [];
  return (
    <Card
      title="Stalled onboarding"
      subtitle="Longest idle first"
      icon={UserCheck}
      flush
      actions={stuck.total_stuck > 0 ? <HeaderLink to="/onboarding-tracker">All {stuck.total_stuck}</HeaderLink> : null}
    >
      {stuck.total_stuck > 0 && (
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
          {URGENCY_LEVELS.map(({ level, cls }) => (
            <div key={level} className="px-3 py-3.5 text-center">
              <p className={clsx('tabular text-[22px] font-bold leading-none', stuck.urgency_summary?.[level] ? cls : 'text-slate-300')}>
                {stuck.urgency_summary?.[level] ?? 0}
              </p>
              <p className="mt-1.5 text-[11.5px] font-medium text-slate-500">{level} urgency</p>
            </div>
          ))}
        </div>
      )}
      {rows.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nobody is stalled" description="Every active onboarding is moving." className="py-10" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => (
            <li key={row.tenant_id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/80">
              <Avatar name={row.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-slate-800">{row.name || 'Unnamed'}</p>
                <p className="truncate text-[12px] text-slate-500">
                  {row.current_step_name} · {row.days_inactive > 0 ? `${row.days_inactive}d idle` : `${row.hours_inactive}h idle`}
                </p>
              </div>
              <Badge tone={URGENCY_TONE[row.urgency]} dot>
                {row.urgency}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------- Dispatch */
export function DispatchPanel({ documents }) {
  if (!documents?.available) return null;
  const health = documents.delivery_health || {};
  const types = documents.by_type || [];
  const max = Math.max(1, ...types.map((t) => t.this_month || 0));
  const rate = health.success_rate_percentage ?? pct(health.emails_sent, health.emails_attempted);

  return (
    <Card title="Document dispatch" subtitle="Letters and payslips issued by HR" icon={FileText} actions={<HeaderLink to="/documents/history">History</HeaderLink>}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="flex items-baseline gap-2">
            <p className="tabular text-[34px] font-bold leading-none tracking-[-0.02em] text-slate-950">{documents.total_this_month}</p>
            <p className="text-[13px] text-slate-500">
              issued this month · <span className="tabular">{documents.total_all_time}</span> all time
            </p>
          </div>
          <ul className="mt-6 space-y-3">
            {types.map((t) => (
              <li key={t.document_type} className="grid grid-cols-[minmax(0,230px)_minmax(0,1fr)_auto] items-center gap-3 text-[13px]">
                <span className="truncate text-slate-600" title={DOCUMENT_TYPES[t.document_type] || t.label}>{DOCUMENT_TYPES[t.document_type] || t.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-accent-300 to-accent-500 transition-[width] duration-700 ease-out"
                    style={{ width: `${((t.this_month || 0) / max) * 100}%` }}
                  />
                </span>
                <span className="tabular w-16 text-right font-semibold text-slate-900">
                  {t.this_month}
                  <span className="ml-1 font-normal text-slate-400">/ {t.total}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-slate-50/80 p-5 ring-1 ring-inset ring-slate-100">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Email delivery</p>
          <div className="mt-3 flex items-center gap-4">
            <Ring value={rate} size={76} stroke={8} color={health.emails_failed ? '#f59e0b' : '#10b981'}>
              <span className="tabular text-[16px] font-bold text-slate-950">{rate}%</span>
            </Ring>
            <div className="flex-1 space-y-2">
              <DotRow dot="bg-emerald-500" label="Delivered" value={health.emails_sent} />
              <DotRow dot="bg-red-400" label="Failed" value={health.emails_failed} />
              <DotRow dot="bg-slate-300" label="Download only" value={health.not_requested} />
            </div>
          </div>
          {health.emails_failed > 0 && (
            <Link
              to="/documents/history?email_status=failed"
              className="mt-4 flex items-center gap-1.5 text-[12.5px] font-semibold text-red-600 hover:underline"
            >
              <MailWarning size={14} /> Review failed emails
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
