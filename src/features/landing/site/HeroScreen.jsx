/**
 * The hero product shot: the HR dashboard as it looks in the portal, drawn in
 * HTML so it stays sharp and never drifts from the real UI. Decorative only -
 * aria-hidden, sample names and figures.
 *
 * Salary figures follow the real formula for an annual CTC of ₹12,00,000.
 */
import clsx from 'clsx';
import {
  BadgeIndianRupee,
  Bell,
  CalendarDays,
  CheckCircle2,
  FileSignature,
  FileText,
  Fingerprint,
  History,
  LayoutDashboard,
  PenLine,
  Receipt,
  RotateCcw,
  Search,
  Settings2,
  UploadCloud,
  UserPlus,
  Users,
  Workflow,
} from 'lucide-react';

import { BrowserFrame, Chip, Initials, MockLabel } from './primitives';

const SIDEBAR = [
  { section: null, items: [['Dashboard', LayoutDashboard, true]] },
  { section: 'People', items: [['Employees', Users], ['Onboarding Tracker', Workflow]] },
  { section: 'Documents', items: [['Letter Generation', FileText], ['E-Signatures', FileSignature], ['Document Dispatch History', History]] },
  { section: 'Payroll', items: [['Salary Structures', BadgeIndianRupee], ['Payslip Generator', Receipt], ['Payslip Uploads', UploadCloud]] },
  { section: 'Organisation', items: [['Users & Access', UserPlus], ['Positions', Settings2]] },
];

/* Mirrors the real dashboard's KPI tiles: value, a bar of what it is made of, a footnote. */
const STATS = [
  { label: 'Employees', value: '128', foot: '96 internal · 32 external', tone: 'text-brand-600 bg-brand-50', icon: Users,
    bar: [[75, 'bg-brand-500'], [25, 'bg-violet-400']] },
  { label: 'Onboarding completion', value: '86%', foot: '43 of 50 done · 7 in progress', tone: 'text-emerald-600 bg-emerald-50', icon: Workflow,
    bar: [[86, 'bg-emerald-500'], [14, 'bg-brand-400']] },
  { label: 'Awaiting countersign', value: '3', foot: '58 packages completed in total', tone: 'text-amber-600 bg-amber-50', icon: FileSignature,
    alert: true },
  { label: 'Documents this month', value: '42', foot: '100% email delivery · 318 all time', tone: 'text-violet-600 bg-violet-50', icon: FileText,
    bar: [[90, 'bg-emerald-500'], [10, 'bg-slate-300']] },
];

const WORKLIST = [
  { name: 'Ananya Rao', id: 'ISCSE104', reason: 'Signed by employee · NDA & policies', chip: ['2 days on you', 'amber'], action: ['Countersign', PenLine, true] },
  { name: 'Rahul Verma', id: 'ISCSI088', reason: 'Signed by employee · Appointment letter', chip: ['today · on you', 'slate'], action: ['Countersign', PenLine, true] },
  { name: 'Karthik Menon', id: 'ISCSI091', reason: 'Opened the package but has not signed', chip: ['3 days waiting', 'amber'], action: ['Remind', Bell] },
  { name: 'Divya Iyer', id: 'ISCSE107', reason: 'Waiting on appointment letter and NDA', chip: ['pending service', 'sky'], action: ['Send', RotateCcw] },
];

const FUNNEL = [
  ['Basic details', 1],
  ['Personal profile', 2],
  ['Bank & background', 1],
  ['Experience', 2],
  ['References', 0],
  ['Declaration & signing', 1],
];

/* The mock is drawn at a fixed desktop width and never reflows - the hero
 * scales the whole thing to fit (FitToWidth), so on a phone it reads as a
 * smaller screenshot rather than a cramped mobile layout. That is why nothing
 * below uses responsive (sm:/md:/lg:) classes. */
export const DASHBOARD_WIDTH = 1100;

