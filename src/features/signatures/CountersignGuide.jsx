/**
 * Guidance for HR's company counter-signature.
 *
 * The company signer also signs with Aadhaar eSign, so the OTP goes to the
 * AUTHORISED SIGNATORY's Aadhaar-linked mobile. Whoever is at the keyboard has
 * to have that person (or their phone) at hand before starting, or the window
 * sits waiting on an OTP nobody receives.
 *
 *  - CountersignIntro     shown before the Zoho window opens: checklist + steps
 *  - CountersignStepsBar  slim, collapsible reminder above the window + help
 *  - CountersignDone      shown in place of the window once it is completed
 */
import { useState } from 'react';
import clsx from 'clsx';
import {
  CheckCircle2,
  ChevronDown,
  Eye,
  Fingerprint,
  HelpCircle,
  KeyRound,
  MousePointerClick,
  PenLine,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

import { Button, Checkbox } from '@/components/ui';

const SKIP_KEY = 'hrms.countersign.skipIntro';

/** Per-browser convenience only; the page works the same without storage. */
export function introSkipped() {
  try {
    return window.localStorage.getItem(SKIP_KEY) === '1';
  } catch {
    return false;
  }
}

function setIntroSkipped(skip) {
  try {
    if (skip) window.localStorage.setItem(SKIP_KEY, '1');
    else window.localStorage.removeItem(SKIP_KEY);
  } catch {
    /* storage unavailable - the intro simply shows again next time */
  }
}

const STEPS = [
  {
    icon: Eye,
    title: "Check the employee's signature",
    text: 'Scroll through the package. The employee has already signed with Aadhaar eSign.',
  },
  {
    icon: MousePointerClick,
    title: 'Click "Start"',
    text: 'Zoho jumps to the company signature box, usually on the last page.',
  },
  {
    icon: PenLine,
    title: 'Click the box, choose Type or Draw, click Ok',
    text: 'Tick "fills the signature in all places" if there is more than one box.',
  },
  {
    icon: Fingerprint,
    title: 'Click Finish / Sign, choose Aadhaar eSign',
    text: "Enter the authorised signatory's Aadhaar number, tick consent, click Send OTP.",
  },
  {
    icon: KeyRound,
    title: 'Enter the OTP and submit',
    text: 'This window closes on its own a few seconds after Zoho confirms.',
  },
];

function Steps({ compact }) {
  return (
    <ol className={clsx(compact ? 'grid gap-2 sm:grid-cols-2 lg:grid-cols-5' : 'space-y-3')}>
      {STEPS.map((s, i) => (
        <li key={s.title} className={clsx('flex gap-3', compact && 'items-start gap-2')}>
          <span className={clsx('flex shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600', compact ? 'h-6 w-6' : 'h-8 w-8')}>
            <s.icon size={compact ? 13 : 16} />
          </span>
          <div className="min-w-0">
            <p className={clsx('font-semibold text-slate-800', compact ? 'text-xs leading-snug' : 'text-sm')}>
              <span className="text-brand-600">{i + 1}.</span> {s.title}
            </p>
            {!compact && <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{s.text}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------ Intro ---- */
export function CountersignIntro({ request, onStart }) {
  const [skip, setSkip] = useState(false);

  const start = () => {
    setIntroSkipped(skip);
    onStart();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-4">
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
        <p className="text-sm leading-relaxed text-emerald-900">
          <strong>{request.employee_name || request.employee_id}</strong> has signed all {request.document_count} documents.
          Your company counter-signature completes the package. It takes about 2 minutes.
        </p>
      </div>

      <div>
        <p className="eyebrow mb-3">Before you start</p>
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <Smartphone size={20} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-slate-700">
            The company signs with <strong>Aadhaar eSign</strong>. You need the{' '}
            <strong>authorised signatory&apos;s Aadhaar number</strong>, and the OTP goes to{' '}
            <strong>their Aadhaar-linked mobile</strong>. If that is not you, have them with you before starting.
          </p>
        </div>
      </div>

      <div>
        <p className="eyebrow mb-3">What you will do in the signing window</p>
        <Steps />
      </div>

      <div className="flex flex-col-reverse gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Checkbox checked={skip} onChange={setSkip} label="Don't show this again on this computer" />
        <Button className="px-6 py-3 text-base" icon={Fingerprint} onClick={start}>
          Start countersigning
        </Button>
      </div>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <ShieldCheck size={15} className="mt-px shrink-0 text-emerald-600" />
        The Aadhaar number is typed into Zoho Sign&apos;s secure window and sent to UIDAI. It is never stored by this portal.
      </p>
    </div>
  );
}

/* ------------------------------------------------------- Steps bar ---- */
const FAQ = [
  {
    q: 'The OTP did not arrive',
    a: "It goes to the mobile linked to the authorised signatory's Aadhaar. Wait a minute, then use Resend OTP inside the window.",
  },
  {
    q: 'The window is blank or the link expired',
    a: 'Click Reload. Each window link works once and only for a short time, so a fresh one is made every time.',
  },
  {
    q: "It says the name doesn't match",
    a: "Aadhaar eSign checks the signatory's name against their Aadhaar. The configured company signer name must match it; ask your administrator to check ZOHO_SIGN_COMPANY_SIGNER_NAME.",
  },
  {
    q: "I can't see the Ok / Submit button",
    a: 'Scroll down inside the signing window, or zoom the browser out a little (Ctrl and −).',
  },
  {
    q: 'I closed this halfway',
    a: "Nothing is lost. Click Countersign on this employee's row again and continue.",
  },
];

export function CountersignStepsBar() {
  const [open, setOpen] = useState(true);
  const [faq, setFaq] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 bg-white px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-brand-700"
          aria-expanded={open}
        >
          How to countersign
          <ChevronDown size={16} className={clsx('text-slate-400 transition-transform', open && 'rotate-180')} />
        </button>
        <button
          type="button"
          onClick={() => setHelpOpen((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
          aria-expanded={helpOpen}
        >
          <HelpCircle size={15} /> Having trouble?
        </button>
      </div>

      {open && (
        <div className="mt-3">
          <Steps compact />
        </div>
      )}

      {helpOpen && (
        <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
          {FAQ.map((item, i) => (
            <li key={item.q}>
              <button
                type="button"
                onClick={() => setFaq(faq === i ? null : i)}
                className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:text-brand-700"
                aria-expanded={faq === i}
              >
                {item.q}
                <ChevronDown size={16} className={clsx('shrink-0 text-slate-400 transition-transform', faq === i && 'rotate-180')} />
              </button>
              {faq === i && <p className="pb-3 text-sm leading-relaxed text-slate-500">{item.a}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- Done ---- */
export function CountersignDone({ request, onClose }) {
  return (
    <div className="px-6 py-12 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 size={32} />
      </span>
      <p className="mt-5 text-lg font-semibold text-slate-900">Countersigned — all done</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        {request.employee_name || request.employee_id}&apos;s {request.document_count} documents are signed by both
        parties and securely archived. You can download them from the Documents button on their row.
      </p>
      <Button className="mt-6" onClick={onClose}>Done</Button>
    </div>
  );
}
