/**
 * One detailed product screen per tab of the product tour. Drawn in HTML from
 * the portal's own layout; decorative, aria-hidden, sample data only.
 *
 * Salary figures follow the real formulas for an annual CTC of ₹12,00,000:
 *   gross 98,200 = basic 58,920 + HRA 23,568 + conveyance 8,838 + CCA 6,874
 */
import clsx from 'clsx';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Fingerprint,
  Info,
  Lock,
  Mail,
  PenLine,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';

import { BrowserFrame, Chip, Initials, MockLabel } from './primitives';

const FIELD = 'rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-800';

function Field({ label, value, className, muted }) {
  return (
    <div className={className}>
      <p className="mb-1 text-[10px] font-semibold text-slate-600">{label}</p>
      <div className={clsx(FIELD, 'truncate whitespace-nowrap', muted && 'text-slate-400')}>{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------ Onboarding */
const STEPS = ['Basic details', 'Personal profile', 'Bank & background', 'Experience', 'References', 'Declaration'];

export function OnboardingScreen() {
  return (
    <BrowserFrame url="iscshrms.vercel.app/onboarding">
      <div className="grid bg-slate-50 p-4 text-left sm:grid-cols-[170px_1fr] sm:gap-4">
        <div className="hidden rounded-xl border border-slate-200/80 bg-white p-3 sm:block">
          <div className="flex items-baseline justify-between">
            <p className="text-[10.5px] font-semibold text-slate-800">Your progress</p>
            <p className="text-[14px] font-bold text-brand-600">50%</p>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
            <div className="h-full w-1/2 rounded-full bg-brand-600" />
          </div>
          <ol className="mt-3 space-y-1">
            {STEPS.map((s, i) => {
              const done = i < 3;
              const active = i === 3;
              return (
                <li key={s} className={clsx('flex items-center gap-2 rounded-lg px-1.5 py-1.5', active && 'bg-brand-50')}>
                  <span
                    className={clsx(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
                      done && 'bg-emerald-500 text-white',
                      active && 'bg-brand-600 text-white',
                      !done && !active && 'bg-white text-slate-400 ring-1 ring-slate-300',
                    )}
                  >
                    {done ? <Check size={11} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={clsx('truncate text-[10px] font-semibold', active ? 'text-brand-700' : done ? 'text-slate-700' : 'text-slate-400')}>
                    {s}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-[9.5px] font-semibold uppercase tracking-wider text-brand-600">Step 4 of 6</p>
            <p className="text-[14px] font-bold tracking-tight text-slate-900">Training &amp; experience</p>
          </div>
          <div className="space-y-3.5 px-4 py-3.5">
            <div>
              <p className="mb-1.5 text-[10px] font-semibold text-slate-600">Do you have previous work experience?</p>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-[10.5px] font-semibold">
                <span className="rounded-md bg-brand-600 px-3 py-1 text-white">Yes</span>
                <span className="px-3 py-1 text-slate-500">No</span>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="mb-2.5 text-[10.5px] font-semibold text-slate-700">Wipro Technologies</p>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Company" value="Wipro Technologies" />
                <Field label="Designation" value="Software Engineer" />
                <Field label="From" value="04 Jul 2022" />
                <Field label="To" value="30 Jun 2026" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['Experience', true],
                ['Relieving', true],
                ['Payslip', false],
              ].map(([label, done]) => (
                <div key={label} className={clsx('flex items-center gap-1.5 rounded-lg border px-2 py-2 text-[9.5px]', done ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800' : 'border-dashed border-slate-300 text-slate-500')}>
                  {done ? <CheckCircle2 size={12} className="shrink-0" /> : <UploadCloud size={12} className="shrink-0" />}
                  <span className="truncate font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-b-xl border-t border-slate-100 bg-slate-50/70 px-4 py-2.5">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <CheckCircle2 size={12} className="text-emerald-500" /> Progress saved 2 min ago
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-[10.5px] font-semibold text-white">
              Save &amp; continue <ArrowRight size={11} />
            </span>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* --------------------------------------------------------------- eSign */
const PACK = [
  'Appointment Letter',
  'Non-Disclosure Agreement',
  'Employee Handbook',
  'COBEC Policy',
  'ABAC Policy',
  'Information Security Policy',
  'Diversity & Equal Opportunities',
  'Operational Risk Management',
  'Secure Development Policy',
  'Employee Declaration',
];

export function EsignScreen() {
  return (
    <BrowserFrame url="iscshrms.vercel.app/me/signing">
      <div className="relative grid bg-slate-100 text-left sm:grid-cols-[1fr_190px]">
        {/* Document page */}
        <div className="p-4">
          <div className="mx-auto max-w-[340px] rounded-md bg-white px-6 py-5 shadow-[0_4px_16px_-4px_rgb(15_23_42/0.2)]">
            <p className="text-[11px] font-bold text-slate-900">APPOINTMENT LETTER</p>
            <p className="mt-0.5 text-[8.5px] text-slate-400">ISCS Technologies Private Limited · Hyderabad</p>
            <div className="mt-3 space-y-1.5">
              {[92, 100, 86, 97, 74, 100, 88, 62].map((w, i) => (
                <span key={i} className="block h-1 rounded-full bg-slate-200" style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <div className="flex h-9 items-end rounded border-2 border-dashed border-brand-400 bg-brand-50/60 px-2 pb-1">
                  <span className="font-serif text-[15px] italic text-brand-800">Ananya Rao</span>
                </div>
                <p className="mt-1 text-[8px] text-slate-500">Employee · Aadhaar eSign</p>
              </div>
              <div>
                <div className="h-9 rounded border border-dashed border-slate-300" />
                <p className="mt-1 text-[8px] text-slate-400">Authorised signatory</p>
              </div>
            </div>
          </div>
        </div>

        {/* Package list */}
        <div className="hidden border-l border-slate-200 bg-white p-3 sm:block">
          <MockLabel>Signing package · 10</MockLabel>
          <ol className="mt-2 space-y-1">
            {PACK.map((doc, i) => (
              <li key={doc} className="flex items-center gap-1.5 text-[9.5px] text-slate-700">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[8px] font-bold text-slate-500">{i + 1}</span>
                <span className="truncate">{doc}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Aadhaar OTP dialog */}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/25 p-4">
          <div className="w-full max-w-[290px] rounded-2xl bg-white p-4 shadow-[0_24px_60px_-12px_rgb(15_23_42/0.5)]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Fingerprint size={17} />
              </span>
              <div className="leading-tight">
                <p className="text-[12.5px] font-bold text-slate-900">Aadhaar eSign</p>
                <p className="text-[10px] text-slate-500">Enter the OTP sent to ••••••4821</p>
              </div>
            </div>
            <div className="mt-3.5 grid grid-cols-6 gap-1.5">
              {['4', '8', '2', '0', '7', ''].map((d, i) => (
                <span
                  key={i}
                  className={clsx(
                    'flex h-9 items-center justify-center rounded-lg border text-[14px] font-bold text-slate-900',
                    d ? 'border-slate-200 bg-slate-50' : 'border-brand-500 ring-2 ring-brand-100',
                  )}
                >
                  {d}
                </span>
              ))}
            </div>
            <span className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 py-2 text-[11px] font-semibold text-white">
              <PenLine size={12} /> Sign NDA &amp; policies
            </span>
            <p className="mt-2.5 flex items-center justify-center gap-1 text-[9px] text-slate-500">
              <ShieldCheck size={11} className="text-emerald-600" /> Verified by UIDAI · never stored by ISCS
            </p>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* -------------------------------------------------------------- Payslip */
const EARNINGS = [
  ['Basic salary', '58,920'],
  ['House rent allowance', '23,568'],
  ['Conveyance allowance', '8,838'],
  ['City compensatory allowance', '6,874'],
];
const DEDUCTIONS = [
  ['Provident fund', '1,800'],
  ['ESI', '0'],
  ['Professional tax', '200'],
  ['Income tax (TDS)', '6,250'],
  ['Health insurance', '0'],
];

export function PayslipScreen() {
  return (
    <BrowserFrame url="iscshrms.vercel.app/me/payslips">
      <div className="bg-slate-100 p-4 text-left">
        <div className="mx-auto max-w-[480px] rounded-md bg-white p-5 shadow-[0_4px_16px_-4px_rgb(15_23_42/0.2)]">
          <div className="flex items-start justify-between border-b border-slate-200 pb-3">
            <div>
              <p className="text-[11.5px] font-bold text-slate-900">ISCS Technologies Private Limited</p>
              <p className="text-[8.5px] text-slate-500">Begumpet, Hyderabad 500016</p>
            </div>
            <Chip tone="brand">Confidential</Chip>
          </div>
          <p className="mt-3 text-center text-[12px] font-bold text-slate-900">Pay Slip for the month of August - 2026</p>
          <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1 text-[9.5px]">
            {[
              ['Employee No', 'ISCSI087'],
              ['PAN', 'ABCPR••••F'],
              ['Name', 'Ananya Rao'],
              ['UAN', '1009••••2521'],
              ['Designation', 'Senior Software Engineer'],
              ['Bank', 'Axis Bank'],
              ['Working / paid days', '26 / 26'],
              ['Gross salary', '98,200'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 border-b border-slate-100 py-1">
                <span className="text-slate-500">{k}</span>
                <span className="truncate font-semibold text-slate-800">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 text-[9.5px]">
            {[
              ['Earnings', EARNINGS, '98,200'],
              ['Deductions', DEDUCTIONS, '8,250'],
            ].map(([title, rows, total]) => (
              <div key={title}>
                <p className="border-b-2 border-slate-800 pb-1 font-bold text-slate-900">{title}</p>
                {rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 text-slate-600">
                    <span className="truncate pr-2">{k}</span>
                    <span className="tabular-nums">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-slate-300 pt-1 font-bold text-slate-900">
                  <span>Total</span>
                  <span className="tabular-nums">{total}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2">
            <div>
              <p className="text-[9px] font-semibold text-brand-700">Net salary</p>
              <p className="text-[8.5px] text-brand-700/80">Rupees Eighty Nine Thousand Nine Hundred Fifty only</p>
            </div>
            <p className="text-[17px] font-bold tracking-tight text-brand-900">₹89,950</p>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* -------------------------------------------------------------- Letters */
const ANNEXURE = [
  ['Basic salary', '58,920', '7,07,040'],
  ['House rent allowance', '23,568', '2,82,816'],
  ['Conveyance', '8,838', '1,06,056'],
  ['City compensatory', '6,874', '82,488'],
  ['Gross salary', '98,200', '11,78,400', true],
  ['Employer PF', '1,800', '21,600'],
  ['Cost to company', '1,00,000', '12,00,000', true],
];

export function LetterScreen() {
  return (
    <BrowserFrame url="iscshrms.vercel.app/letters/appointment">
      <div className="grid gap-3 bg-slate-50 p-4 text-left sm:grid-cols-[1fr_230px]">
        <div className="rounded-xl border border-slate-200/80 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <FileText size={14} />
            </span>
            <p className="text-[13px] font-bold text-slate-900">Appointment letter</p>
          </div>
          <div className="space-y-3 p-4">
            <div>
              <p className="mb-1 text-[10px] font-semibold text-slate-600">Autofill from employee</p>
              <div className={clsx(FIELD, 'flex items-center gap-2')}>
                <Initials name="Ananya Rao" size="h-5 w-5 text-[8px]" />
                <span className="font-semibold">Ananya Rao</span>
                <span className="text-[10px] text-slate-400">ISCSE104</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Designation" value="Senior Software Engineer" />
              <Field label="Date of joining" value="01 / 10 / 2026" />
              <Field label="Annual CTC (₹)" value="12,00,000" />
              <Field label="Salutation" value="Ms." />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold text-slate-600">To</p>
              <div className={clsx(FIELD, 'flex flex-wrap gap-1')}>
                <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[9.5px] font-medium text-brand-700">ananya.rao@gmail.com</span>
                <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[9.5px] font-medium text-brand-700">hr@iscstech.com</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-b-xl border-t border-slate-100 bg-slate-50/70 px-4 py-2.5">
            <span className="text-[9.5px] text-slate-500">Filed for Zoho signing</span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-[10.5px] font-semibold text-white">
              <Mail size={11} /> Generate &amp; email
            </span>
          </div>
        </div>

        <div className="hidden rounded-xl border border-slate-200/80 bg-white p-3.5 sm:block">
          <p className="text-[11.5px] font-bold text-slate-900">Salary breakup</p>
          <p className="text-[9.5px] text-slate-500">Exactly as printed in Annexure II</p>
          <div className="mt-2.5 rounded-lg bg-brand-50 px-2.5 py-2">
            <p className="text-[14px] font-bold text-brand-900">₹12,00,000</p>
            <p className="text-[9px] text-brand-700">12 LPA · Rupees Twelve Lakhs only</p>
          </div>
          <div className="mt-2.5 grid grid-cols-[1fr_auto_auto] gap-x-2 text-[8.5px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Component</span>
            <span className="text-right">Month</span>
            <span className="w-11 text-right">Year</span>
          </div>
          {ANNEXURE.map(([k, m, y, strong]) => (
            <div
              key={k}
              className={clsx(
                'grid grid-cols-[1fr_auto_auto] gap-x-2 border-b border-slate-100 py-1 text-[9.5px] last:border-0',
                strong ? 'font-bold text-slate-900' : 'text-slate-600',
              )}
            >
              <span className="truncate">{k}</span>
              <span className="text-right tabular-nums">{m}</span>
              <span className="w-11 text-right tabular-nums">{y}</span>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

/* -------------------------------------------------------- HR dashboard */
const ACTIONS = [
  { icon: AlertOctagon, rail: 'bg-red-500', chip: 'bg-red-50 text-red-600', text: '3 document packages are waiting for the company counter-signature.', count: '3', tone: 'red' },
  { icon: AlertOctagon, rail: 'bg-red-500', chip: 'bg-red-50 text-red-600', text: '2 employees have been stuck in onboarding for more than 3 days.', count: '2', tone: 'red' },
  { icon: AlertTriangle, rail: 'bg-amber-500', chip: 'bg-amber-50 text-amber-600', text: '1 signing envelope expired before it was signed.', count: '1', tone: 'amber' },
  { icon: Info, rail: 'bg-slate-300', chip: 'bg-slate-100 text-slate-500', text: '4 employees have never opened the onboarding wizard.', count: '4', tone: 'slate' },
];

export function InsightsScreen() {
  return (
    <BrowserFrame url="iscshrms.vercel.app/dashboard">
      <div className="space-y-3 bg-slate-50 p-4 text-left">
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <div>
              <p className="text-[12px] font-bold text-slate-900">Action required</p>
              <p className="text-[9.5px] text-slate-500">Ordered by severity · work top down</p>
            </div>
            <Chip tone="red">4</Chip>
          </div>
          {ACTIONS.map((a) => (
            <div key={a.text} className="relative flex items-center gap-3 border-b border-slate-100 py-2.5 pl-5 pr-4 last:border-0">
              <span className={clsx('absolute inset-y-0 left-0 w-1', a.rail)} />
              <span className={clsx('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', a.chip)}>
                <a.icon size={13} />
              </span>
              <span className="min-w-0 flex-1 text-[10.5px] font-medium text-slate-700">{a.text}</span>
              <Chip tone={a.tone}>{a.count}</Chip>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
            <p className="text-[11.5px] font-bold text-slate-900">E-signatures</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {[
                ['Awaiting employee', '4', 'text-sky-600'],
                ['Awaiting HR', '3', 'text-amber-600'],
                ['Completed', '58', 'text-emerald-600'],
                ['Parked', '2', 'text-slate-700'],
              ].map(([k, v, c]) => (
                <div key={k} className="rounded-lg bg-slate-50 px-2.5 py-2">
                  <p className={clsx('text-[16px] font-bold leading-none', c)}>{v}</p>
                  <p className="mt-1 text-[9px] text-slate-500">{k}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
            <p className="text-[11.5px] font-bold text-slate-900">Compliance &amp; delivery</p>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 px-2.5 py-2">
              <ShieldCheck size={14} className="mt-px shrink-0 text-emerald-600" />
              <div>
                <p className="text-[10px] font-bold text-emerald-900">Aadhaar compliance · 100%</p>
                <p className="text-[9px] text-emerald-800/80">All signed envelopes carry Aadhaar</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[9.5px]">
                <span className="text-slate-500">Email delivery</span>
                <span className="font-bold text-slate-900">100%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-emerald-500" />
              <p className="mt-1.5 flex items-center gap-1 text-[9px] text-slate-500">
                <Lock size={9} /> 42 documents dispatched this month
              </p>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

export const TOUR_SCREENS = {
  onboarding: OnboardingScreen,
  esign: EsignScreen,
  payroll: PayslipScreen,
  letters: LetterScreen,
  insights: InsightsScreen,
};