function Sidebar() {
  return (
    <aside className="flex w-[196px] shrink-0 flex-col bg-[#0f1729] px-3 py-4">
      {/* Same treatment as the real sidebar: the logo on a white panel. */}
      <div className="mb-5 px-1">
        <span className="inline-flex rounded-lg bg-white px-2.5 py-1.5">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="h-7 w-auto" />
        </span>
        <p className="mt-2 px-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">HRMS Portal</p>
      </div>
      <div className="space-y-3.5">
        {SIDEBAR.map((group) => (
          <div key={group.section || 'root'}>
            {group.section && <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-wider text-slate-500">{group.section}</p>}
            {group.items.map(([label, Icon, active]) => (
              <div
                key={label}
                className={clsx(
                  'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold',
                  active ? 'bg-brand-600 text-white shadow-[0_4px_12px_-4px_rgb(49_71_230/0.6)]' : 'text-slate-400',
                )}
              >
                <Icon size={13} strokeWidth={2} className="shrink-0" />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}

export function DashboardScreen() {
  return (
    <BrowserFrame>
      <div className="flex h-[600px] bg-slate-50 text-left">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <div className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white px-4">
            <div className="flex w-56 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10.5px] text-slate-400">
              <Search size={12} className="text-brand-600" />
              <span className="flex-1 truncate">Search employees, pages…</span>
              <span className="rounded border border-slate-200 bg-white px-1 text-[9px] font-semibold">Ctrl K</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Initials name="Priya Sharma" />
              <span className="leading-tight">
                <span className="block text-[11px] font-semibold text-slate-800">Priya Sharma</span>
                <span className="block text-[9.5px] text-slate-500">HR</span>
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3.5 overflow-hidden p-5">
            {/* Header: date, greeting, one-line summary, quick actions */}
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                  <CalendarDays size={11} className="text-slate-400" />
                  Wednesday, 23 September 2026
                  <span className="rounded bg-brand-50 px-1 text-[9px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">HR</span>
                </p>
                <p className="mt-1 text-[19px] font-bold tracking-tight text-slate-950">Good morning, Priya</p>
                <p className="text-[10.5px] text-slate-500">3 packages waiting on your countersign · 1 celebration today.</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-[10px] font-semibold text-white">
                  <FileText size={11} /> Generate letter
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700">
                  <BadgeIndianRupee size={11} /> Run payroll
                </span>
              </div>
            </div>

            {/* KPI tiles */}
            <div className="grid grid-cols-4 gap-2.5">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className={clsx('relative overflow-hidden rounded-xl border bg-white p-3', s.alert ? 'border-amber-200' : 'border-slate-200/80')}
                >
                  {s.alert && <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-400" />}
                  <div className="flex items-center gap-1.5">
                    <span className={clsx('flex h-5 w-5 shrink-0 items-center justify-center rounded-md', s.tone)}>
                      <s.icon size={11} />
                    </span>
                    <p className="truncate text-[10px] font-medium text-slate-600">{s.label}</p>
                  </div>
                  <p className="mt-2 text-[21px] font-bold leading-none tracking-tight text-slate-950">{s.value}</p>
                  <div className="mt-2 flex h-3 items-center">
                    {s.bar ? (
                      <div className="flex h-1.5 w-full gap-[2px] overflow-hidden rounded-full bg-slate-100">
                        {s.bar.map(([w, c]) => (
                          <span key={c} className={clsx('h-full rounded-full', c)} style={{ width: `${w}%` }} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-[9.5px] font-semibold text-amber-700">Signed by employees, waiting on you →</p>
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-[9.5px] text-slate-500">{s.foot}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_230px] gap-3">
              {/* Worklist */}
              <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5">
                  <div>
                    <p className="text-[11.5px] font-bold text-slate-900">Worklist</p>
                    <p className="text-[9.5px] text-slate-500">The rows behind the numbers</p>
                  </div>
                  <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 text-[9.5px] font-semibold">
                    <span className="rounded-md bg-white px-2 py-0.5 text-slate-900 shadow-sm">All 4</span>
                    <span className="px-2 py-0.5 text-slate-500">Countersign 2</span>
                    <span className="px-2 py-0.5 text-slate-500">Chase 1</span>
                  </div>
                </div>
                {WORKLIST.map((row) => {
                  const [label, ActionIcon, primary] = row.action;
                  return (
                    <div key={row.id} className="flex items-center gap-2.5 border-b border-slate-100 px-3.5 py-2.5 last:border-0">
                      <Initials name={row.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-[11px] font-semibold text-slate-800">{row.name}</p>
                          <Chip tone={row.chip[1]}>{row.chip[0]}</Chip>
                        </div>
                        <p className="truncate text-[9.5px] text-slate-500">{row.id} · {row.reason}</p>
                      </div>
                      <span
                        className={clsx(
                          'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[9.5px] font-semibold',
                          primary ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-700',
                        )}
                      >
                        <ActionIcon size={10} /> {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Onboarding funnel */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
                <p className="text-[11.5px] font-bold text-slate-900">Onboarding funnel</p>
                <p className="text-[9.5px] text-slate-500">Where every joiner is right now</p>
                <div className="mt-3 space-y-2">
                  {FUNNEL.map(([label, value], i) => (
                    <div key={label}>
                      <div className="flex justify-between text-[9.5px]">
                        <span className="truncate text-slate-600">{i + 1}. {label}</span>
                        <span className={clsx('font-semibold', value === 2 ? 'text-amber-700' : 'text-slate-800')}>{value}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                        <div
                          className={clsx('h-full rounded-full', value === 2 ? 'bg-amber-400' : 'bg-brand-400')}
                          style={{ width: `${(value / 2) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* --------------------------------------------------- Floating detail cards */
const FLOAT_CARD =
  'rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-[0_24px_48px_-16px_rgb(15_23_42/0.28)] backdrop-blur';

export function EsignFloat() {
  return (
    <div aria-hidden="true" className={clsx(FLOAT_CARD, 'w-[250px]')}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Fingerprint size={16} />
        </span>
        <div className="leading-tight">
          <p className="text-[12px] font-bold text-slate-900">Aadhaar eSign</p>
          <p className="text-[10px] text-slate-500">OTP sent to ••••••4821</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-6 gap-1.5">
        {['4', '8', '2', '0', '7', '1'].map((d, i) => (
          <span key={i} className="flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[13px] font-bold text-slate-900">
            {d}
          </span>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-700">
        <CheckCircle2 size={13} /> Signed · verified by UIDAI
      </p>
    </div>
  );
}

export function PayslipFloat() {
  return (
    <div aria-hidden="true" className={clsx(FLOAT_CARD, 'w-[230px]')}>
      <div className="flex items-center justify-between">
        <MockLabel>Payslip · August 2026</MockLabel>
        <Chip tone="green">Emailed</Chip>
      </div>
      <p className="mt-2 text-[10.5px] text-slate-500">Net salary</p>
      <p className="text-[24px] font-bold leading-tight tracking-tight text-slate-900">₹89,950</p>
      <div className="mt-2.5 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
        <span className="bg-brand-500" style={{ width: '91.6%' }} />
        <span className="bg-amber-400" style={{ width: '8.4%' }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[9.5px] text-slate-500">
        <span>Earnings ₹98,200</span>
        <span>Deductions ₹8,250</span>
      </div>
    </div>
  );
}

export function OnboardingFloat() {
  const pct = 67;
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <div aria-hidden="true" className={clsx(FLOAT_CARD, 'flex w-[240px] items-center gap-3')}>
      <svg width="48" height="48" className="-rotate-90 shrink-0">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#eef2f7" strokeWidth="5" />
        <circle cx="24" cy="24" r={r} fill="none" stroke="#3147e6" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} />
      </svg>
      <div className="min-w-0 leading-tight">
        <p className="text-[12px] font-bold text-slate-900">Karthik Menon</p>
        <p className="mt-0.5 text-[10px] text-slate-500">Step 4 of 6 · Experience</p>
        <p className="mt-1 text-[10px] font-semibold text-brand-600">Progress saved 2 min ago</p>
      </div>
    </div>
  );
}
