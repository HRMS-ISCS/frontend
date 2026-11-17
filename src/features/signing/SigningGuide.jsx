/**
 * Guidance for the employee signing screen.
 *
 * A new joiner has usually never used Aadhaar eSign or Zoho Sign. These pieces
 * tell them where they are, what to do next and what happens after:
 *
 *  - SigningProgress   the four stages, with the current one highlighted
 *  - EnvelopeTracker   the two envelopes - appointment letter, and NDA with
 *                      policies and declaration - and where each one stands
 *  - ReadyToSignModal  pop-up before the signing window opens: what to keep
 *                      ready and the exact clicks inside the Zoho window
 *  - SignedModal       pop-up the moment their signature is recorded
 *  - SigningHelp       "Having trouble?" answers next to the signing window
 */
import { useState } from 'react';
import clsx from 'clsx';
import {
  Check,
  ChevronDown,
  FileText,
  Fingerprint,
  HelpCircle,
  KeyRound,
  MousePointerClick,
  PartyPopper,
  PenLine,
  ShieldCheck,
  Smartphone,
  UserCheck,
} from 'lucide-react';

import { Button, Modal } from '@/components/ui';
import { SignatureStatusBadge } from '@/components/StatusBadges';

/* --------------------------------------------------------- Progress ----- */
const STEPS = [
  { key: 'declaration', label: 'Confirm declaration' },
  { key: 'sign', label: 'Sign with Aadhaar OTP' },
  { key: 'hr', label: 'HR counter-signs' },
  { key: 'done', label: 'Completed' },
];

/** Which step is current, and whether it is waiting on someone else / blocked. */
function progressFor(stage, hasDeclaration) {
  if (!hasDeclaration) return { current: 0, state: 'active' };
  switch (stage) {
    case 'SIGNED_AWAITING_HR':
      return { current: 2, state: 'waiting' };
    case 'COMPLETE':
      return { current: 4, state: 'active' };
    case 'PENDING_SERVICE':
      return { current: 1, state: 'waiting' };
    case 'BLOCKED_SOFT':
    case 'BLOCKED_HARD':
      return { current: 1, state: 'blocked' };
    default:
      return { current: 1, state: 'active' };
  }
}

