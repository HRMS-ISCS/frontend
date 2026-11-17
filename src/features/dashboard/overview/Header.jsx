/**
 * The top of the HR dashboard: today's date, a greeting, one sentence that
 * says whether anything needs HR, and the actions HR reaches for most.
 *
 * The summary sentence is built only from the overview payload, so it can
 * never claim more than the numbers underneath it.
 */
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { BadgeIndianRupee, CalendarDays, FileText, RefreshCw } from 'lucide-react';

import { formatDateTime, greeting, pluralize } from '@/lib/format';
import { display } from '@/features/landing/site/primitives';

function summaryLine(data) {
  const attention = data?.action_required?.items?.length ?? 0;
  const countersign = data?.signature_status?.awaiting_countersign_total ?? 0;
  const celebrations = data?.celebrations || {};
  const today =
    (celebrations.upcoming_birthdays || []).filter((b) => b.is_today).length +
    (celebrations.upcoming_anniversaries || []).filter((a) => a.is_today).length;

  const parts = [];
  if (attention) parts.push(`${pluralize(attention, 'item')} need${attention === 1 ? 's' : ''} your attention`);
  if (countersign) parts.push(`${pluralize(countersign, 'employee')} waiting on your countersign`);
  if (today) parts.push(`${pluralize(today, 'celebration')} today`);
  if (!parts.length) return 'Everything is on track. Nothing needs you right now.';
  return `${parts.join(' · ')}.`;
}

const QUICK_ACTIONS = [
  { to: '/letters/proposed-offer', label: 'Generate letter', icon: FileText, primary: true },
  { to: '/payroll/run', label: 'Run payroll', icon: BadgeIndianRupee },
];

export function DashboardHeader({ firstName, isSuperadmin, data, onRefresh, refreshing }) {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium text-slate-500">
          <CalendarDays size={14} className="text-slate-400" />
          {today}
          <span className="text-slate-300">·</span>
          <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11.5px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
            {isSuperadmin ? 'Super Admin' : 'HR'}
          </span>
        </p>
        <h1 className={clsx(display, 'mt-2 text-[28px] font-bold leading-tight tracking-[-0.02em] text-slate-950 sm:text-[32px]')}>
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1.5 text-[14.5px] text-slate-500">{summaryLine(data)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh"
          className="group inline-flex h-10 items-center gap-2 rounded-xl px-3 text-[12.5px] text-slate-500 transition-colors hover:bg-white hover:text-slate-800 hover:shadow-xs disabled:opacity-70"
        >
          <RefreshCw size={14} className={clsx('transition-transform', refreshing ? 'animate-spin' : 'group-hover:rotate-45')} />
          <span className="tabular">Updated {formatDateTime(data?.generated_at)}</span>
        </button>
        {QUICK_ACTIONS.map(({ to, label, icon: Icon, primary }) => (
          <Link
            key={to}
            to={to}
            className={clsx(
              'inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold transition-all active:scale-[0.98]',
              primary
                ? 'bg-brand-600 text-white shadow-brand-glow hover:bg-brand-700'
                : 'border border-slate-200 bg-white text-slate-700 shadow-xs hover:border-slate-300 hover:text-slate-900',
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>
    </header>
  );
}
