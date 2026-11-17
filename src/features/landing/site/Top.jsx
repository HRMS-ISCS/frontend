/** Navigation, hero and the infrastructure strip. */
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { ArrowRight, Check, Menu, X } from 'lucide-react';

import { BrandLogo } from '@/components/BrandLogo';
import { BRAND_TRANSITION, TransitionLink } from '@/lib/pageTransition';
import { AnchorLink } from '../motion';
import { CONTACT, HERO, INFRA, NAV } from './copy';
import { Container, FitToWidth, Icon, button, display } from './primitives';
import { DASHBOARD_WIDTH, DashboardScreen, EsignFloat, OnboardingFloat, PayslipFloat } from './HeroScreen';

/* ------------------------------------------------------------------ Nav */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={clsx(
        'sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300',
        scrolled || open
          ? 'border-b border-slate-200/80 bg-white/85 shadow-[0_1px_0_rgb(15_23_42/0.02)] backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <Container className="flex h-[68px] items-center gap-6 sm:h-[80px] lg:h-[96px]">
        <a href="#top" aria-label="ISCS Technologies home" className="shrink-0" style={BRAND_TRANSITION}>
          <BrandLogo className="h-11 sm:h-14 lg:h-[72px]" />
        </a>

        <nav aria-label="Sections" className="mx-auto hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <AnchorLink
              key={n.href}
              href={n.href}
              className="rounded-lg px-3.5 py-2 text-[14px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
            >
              {n.label}
            </AnchorLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:ml-0 md:flex">
          <a
            href={`mailto:${CONTACT.email}`}
            className="rounded-lg px-3.5 py-2 text-[14px] font-medium text-slate-600 transition-colors hover:text-slate-950"
          >
            Contact HR
          </a>
          <TransitionLink
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Sign in <ArrowRight size={15} />
          </TransitionLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="ml-auto rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-slate-200/80 bg-white md:hidden">
          <Container className="space-y-1 py-4">
            {NAV.map((n) => (
              <AnchorLink
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-700 hover:bg-slate-50"
              >
                {n.label}
              </AnchorLink>
            ))}
            <TransitionLink to="/login" className={clsx(button.primary, 'mt-3 w-full')}>
              Sign in <ArrowRight size={16} />
            </TransitionLink>
          </Container>
        </div>
      )}
    </header>
  );
}

/* ----------------------------------------------------------------- Hero */
export function SiteHero() {
  return (
    <section className="relative isolate overflow-hidden pb-20 pt-14 sm:pt-20 lg:pb-28">
      {/* Backdrop: a faint grid fading out from the top, and a soft brand glow
          behind the headline. Structure rather than decoration. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(15 23 42 / 0.045) 1px, transparent 1px), linear-gradient(to bottom, rgb(15 23 42 / 0.045) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 80% 55% at 50% 0%, #000 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 55% at 50% 0%, #000 30%, transparent 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[-280px] -z-10 h-[620px] w-[1100px] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgb(49 71 230 / 0.16), rgb(124 58 237 / 0.08), transparent)' }}
      />

      <Container>
        <div className="site-rise mx-auto max-w-[880px] text-center">
          <AnchorLink
            href="#product"
            className="group inline-flex max-w-full items-center gap-2.5 rounded-full border border-slate-200 bg-white/80 py-1 pl-1 pr-3.5 text-[13px] text-slate-600 shadow-[0_1px_2px_rgb(15_23_42/0.04)] backdrop-blur transition-colors hover:border-brand-200"
          >
            <span className="shrink-0 rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">New</span>
            <span className="truncate">{HERO.badge}</span>
            <ArrowRight size={14} className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
          </AnchorLink>

          <h1
            className={clsx(
              display,
              'mt-7 text-balance text-[42px] font-bold leading-[1.02] tracking-[-0.03em] text-slate-950 sm:text-[60px] lg:text-[72px]',
            )}
          >
            {HERO.titleLead} <span className="text-brand-600">{HERO.titleAccent}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-[640px] text-pretty text-[17px] leading-relaxed text-slate-600 sm:text-[19px]">
            {HERO.sub}
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <TransitionLink to="/login" className={clsx(button.primary, 'w-full sm:w-auto')}>
              {HERO.primary} <ArrowRight size={16} />
            </TransitionLink>
            <AnchorLink href="#product" className={clsx(button.secondary, 'w-full sm:w-auto')}>
              {HERO.secondary}
            </AnchorLink>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13.5px] text-slate-500">
            {HERO.assurances.map((a) => (
              <li key={a} className="flex items-center gap-1.5">
                <Check size={15} strokeWidth={2.5} className="text-emerald-600" />
                {a}
              </li>
            ))}
          </ul>
        </div>

        {/* Product shot with floating detail cards */}
        <div className="site-rise site-rise-late relative mx-auto mt-16 max-w-[1100px] sm:mt-20">
          <div
            aria-hidden="true"
            className="absolute inset-x-10 -bottom-10 top-10 -z-10 rounded-[40px] bg-gradient-to-b from-brand-500/20 via-violet-500/10 to-transparent blur-2xl"
          />
          <FitToWidth width={DASHBOARD_WIDTH}>
            <DashboardScreen />
          </FitToWidth>
          <div className="site-float absolute -left-14 bottom-20 hidden xl:block">
            <EsignFloat />
          </div>
          <div className="site-float site-float-late absolute -right-12 top-[34px] hidden xl:block">
            <PayslipFloat />
          </div>
          <div className="site-float site-float-slow absolute -bottom-8 right-24 hidden lg:block">
            <OnboardingFloat />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------- Infrastructure */
export function InfraStrip() {
  return (
    <section aria-label="Infrastructure" className="border-y border-slate-200/80 bg-slate-50/60">
      <Container className="py-10">
        <p className="text-center text-[13px] font-medium text-slate-500">
          Built on proven, enterprise-grade infrastructure
        </p>
        <ul className="mt-6 grid grid-cols-2 items-center gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {INFRA.map((i) => (
            <li key={i.name} className="flex items-center justify-center gap-2.5 text-slate-500">
              <Icon name={i.icon} size={22} strokeWidth={1.8} className="shrink-0 text-slate-400" />
              <span className="leading-tight">
                <span className={clsx(display, 'block text-[16px] font-bold tracking-[-0.01em] text-slate-700')}>{i.name}</span>
                <span className="block text-[11.5px] text-slate-500">{i.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
