/** Journey, details bento, security, FAQ, closing call to action and footer. */
import clsx from 'clsx';
import {
  ArrowRight,
  Cake,
  CheckCircle2,
  ChevronDown,
  Fingerprint,
  Globe,
  Hash,
  Linkedin,
  Mail,
  MapPin,
  Search,
  Server,
  Smartphone,
  Trophy,
  User,
} from 'lucide-react';

import { BrandLogo } from '@/components/BrandLogo';
import { TransitionLink } from '@/lib/pageTransition';
import { AnchorLink, Reveal } from '../motion';
import { CLOSING, COMPANY, CONTACT, DETAILS, FACTS, FAQ, JOURNEY, NAV, SECURITY } from './copy';
import { Chip, Container, Icon, Initials, SectionHeader, button, display } from './primitives';

/* -------------------------------------------------------------- Journey */
export function Journey() {
  return (
    <section id="journey" className="relative isolate scroll-mt-20 overflow-hidden bg-[#0a1020] py-24 text-white sm:py-28">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(900px 480px at 15% 0%, rgb(49 71 230 / 0.35), transparent 65%), radial-gradient(700px 420px at 100% 100%, rgb(124 58 237 / 0.22), transparent 65%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'linear-gradient(to bottom, #000, transparent 70%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000, transparent 70%)',
        }}
      />

      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <SectionHeader
            dark
            eyebrow="How it works"
            title="One record, from offer letter to exit."
            sub="Every stage of an employee’s time at ISCS happens in the same place, on the same record, with a document trail HR can pull up in seconds."
          />
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
            {FACTS.map((f) => (
              <div key={f.label} className="bg-[#0d1428]/90 p-5">
                <dt className="sr-only">{f.label}</dt>
                <dd>
                  <span className={clsx(display, 'text-[34px] font-bold leading-none tracking-[-0.02em] text-white')}>{f.value}</span>
                  <span className="ml-1.5 text-[14px] font-semibold text-brand-300">{f.unit}</span>
                  <p className="mt-2 text-[13px] leading-snug text-slate-400">{f.label}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <ol className="relative mt-16 grid gap-4 md:grid-cols-5 md:gap-3">
          {/* Connector across the five stages on wide screens */}
          <span
            aria-hidden="true"
            className="absolute left-[10%] right-[10%] top-[27px] hidden h-px bg-gradient-to-r from-brand-400/0 via-brand-400/60 to-violet-400/0 md:block"
          />
          {JOURNEY.map((j, i) => (
            <Reveal as="li" key={j.stage} delay={i * 90} className="relative">
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="relative z-10 flex h-[54px] w-[54px] items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-[0_8px_24px_-8px_rgb(49_71_230/0.8)]">
                    <Icon name={j.icon} size={22} strokeWidth={2} />
                  </span>
                  <span className="text-[12px] font-bold tracking-widest text-slate-500">{j.step}</span>
                </div>
                <h3 className={clsx(display, 'mt-5 text-[20px] font-bold tracking-[-0.01em] text-white')}>{j.stage}</h3>
                <p className="mt-2 flex-1 text-[14px] leading-relaxed text-slate-400">{j.body}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {j.docs.map((d) => (
                    <span key={d} className="rounded-md bg-white/[0.07] px-2 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-inset ring-white/10">
                      {d}
                    </span>
                  ))}
                </div>
                <p className="mt-4 flex items-center gap-1.5 border-t border-white/10 pt-3 text-[11.5px] text-slate-500">
                  <User size={12} /> {j.actors.join(' + ')}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* -------------------------------------------------------------- Details */
function BentoCard({ title, body, children, className }) {
  return (
    /* Reveal owns `transition-property` for its fade, so the card's own hover
       transition lives on the inner element rather than fighting it. */
    <Reveal className={className}>
      <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white transition-shadow duration-300 hover:shadow-[0_24px_48px_-24px_rgb(15_23_42/0.25)]">
        <div className="relative min-h-[176px] flex-1 overflow-hidden bg-gradient-to-b from-slate-50 to-white p-6" aria-hidden="true">
          {children}
        </div>
        <div className="px-6 pb-6 pt-1">
          <h3 className={clsx(display, 'text-[18px] font-bold tracking-[-0.01em] text-slate-950')}>{title}</h3>
          <p className="mt-1.5 text-[14px] leading-relaxed text-slate-600">{body}</p>
        </div>
      </div>
    </Reveal>
  );
}

function SearchVisual() {
  return (
    <div className="mx-auto max-w-[440px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_-20px_rgb(15_23_42/0.35)]">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 text-[13px]">
        <Search size={15} className="text-brand-600" />
        <span className="text-slate-800">anan</span>
        <span className="h-4 w-px animate-pulse bg-brand-600" />
        <span className="ml-auto rounded border border-slate-200 px-1.5 text-[10px] font-semibold text-slate-400">esc</span>
      </div>
      <p className="px-4 pb-1 pt-2.5 text-[9.5px] font-semibold uppercase tracking-wider text-slate-400">Employees</p>
      {[
        ['Ananya Rao', 'ISCSE104 · Senior Software Engineer', true],
        ['Anand Kumar', 'ISCSI062 · Data Analyst'],
      ].map(([n, s, active]) => (
        <div key={n} className={clsx('flex items-center gap-2.5 px-4 py-2', active && 'bg-brand-50')}>
          <Initials name={n} />
          <div className="leading-tight">
            <p className={clsx('text-[12px] font-semibold', active ? 'text-brand-800' : 'text-slate-800')}>{n}</p>
            <p className="text-[10.5px] text-slate-500">{s}</p>
          </div>
        </div>
      ))}
      <p className="px-4 pb-1 pt-2.5 text-[9.5px] font-semibold uppercase tracking-wider text-slate-400">Actions</p>
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-1 text-[12px] font-semibold text-slate-700">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <ArrowRight size={13} />
        </span>
        Issue appointment letter
      </div>
    </div>
  );
}

function CelebrationVisual() {
  return (
    <div className="space-y-2.5">
      {[
        ['Sneha Nair', 'Birthday · today', true, Cake, 'text-rose-500'],
        ['Vikram Reddy', '3 years at ISCS · in 4 days', false, Trophy, 'text-amber-500'],
      ].map(([n, s, today, Glyph, glyphTone]) => (
        <div key={n} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 shadow-[0_8px_20px_-14px_rgb(15_23_42/0.3)]">
          <span className="relative">
            <Initials name={n} size="h-9 w-9 text-[11px]" />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white">
              <Glyph size={11} className={glyphTone} />
            </span>
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[12px] font-semibold text-slate-800">{n}</p>
            <p className="truncate text-[10.5px] text-slate-500">{s}</p>
          </div>
          {today ? (
            <span className="rounded-lg bg-brand-600 px-2.5 py-1 text-[10.5px] font-semibold text-white">Wish</span>
          ) : (
            <Chip>Upcoming</Chip>
          )}
        </div>
      ))}
    </div>
  );
}

function StalledVisual() {
  return (
    <div className="space-y-2">
      {[
        ['Rohit Das', 'Step 2 · 5 days idle', 'red', 'High'],
        ['Meera Pillai', 'Step 4 · 2 days idle', 'amber', 'Medium'],
        ['Arjun Singh', 'Step 5 · 6 hours idle', 'slate', 'Low'],
      ].map(([n, s, tone, level]) => (
        <div key={n} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Initials name={n} size="h-7 w-7 text-[9.5px]" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[11.5px] font-semibold text-slate-800">{n}</p>
            <p className="truncate text-[10px] text-slate-500">{s}</p>
          </div>
          <Chip tone={tone}>{level}</Chip>
        </div>
      ))}
    </div>
  );
}

function DispatchVisual() {
  return (
    <div className="space-y-2">
      {[
        ['Appointment letter', 'Ananya Rao', 'green', 'Delivered'],
        ['Payslip · Aug 2026', 'Rahul Verma', 'green', 'Delivered'],
        ['Relieving letter', 'Divya Iyer', 'slate', 'Download only'],
      ].map(([d, n, tone, s]) => (
        <div key={d} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Mail size={13} />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[11.5px] font-semibold text-slate-800">{d}</p>
            <p className="truncate text-[10px] text-slate-500">To {n}</p>
          </div>
          <Chip tone={tone}>{s}</Chip>
        </div>
      ))}
    </div>
  );
}

function EmployeeIdVisual() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_-14px_rgb(15_23_42/0.3)]">
      <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-800">
        <Hash size={13} className="text-brand-600" /> Employee ID
      </p>
      <div className="mt-2.5 flex rounded-lg bg-slate-100 p-0.5 text-[10.5px] font-semibold">
        <span className="flex-1 rounded-md px-2 py-1 text-center text-slate-500">Automatic</span>
        <span className="flex-1 rounded-md bg-brand-600 px-2 py-1 text-center text-white">Enter manually</span>
      </div>
      <div className="mt-2.5 flex items-center rounded-lg border border-slate-200 px-2.5 py-2 text-[12px]">
        <span className="font-semibold text-brand-600">ISCSI</span>
        <span className="ml-1 font-semibold text-slate-900">150</span>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[10.5px] font-medium text-emerald-700">
        <CheckCircle2 size={12} /> ISCSI150 is available.
      </p>
    </div>
  );
}

function Phone() {
  return (
    <div aria-hidden="true" className="relative w-[220px] rounded-[34px] border-[7px] border-slate-900 bg-white shadow-[0_32px_64px_-24px_rgb(15_23_42/0.55)]">
      <span className="absolute left-1/2 top-2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-slate-900" />
      <div className="space-y-3 px-3.5 pb-16 pt-7">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-slate-800">Good morning, Ananya</p>
          <Initials name="Ananya Rao" size="h-6 w-6 text-[8.5px]" />
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 p-3 text-white">
          <p className="text-[9.5px] opacity-80">Document signing</p>
          <p className="text-[12px] font-bold leading-snug">Ready to sign · 2 envelopes</p>
          <span className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-brand-700">
            <Fingerprint size={10} /> Sign now
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Payslips', 'Aug 2026'],
            ['Documents', '12 files'],
            ['Holidays', 'Next: Diwali'],
            ['Help desk', 'Write to HR'],
          ].map(([t, s]) => (
            <div key={t} className="rounded-xl border border-slate-200 px-2 py-2">
              <p className="text-[10px] font-semibold text-slate-800">{t}</p>
              <p className="text-[8.5px] text-slate-500">{s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileBanner() {
  return (
    <Reveal className="md:col-span-6">
      <div className="grid overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-brand-50/60 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 shadow-[0_1px_2px_rgb(15_23_42/0.06)] ring-1 ring-slate-200">
            <Smartphone size={19} />
          </span>
          <h3 className={clsx(display, 'mt-5 text-[26px] font-bold leading-tight tracking-[-0.02em] text-slate-950')}>
            Made for the phone in every pocket.
          </h3>
          <p className="mt-3 max-w-[460px] text-[15px] leading-relaxed text-slate-600">
            New joiners onboard and sign from their phone. Every screen, table and form adapts to a small display, so
            nobody has to wait until they are back at a desk.
          </p>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {['Aadhaar eSign on mobile', 'Tables become readable cards', 'Payslips a tap away', 'Uploads from the camera roll'].map((t) => (
              <li key={t} className="flex items-center gap-2 text-[14px] text-slate-700">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex h-[300px] justify-center overflow-hidden pt-10 md:h-auto md:min-h-[340px]">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand-500/15 blur-3xl"
          />
          <div className="relative -mb-24">
            <Phone />
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export function Details() {
  return (
    <section className="py-24 sm:py-28">
      <Container>
        <SectionHeader eyebrow="Thoughtful details" title={DETAILS.title} sub={DETAILS.sub} />
        <div className="mt-14 grid gap-5 md:grid-cols-6">
          <BentoCard
            className="md:col-span-4"
            title="Find anyone or anything with Ctrl K"
            body="Jump to any employee, page or action from a single search box. Issuing a letter is two keystrokes away."
          >
            <SearchVisual />
          </BentoCard>
          <BentoCard
            className="md:col-span-2"
            title="Celebrations, never missed"
            body="Birthdays and work anniversaries surface on the dashboard, with a formal wish sent in one click."
          >
            <CelebrationVisual />
          </BentoCard>
          <BentoCard
            className="md:col-span-2"
            title="Stalled onboarding, ranked"
            body="Everyone who stopped halfway, sorted by how long they have been idle."
          >
            <StalledVisual />
          </BentoCard>
          <BentoCard
            className="md:col-span-2"
            title="Proof of every dispatch"
            body="Each letter and payslip logged with recipients and whether the email landed."
          >
            <DispatchVisual />
          </BentoCard>
          <BentoCard
            className="md:col-span-2"
            title="Employee IDs your way"
            body="Automatic numbering, or reserve a specific ID for a new joiner before day one."
          >
            <EmployeeIdVisual />
          </BentoCard>
          <MobileBanner />
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------- Security */
function DataFlow() {
  const node = 'flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5';
  return (
    <div aria-hidden="true" className="relative rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-6 sm:p-8">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">Where the Aadhaar number goes</p>
      <div className="mt-6 space-y-3">
        <div className={clsx(node, 'border-slate-200')}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Smartphone size={18} /></span>
          <div className="leading-tight">
            <p className="text-[14px] font-semibold text-slate-900">Employee</p>
            <p className="text-[12px] text-slate-500">Types Aadhaar and the OTP</p>
          </div>
        </div>
        <div className="ml-9 h-5 w-px bg-gradient-to-b from-brand-400 to-brand-600" />
        <div className={clsx(node, 'border-brand-200 ring-4 ring-brand-50')}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><Fingerprint size={18} /></span>
          <div className="leading-tight">
            <p className="text-[14px] font-semibold text-slate-900">Zoho Sign India → UIDAI</p>
            <p className="text-[12px] text-slate-500">Verifies identity and seals the documents</p>
          </div>
        </div>
        <div className="ml-9 h-5 w-px bg-gradient-to-b from-brand-600 to-emerald-500" />
        <div className={clsx(node, 'border-emerald-200')}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Server size={18} /></span>
          <div className="min-w-0 leading-tight">
            <p className="text-[14px] font-semibold text-slate-900">ISCS HR portal</p>
            <p className="text-[12px] text-slate-500">Receives status, sealed PDF and certificate</p>
          </div>
          <Chip tone="green" className="ml-auto hidden sm:inline-flex">No Aadhaar stored</Chip>
        </div>
      </div>
    </div>
  );
}

export function Security() {
  return (
    <section id="security" className="scroll-mt-20 border-y border-slate-200/80 bg-slate-50/70 py-24 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <SectionHeader eyebrow="Security & privacy" title={SECURITY.title} sub={SECURITY.sub} />
            <div className="mt-10">
              <DataFlow />
            </div>
          </div>
          <dl className="grid content-start gap-x-8 gap-y-10 sm:grid-cols-2 lg:pt-4">
            {SECURITY.items.map((s, i) => (
              <Reveal key={s.title} delay={(i % 2) * 80}>
                <dt>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 shadow-[0_1px_2px_rgb(15_23_42/0.06)] ring-1 ring-slate-200">
                    <Icon name={s.icon} size={19} strokeWidth={2} />
                  </span>
                  <p className={clsx(display, 'mt-4 text-[17px] font-bold tracking-[-0.01em] text-slate-950')}>{s.title}</p>
                </dt>
                <dd className="mt-1.5 text-[14.5px] leading-relaxed text-slate-600">{s.body}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ FAQ */
export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 py-24 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div>
            <SectionHeader eyebrow="FAQ" title="Questions employees ask us most." />
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
              <p className="text-[15px] font-semibold text-slate-900">Still need help?</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-slate-600">
                Write to the HR team and include your Employee ID. Signed-in employees can also use the Help Desk in the portal.
              </p>
              <a href={`mailto:${CONTACT.email}`} className="mt-4 inline-flex items-center gap-2 text-[14px] font-semibold text-brand-700 hover:underline">
                <Mail size={15} /> {CONTACT.email}
              </a>
            </div>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {FAQ.map((f, i) => (
              <details key={f.q} className="group" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-[16px] font-semibold text-slate-900 marker:hidden [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-transform duration-200 group-open:rotate-180 group-open:border-brand-200 group-open:bg-brand-50 group-open:text-brand-600">
                    <ChevronDown size={16} />
                  </span>
                </summary>
                <p className="-mt-1 pb-6 pr-12 text-[15px] leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* --------------------------------------------------------- Closing CTA */
export function ClosingCta() {
  return (
    <section className="pb-24 sm:pb-28">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-700 via-brand-600 to-violet-700 px-6 py-16 text-center shadow-[0_32px_80px_-32px_rgb(49_71_230/0.7)] sm:px-16 sm:py-20">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-[0.12]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 20%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 20%, transparent 100%)',
            }}
          />
          <h2 className={clsx(display, 'mx-auto max-w-[680px] text-balance text-[32px] font-bold leading-[1.08] tracking-[-0.025em] text-white sm:text-[46px]')}>
            {CLOSING.title}
          </h2>
          <p className="mx-auto mt-5 max-w-[560px] text-pretty text-[17px] leading-relaxed text-brand-100">{CLOSING.sub}</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <TransitionLink to="/login" className={clsx(button.light, 'w-full sm:w-auto')}>
              {CLOSING.primary} <ArrowRight size={16} />
            </TransitionLink>
            <a href={`mailto:${CONTACT.email}`} className={clsx(button.ghostDark, 'w-full sm:w-auto')}>
              {CLOSING.secondary}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* --------------------------------------------------------------- Footer */
export function SiteFooter() {
  const link = 'text-[14px] text-slate-400 transition-colors hover:text-white';
  return (
    <footer className="bg-[#0a1020] text-slate-400">
      <Container className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <BrandLogo className="h-10" onDark />
          <p className="mt-5 max-w-[280px] text-[14px] leading-relaxed">
            The HR platform of {COMPANY}, from offer letter to payslip.
          </p>
          <div className="mt-6 flex gap-2">
            <a href={CONTACT.linkedin.href} target="_blank" rel="noopener noreferrer" aria-label="ISCS Technologies on LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-300 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white">
              <Linkedin size={16} />
            </a>
            <a href={CONTACT.website.href} target="_blank" rel="noopener noreferrer" aria-label="ISCS Technologies website" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-300 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white">
              <Globe size={16} />
            </a>
            <a href={`mailto:${CONTACT.email}`} aria-label="Email HR" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-300 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white">
              <Mail size={16} />
            </a>
          </div>
        </div>

        <div>
          <p className="text-[13px] font-semibold text-white">Platform</p>
          <ul className="mt-4 space-y-3">
            {NAV.map((n) => (
              <li key={n.href}>
                <AnchorLink href={n.href} className={link}>{n.label}</AnchorLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[13px] font-semibold text-white">Portal</p>
          <ul className="mt-4 space-y-3">
            <li><TransitionLink to="/login" className={link}>Sign in</TransitionLink></li>
            <li><TransitionLink to="/forgot-password" className={link}>Forgot password</TransitionLink></li>
            <li><a href={`mailto:${CONTACT.email}`} className={link}>Contact HR</a></li>
          </ul>
        </div>

        <div>
          <p className="text-[13px] font-semibold text-white">Office</p>
          <address className="mt-4 flex gap-2.5 text-[14px] not-italic leading-relaxed">
            <MapPin size={16} className="mt-0.5 shrink-0 text-slate-500" />
            <span>
              {CONTACT.address.map((line) => (
                <span key={line} className="block">{line}</span>
              ))}
            </span>
          </address>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-[13px] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {COMPANY}. All rights reserved.</p>
          <p className="text-slate-500">Access is restricted to ISCS employees and authorised HR staff.</p>
        </Container>
      </div>
    </footer>
  );
}