export function SigningProgress({ stage, hasDeclaration }) {
  const { current, state } = progressFor(stage, hasDeclaration);

  return (
    <ol className="card grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:gap-0 sm:p-5">
      {STEPS.map((step, i) => {
        const done = i < current;
        const isCurrent = i === current;
        return (
          <li key={step.key} className="flex items-center gap-3 sm:px-3">
            <span
              className={clsx(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
                done && 'bg-emerald-500 text-white',
                isCurrent && state === 'active' && 'bg-brand-600 text-white ring-4 ring-brand-100',
                isCurrent && state === 'waiting' && 'bg-sky-100 text-sky-700 ring-4 ring-sky-50',
                isCurrent && state === 'blocked' && 'bg-amber-100 text-amber-700 ring-4 ring-amber-50',
                !done && !isCurrent && 'bg-white text-slate-400 ring-1 ring-slate-300',
              )}
            >
              {done ? <Check size={15} strokeWidth={3} /> : i + 1}
            </span>
            <span className="min-w-0">
              <span className={clsx('block text-caption font-semibold', isCurrent ? 'text-slate-900' : done ? 'text-slate-700' : 'text-slate-400')}>
                {step.label}
              </span>
              {isCurrent && (
                <span className="block text-xs text-slate-500">
                  {state === 'waiting' ? (i === 1 ? 'Waiting on HR' : 'In progress') : state === 'blocked' ? 'Needs HR' : 'You are here'}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------- How to sign steps ---- */
const HOW_TO_SIGN = [
  {
    icon: MousePointerClick,
    title: 'Click "Start" in the signing window',
    text: 'It jumps to each place that needs your signature. You do not need to scroll through all the pages yourself.',
  },
  {
    icon: PenLine,
    title: 'Click the signature box and add your signature',
    text: 'Choose Type or Draw, then click Ok. Tick "fills the signature in all places" to sign every box at once.',
  },
  {
    icon: Fingerprint,
    title: 'Click Finish / Sign and choose Aadhaar eSign',
    text: 'Enter your 12-digit Aadhaar number (or Virtual ID), tick the consent box and click Send OTP.',
  },
  {
    icon: KeyRound,
    title: 'Enter the OTP sent to your Aadhaar-linked mobile',
    text: 'Submit it. One OTP signs every document in this envelope. You have two envelopes, so you do this twice. This page then updates on its own.',
  },
];

/* -------------------------------------------------- Envelope tracker ---- */
export function EnvelopeTracker({ envelopes, activeId }) {
  if (!envelopes || envelopes.length < 2) return null;
  return (
    <ol className="card grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
      {envelopes.map((env, i) => (
        <li
          key={env.envelope_type}
          className={clsx(
            'flex items-start gap-3 rounded-xl border p-3.5',
            env.exists && env.signature_request_id === activeId ? 'border-brand-200 bg-brand-50/40' : 'border-slate-100',
          )}
        >
          <span
            className={clsx(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
              env.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-300',
            )}
          >
            {env.status === 'completed' ? <Check size={15} strokeWidth={3} /> : i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-800">{env.envelope_label}</p>
              {env.status && <SignatureStatusBadge status={env.status} />}
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {env.document_count ? `${env.document_count} document(s) · ` : ''}
              {env.message}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function HowToSignSteps({ compact = false }) {
  return (
    <ol className={clsx('space-y-3', compact && 'space-y-2.5')}>
      {HOW_TO_SIGN.map((s, i) => (
        <li key={s.title} className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <s.icon size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              <span className="text-brand-600">Step {i + 1}.</span> {s.title}
            </p>
            {!compact && <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{s.text}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ----------------------------------------------- Ready-to-sign pop-up --- */
export function ReadyToSignModal({ open, count, label, employeeName, onStart, onClose, starting }) {
  return (
    <Modal
      open={open}
      onClose={starting ? undefined : onClose}
      size="lg"
      title={label ? `${label} is ready to sign` : 'Your documents are ready to sign'}
      description={`${count || 'All the'} document(s) in this envelope · signed together with one Aadhaar OTP · takes about 2 minutes`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={starting}>Later</Button>
          <Button icon={Fingerprint} onClick={onStart} loading={starting}>
            I&apos;m ready — start signing
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <p className="eyebrow mb-3">Before you start, keep these ready</p>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            <li className="flex gap-3 rounded-xl border border-slate-200 p-3">
              <Smartphone size={18} className="mt-0.5 shrink-0 text-brand-600" />
              <span className="text-sm text-slate-600">
                <strong className="text-slate-800">Your Aadhaar-linked mobile.</strong> The OTP is sent there, not to your email.
              </span>
            </li>
            <li className="flex gap-3 rounded-xl border border-slate-200 p-3">
              <UserCheck size={18} className="mt-0.5 shrink-0 text-brand-600" />
              <span className="text-sm text-slate-600">
                <strong className="text-slate-800">Your Aadhaar number</strong>
                {employeeName ? <> — the name on it should match <strong className="text-slate-800">{employeeName}</strong>.</> : '.'}
              </span>
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-3">What you will do in the signing window</p>
          <HowToSignSteps />
        </div>

        <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
          <ShieldCheck size={15} className="mt-px shrink-0 text-emerald-600" />
          Your Aadhaar number is typed into Zoho Sign&apos;s secure window and sent to UIDAI. ISCS never sees or stores it.
        </p>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------ Signed pop-up --- */
export function SignedModal({ open, count, remaining = 0, completed, onClose, onFinish, finishLabel, finishing }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={completed ? 'All documents are signed' : 'You have signed your documents'}
      footer={
        onFinish ? (
          <Button icon={Check} onClick={onFinish} loading={finishing}>{finishLabel}</Button>
        ) : (
          <Button onClick={onClose}>Done</Button>
        )
      }
    >
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <PartyPopper size={26} />
        </span>
        <p className="mt-4 text-base font-semibold text-slate-900">Thank you — your signature is recorded.</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {remaining > 0
            ? 'This envelope is now with the company for counter-signature. Your other envelope is still being prepared by HR — it will appear here as soon as it is ready to sign.'
            : completed
            ? `Both envelopes - all ${count || ''} documents - are signed by you and the company, and securely stored.`
            : `Both envelopes - all ${count || ''} documents - are now with the company's authorised signatory for counter-signature. Nothing else is needed from you.`}
        </p>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------- Help ------- */
const FAQ = [
  {
    q: 'I did not receive the OTP',
    a: 'It goes to the mobile number linked to your Aadhaar, not the one you gave ISCS. Wait a minute, then use Resend OTP. If your Aadhaar is not linked to a mobile number, contact HR.',
  },
  {
    q: 'The signing window is blank or says the link expired',
    a: 'Click "Reload window" above it. Each window link works once and only for a short time, so a fresh one is created every time you reload.',
  },
  {
    q: 'It says my name does not match',
    a: 'Aadhaar eSign checks the name on your Aadhaar. Contact HR so they can correct your name on the documents and send a new request.',
  },
  {
    q: 'I cannot see the Ok / Submit button',
    a: 'Scroll down inside the signing window, or zoom your browser out a little (Ctrl and −).',
  },
  {
    q: 'I closed the page halfway',
    a: 'Nothing is lost. Come back to Document Signing from the menu and click Start signing again.',
  },
  {
    q: 'Why do I have to sign twice?',
    a: 'Your appointment letter is sent on its own, and your NDA, company policies and declaration are sent together. Each is signed with its own Aadhaar OTP. Signing is complete once both are done.',
  },
];

export function SigningHelp() {
  const [open, setOpen] = useState(null);
  return (
    <div className="card p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <HelpCircle size={16} className="text-brand-600" /> Having trouble?
      </p>
      <ul className="mt-3 divide-y divide-slate-100">
        {FAQ.map((item, i) => (
          <li key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:text-brand-700"
              aria-expanded={open === i}
            >
              {item.q}
              <ChevronDown size={16} className={clsx('shrink-0 text-slate-400 transition-transform', open === i && 'rotate-180')} />
            </button>
            {open === i && <p className="pb-3 text-sm leading-relaxed text-slate-500">{item.a}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------ Document list (fold) -- */
export function DocumentList({ documents, count, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!documents?.length) return null;
  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <FileText size={16} className="text-brand-600" /> What you are signing
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{count} documents</span>
        </span>
        <ChevronDown size={18} className={clsx('text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ol className="grid gap-2 border-t border-slate-100 p-4 sm:grid-cols-2">
          {documents.map((doc, i) => (
            <li key={`${doc}-${i}`} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 text-caption">
              <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
                {i + 1}
              </span>
              <span className="truncate font-medium text-slate-700">{String(doc).replace(/\.pdf$/i, '')}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
