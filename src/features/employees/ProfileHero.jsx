/**
 * Employee 360 header and vitals.
 *
 * Read-only: every figure here comes from an endpoint the page already calls.
 * Nothing new is written, and no new backend route is required.
 */
import clsx from 'clsx';
import {
  BadgeIndianRupee,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileSignature,
  FileText,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';

import { employeeType, formatDate, formatLPA } from '@/lib/format';
import { Avatar, Badge, ProgressBar } from '@/components/ui';

/** Whole months between a date and today, rendered as "2y 4m". */
export function tenureFrom(dateOfJoining) {
  if (!dateOfJoining) return null;
  const start = new Date(dateOfJoining);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) return { label: 'Not started', months: 0 };
  const y = Math.floor(months / 12);
  const m = months % 12;
  return { label: y ? `${y}y ${m}m` : `${m}m`, months };
}

/** The seven things onboarding actually collects, in wizard order. */
export function onboardingChecklist(record) {
  const p = record?.personal_profile;
  return [
    ['Basic details', true],
    ['Personal profile', Boolean(Array.isArray(p) ? p.length : p)],
    ['Bank account', Boolean(record?.bank_account)],
    ['Education', (record?.academic_background || []).length > 0],
    ['Experience / training', (record?.professional_experience || []).length + (record?.professional_training || []).length > 0],
    ['References', (record?.professional_reference || []).length > 0],
    ['Declaration', Boolean(record?.declaration)],
  ];
}

function Fact({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-caption text-white/85">
      <Icon size={13.5} className="shrink-0 text-white/60" />
      <span className="truncate">{children}</span>
    </span>
  );
}

/* The four vitals HR sees. Kept as the default so the HR 360 page is
 * unchanged; the employee's own profile passes its own set, because the
 * salary-structure endpoint is HR-only and a CTC tile there could never
 * be anything but empty. */
function hrVitals(record) {
  return [
    { key: 'ctc', icon: BadgeIndianRupee, label: 'Annual CTC', value: record.__ctc ? formatLPA(record.__ctc) : '—', sub: record.__ctc ? null : 'No salary structure', tone: 'violet' },
    { key: 'docs', icon: FileText, label: 'Documents issued', value: record.__docCount ?? '—', sub: record.__lastDoc ? `Last ${formatDate(record.__lastDoc)}` : null },
    { key: 'sig', icon: FileSignature, label: 'E-signature', value: record.__sigLabel || '—', sub: record.__sigSub, tone: record.__sigTone || 'neutral' },
  ];
}

export function ProfileHero({ record, photo, actions, vitals }) {
  const tenure = tenureFrom(record.date_of_joining);
  const done = onboardingChecklist(record).filter(([, ok]) => ok).length;
  const complete = done === 7;

  return (
    <div className="overflow-hidden rounded-panel shadow-raised">
      {/* Identity band. The gradient is the one bold surface on this page; the
          cards below stay quiet so the person reads as the subject. */}
      <div className="relative bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 px-6 pb-6 pt-7 sm:px-8">
        <div className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-40 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar
            name={record.name}
            src={photo}
            size="xl"
            className="shrink-0 ring-4 ring-white/25 shadow-lg shadow-slate-950/20"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-display text-white">{record.name}</h1>
              <span className="tabular rounded-lg bg-white/15 px-2 py-0.5 text-xs font-bold text-white ring-1 ring-inset ring-white/20">
                {record.employee_id}
              </span>
              <span className="rounded-lg bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/90 ring-1 ring-inset ring-white/15">
                {employeeType(record.employee_id)}
              </span>
              {complete ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-400/20 px-2 py-0.5 text-xs font-semibold text-emerald-100 ring-1 ring-inset ring-emerald-300/30">
                  <CheckCircle2 size={12} /> Onboarded
                </span>
              ) : (
                <span className="tabular inline-flex items-center gap-1 rounded-lg bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-100 ring-1 ring-inset ring-amber-300/30">
                  <Clock size={12} /> {done}/7 steps
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <Fact icon={Briefcase}>{record.position}</Fact>
              <Fact icon={MapPin}>{record.client}</Fact>
              <Fact icon={CalendarDays}>
                {record.date_of_joining ? `Joined ${formatDate(record.date_of_joining)}` : null}
              </Fact>
              <Fact icon={Mail}>{record.email}</Fact>
              <Fact icon={Phone}>{record.phone}</Fact>
            </div>
          </div>

          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
      </div>

      {/* Vitals strip. Sits directly under the identity band so the numbers
          that matter are answered before any tab is opened. */}
      <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 bg-white sm:grid-cols-4">
        <Vital icon={Clock} label="Tenure" value={tenure?.label || '—'} sub={record.date_of_joining ? null : 'No joining date'} />
        {(vitals || hrVitals(record)).map((v) => (
          <Vital key={v.key} icon={v.icon} label={v.label} value={v.value} sub={v.sub} tone={v.tone} />
        ))}
      </div>

      {!complete && (
        <div className="border-t border-slate-100 bg-amber-50/60 px-5 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-caption font-semibold text-amber-900">Onboarding {Math.round((done / 7) * 100)}% complete</span>
            <ProgressBar value={(done / 7) * 100} tone="warning" size="sm" className="max-w-[220px] flex-1" />
          </div>
        </div>
      )}
    </div>
  );
}

const VITAL_TONES = {
  brand: 'bg-brand-50 text-brand-600',
  violet: 'bg-accent-50 text-accent-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
  neutral: 'bg-slate-100 text-slate-500',
};

function Vital({ icon: Icon, label, value, sub, tone = 'brand' }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
      <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', VITAL_TONES[tone])}>
        <Icon size={16} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="eyebrow">{label}</p>
        <p className="tabular mt-0.5 truncate text-[15px] font-bold text-slate-900">{value}</p>
        {sub && <p className="truncate text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

/** Onboarding completeness as a checklist rather than a list of yes/no rows. */
export function OnboardingChecklist({ record }) {
  const items = onboardingChecklist(record);
  return (
    <ul className="space-y-2.5">
      {items.map(([label, ok]) => (
        <li key={label} className="flex items-center gap-3">
          <span
            className={clsx(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
              ok ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300 ring-1 ring-inset ring-slate-200',
            )}
          >
            {ok ? <CheckCircle2 size={13} strokeWidth={2.5} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
          </span>
          <span className={clsx('text-caption', ok ? 'font-medium text-slate-700' : 'text-slate-400')}>{label}</span>
          {ok && <Badge tone="success" className="ml-auto">Done</Badge>}
        </li>
      ))}
    </ul>
  );
}
