/**
 * The four headline numbers. Each tile is a link to the page that explains
 * it, and each carries a small visual of how the number breaks down - so the
 * tile answers "how many" and "made of what" before anyone clicks.
 */
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowUpRight, CheckCircle2, FileSignature, FileText, Users, Workflow } from 'lucide-react';

import { pct, SegmentBar } from './widgets';

const TONE = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-100',
  green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  violet: 'bg-accent-50 text-accent-600 ring-accent-100',
};

function Tile({ to, label, value, icon: Icon, tone, visual, foot, alert }) {
  return (
    <Link
      to={to}
      className={clsx(
        'group relative flex flex-col overflow-hidden rounded-card border bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float',
        alert ? 'border-amber-200 hover:border-amber-300' : 'border-slate-200/80 hover:border-brand-200',
      )}
    >
      {alert && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-400 to-orange-400" />}
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset', TONE[tone])}>
            <Icon size={16} strokeWidth={2} />
          </span>
          <span className="truncate text-[13px] font-medium text-slate-600">{label}</span>
        </span>
        <ArrowUpRight
          size={16}
          className="shrink-0 text-slate-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-500"
        />
      </div>
      <p className="tabular mt-4 text-[34px] font-bold leading-none tracking-[-0.02em] text-slate-950">{value}</p>
      <div className="mt-4 flex h-5 items-center">{visual}</div>
      <p className="mt-2.5 truncate text-[12.5px] text-slate-500">{foot}</p>
    </Link>
  );
}

export function KpiTiles({ data }) {
  const head = data.headcount || {};
  const funnel = data.onboarding_funnel || {};
  const sig = data.signature_status || {};
  const docs = data.document_metrics || {};
  const health = docs.delivery_health || {};

  const countersign = sig.awaiting_countersign_total ?? 0;
  const onboardings = (funnel.completed_count || 0) + (funnel.in_progress_count || 0) + (funnel.not_started_count || 0);

  return (
    <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tile
        to="/employees"
        label="Employees"
        icon={Users}
        tone="brand"
        value={head.total_employees ?? 0}
        visual={
          <SegmentBar
            parts={[
              { value: head.internal_employees, className: 'bg-brand-500' },
              { value: head.external_employees, className: 'bg-accent-400' },
            ]}
          />
        }
        foot={
          <>
            <span className="font-semibold text-slate-700">{head.internal_employees ?? 0}</span> internal ·{' '}
            <span className="font-semibold text-slate-700">{head.external_employees ?? 0}</span> external
          </>
        }
      />

      <Tile
        to="/onboarding-tracker"
        label="Onboarding completion"
        icon={Workflow}
        tone="green"
        value={`${Math.round(funnel.completion_rate_percentage ?? 0)}%`}
        visual={
          <SegmentBar
            parts={[
              { value: funnel.completed_count, className: 'bg-emerald-500' },
              { value: funnel.in_progress_count, className: 'bg-brand-400' },
              { value: funnel.not_started_count, className: 'bg-slate-300' },
            ]}
          />
        }
        foot={`${funnel.completed_count ?? 0} of ${onboardings} done · ${funnel.in_progress_count ?? 0} in progress`}
      />

      <Tile
        to="/signatures"
        label="Awaiting countersign"
        icon={FileSignature}
        tone={countersign ? 'amber' : 'green'}
        alert={countersign > 0}
        value={countersign}
        visual={
          countersign ? (
            <p className="text-[12.5px] font-semibold text-amber-700">Signed by employees, waiting on you →</p>
          ) : (
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-700">
              <CheckCircle2 size={14} /> All caught up
            </p>
          )
        }
        foot={`${sig.completed_total ?? 0} employee(s) fully signed in total`}
      />

      <Tile
        to="/documents/history"
        label="Documents this month"
        icon={FileText}
        tone="violet"
        value={docs.total_this_month ?? 0}
        visual={
          <SegmentBar
            parts={[
              { value: health.emails_sent, className: 'bg-emerald-500' },
              { value: health.emails_failed, className: 'bg-red-400' },
              { value: health.not_requested, className: 'bg-slate-300' },
            ]}
          />
        }
        foot={
          health.emails_failed ? (
            <span className="font-semibold text-red-600">{health.emails_failed} email failures to review</span>
          ) : (
            `${health.success_rate_percentage ?? pct(health.emails_sent, health.emails_attempted)}% email delivery · ${docs.total_all_time ?? 0} all time`
          )
        }
      />
    </div>
  );
}
