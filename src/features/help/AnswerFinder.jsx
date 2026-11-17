/**
 * Instant answers on the employee help desk: type a question (or pick a common
 * one) and get the answer before writing to HR.
 *
 * Matching is keyword ranking with the same scorer as the Ctrl K palette - no
 * AI, no request. Every answer ends with "Email HR about this", which fills in
 * the form's category, so an unanswered question costs one click, not a
 * retyped form.
 *
 * Only facts the portal actually does belong here; if a process changes,
 * update the answer in the same change.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, ChevronDown, Mail, Search } from 'lucide-react';

import { score } from '@/components/CommandPalette';

const ANSWERS = [
  {
    q: 'I forgot my password',
    category: 'Login & password',
    keywords: 'password reset forgot login sign in locked',
    a: 'Sign out and use "Forgot password" on the sign-in page. A reset link is sent to your login email and expires in 15 minutes.',
  },
  {
    q: 'My setup link has expired',
    category: 'Login & password',
    keywords: 'setup link expired welcome email first time invite activate account',
    a: 'Setup links work once and expire. Use "Forgot password" on the sign-in page with your work email to get a fresh link.',
  },
  {
    q: 'The Aadhaar OTP did not arrive',
    category: 'Document signing',
    keywords: 'aadhaar otp esign sms mobile not received zoho',
    a: 'The OTP goes to the mobile number linked to your Aadhaar, not the one you gave ISCS. Wait a minute and use Resend OTP inside the signing window.',
  },
  {
    q: '"Your documents are being prepared" - what do I do?',
    category: 'Document signing',
    keywords: 'documents prepared waiting signing appointment nda not ready',
    a: 'Nothing yet. HR is preparing your appointment letter and NDA. You can sign as soon as they are ready.',
    link: { to: '/me/signing', label: 'Open Document Signing' },
  },
  {
    q: 'How many OTPs do I need to sign my documents?',
    category: 'Document signing',
    keywords: 'otp sign documents how many policies nda appointment one',
    a: 'Two. Your appointment letter is sent on its own, and your NDA, company policies and declaration are sent together. Each envelope is signed with its own Aadhaar OTP.',
    link: { to: '/me/signing', label: 'Open Document Signing' },
  },
  {
    q: 'I stopped onboarding halfway',
    category: 'Onboarding',
    keywords: 'onboarding continue resume saved halfway later lost progress step',
    a: 'Nothing is lost. Each step is saved as you complete it, so you can continue from any device, right where you left off.',
  },
  {
    q: "I'm a fresher - what do I enter for experience?",
    category: 'Onboarding',
    keywords: 'fresher no experience first job training skip',
    a: 'Answer "No" to the previous-experience question and the experience details are skipped.',
  },
  {
    q: 'I need to change my bank account, address or name',
    category: 'Profile update',
    keywords: 'bank account change address name update details correction ifsc',
    a: 'Write to HR below with the correct details. For bank or name changes, attach a cancelled cheque or ID proof in your email.',
  },
  {
    q: "I can't see my payslip",
    category: 'Payslips & salary',
    keywords: 'payslip missing not visible salary slip month download',
    a: 'Payslips appear on the Payslips page once HR publishes them, and you can download a whole year as one ZIP file. If a month is missing, tell HR which one.',
    link: { to: '/me/payslips', label: 'Open Payslips' },
  },
  {
    q: 'Why is my net pay different this month?',
    category: 'Payslips & salary',
    keywords: 'net pay less lower different salary deduction prorated leave paid days',
    a: 'Earnings are prorated by the days paid in the month, so joining mid-month or unpaid leave lowers them. Deductions such as PF and professional tax are not prorated.',
    link: { to: '/me/payslips', label: 'Open Payslips' },
  },
  {
    q: 'I need a relieving or experience letter',
    category: 'Documents & letters',
    keywords: 'relieving experience letter exit resignation certificate',
    a: 'HR issues the relieving & experience letter from the portal and emails it to you. Write to HR below with your last working day.',
  },
  {
    q: 'Where are my uploaded documents?',
    category: 'Documents & letters',
    keywords: 'documents uploaded aadhaar pan certificate where find letters',
    a: 'Files you uploaded during onboarding and documents HR issued to you are on the My documents page.',
    link: { to: '/me/documents', label: 'Open My documents' },
  },
];

const POPULAR = 5;
const STOPWORDS = new Set(['the', 'and', 'my', 'to', 'is', 'of', 'for', 'in', 'on', 'how', 'what', 'why', 'where', 'when', 'who', 'which', 'do', 'can', 'me', 'it', 'get', 'am', 'was', 'are', 'a', 'an', 'i']);
/* Below this a "match" is letters scattered through a word, which is noise
 * for questions (the palette keeps it; people type IDs there, not sentences). */
const MIN_WORD_SCORE = 40;

function rank(query) {
  const q = query.trim().toLowerCase();
  if (!q) return ANSWERS.slice(0, POPULAR);
  // Score each word so "otp not coming" still finds the OTP answer.
  const words = q.split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOPWORDS.has(w));
  return ANSWERS.map((item) => {
    const total = words.reduce((sum, w) => {
      const best = Math.max(score(item.q, w), score(item.keywords, w) - 10);
      return sum + (best >= MIN_WORD_SCORE ? best : 0);
    }, 0);
    return { item, total };
  })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
    .map((r) => r.item);
}

export function AnswerFinder({ onAsk }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null);
  const results = useMemo(() => rank(query), [query]);

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Search help</span>
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(null);
          }}
          placeholder="Type your question, e.g. OTP not received"
          className="input h-11 pl-10 text-[14px]"
        />
      </label>

      <p className="mt-4 text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">
        {query.trim() ? `${results.length} matching answer${results.length === 1 ? '' : 's'}` : 'Common questions'}
      </p>

      {results.length === 0 ? (
        <div className="mt-3 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          No instant answer for that yet.{' '}
          <button type="button" onClick={() => onAsk('Other')} className="font-semibold text-brand-700 hover:underline">
            Ask HR directly
          </button>
          .
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {results.map((item) => {
            const expanded = open === item.q;
            return (
              <li key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : item.q)}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm font-medium text-slate-700 hover:text-brand-700"
                  aria-expanded={expanded}
                >
                  {item.q}
                  <ChevronDown size={16} className={clsx('shrink-0 text-slate-400 transition-transform', expanded && 'rotate-180')} />
                </button>
                {expanded && (
                  <div className="pb-4">
                    <p className="text-sm leading-relaxed text-slate-600">{item.a}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {item.link && (
                        <Link
                          to={item.link.to}
                          className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-brand-700 hover:bg-brand-50"
                        >
                          {item.link.label} <ArrowRight size={13} />
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => onAsk(item.category)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Mail size={13} /> Still stuck? Email HR about this
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
