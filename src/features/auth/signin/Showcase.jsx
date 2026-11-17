/**
 * The showcase panel of the sign-in screen: what is waiting on the other
 * side of the form. Reuses the landing page's product cards so the two pages
 * read as one product, and names the three portals a sign-in can open.
 *
 * Everything shown is sample data describing real features - no usage
 * figures, no testimonials.
 */
import clsx from 'clsx';
import { ArrowLeft, Briefcase, ShieldCheck, UserRound } from 'lucide-react';

import { TransitionLink } from '@/lib/pageTransition';
import { display } from '@/features/landing/site/primitives';
import { EsignFloat, OnboardingFloat, PayslipFloat } from '@/features/landing/site/HeroScreen';

const PORTALS = [
  { icon: UserRound, name: 'Employees', body: 'Profile, documents, payslips and signing' },
  { icon: Briefcase, name: 'HR', body: 'Onboarding, letters, eSign and payroll' },
  { icon: ShieldCheck, name: 'Admins', body: 'User accounts and payslip uploads' },
];

export function Showcase() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden px-10 pb-10 pt-[104px] xl:px-14 xl:pb-12">
      {/* Backdrop: brand glows and a faint grid, fading toward the bottom. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(760px 520px at 15% -10%, rgb(49 71 230 / 0.55), transparent 62%), radial-gradient(640px 520px at 110% 105%, rgb(124 58 237 / 0.42), transparent 62%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 40%, #000 35%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 40%, #000 35%, transparent 100%)',
        }}
      />

      {/* Level with the logo in the form column's top bar, so the two read as
          one header across the page. */}
      <TransitionLink
        to="/welcome"
        className="group absolute left-10 top-[38px] z-10 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13.5px] font-medium text-slate-300 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/10 hover:text-white xl:left-14"
      >
        <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
        Back to site
      </TransitionLink>

      <div className="relative max-w-[520px] shrink-0">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-300">
          Capable · Available · Flexible
        </p>
        <h2 className={clsx(display, 'mt-4 text-balance text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-white xl:text-[40px]')}>
          From offer letter to payslip, all in one place.
        </h2>
        <p className="mt-4 max-w-[440px] text-[15.5px] leading-relaxed text-slate-300">
          Your profile, documents, payslips and anything waiting for your signature, one sign-in away.
        </p>
      </div>

      {/* Product cards, layered. Decorative - the text above carries the
          meaning. The area takes whatever height is left and the cards scale
          to fit it (see .auth-cards in signin.css), so nothing is ever cut off. */}
      <div aria-hidden="true" className="auth-cards-area relative my-6 min-h-0 flex-1">
        <div className="auth-cards">
          <div className="auth-float absolute left-0 top-0">
            <EsignFloat />
          </div>
          <div className="auth-float auth-float-late absolute right-0 top-[92px]">
            <PayslipFloat />
          </div>
          <div className="auth-float auth-float-slow absolute bottom-0 left-[12%]">
            <OnboardingFloat />
          </div>
        </div>
      </div>

      <div className="relative shrink-0">
        <p className="text-[13px] font-medium text-slate-400">One sign-in. Each role opens its own portal.</p>
        <ul className="mt-4 grid grid-cols-3 gap-3">
          {PORTALS.map(({ icon: Icon, name, body }) => (
            <li key={name} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10 backdrop-blur">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/20 text-brand-200 ring-1 ring-inset ring-brand-400/30">
                  <Icon size={14} />
                </span>
                <p className="text-[14px] font-semibold text-white">{name}</p>
              </div>
              <p className="mt-2 text-[12.5px] leading-snug text-slate-400">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
