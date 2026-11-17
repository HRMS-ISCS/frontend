/**
 * Frame for every signed-out screen: sign in, forgot password, set password.
 *
 * Product showcase on the left as an inset panel, form on the right. The form
 * comes first in the DOM (row-reverse), so phones and screen readers reach it
 * before the showcase. The top bar mirrors the landing page's nav - logo
 * top-left, and a way back to the site (top-left of the showcase on desktop) - and the logo carries the same
 * view-transition name, so it glides across when arriving from the landing
 * page instead of the whole screen jumping.
 */
import clsx from 'clsx';
import { ArrowLeft, Mail } from 'lucide-react';

import { BrandLogo } from '@/components/BrandLogo';
import { BRAND_TRANSITION, TransitionLink } from '@/lib/pageTransition';
import { display, useDisplayFont } from '@/features/landing/site/primitives';
import { Showcase } from './Showcase';
import './signin.css';

const HELP_EMAIL = 'hr@iscstech.com';

export function AuthShell({ title, subtitle, children, footer }) {
  useDisplayFont();

  return (
    <div className="auth-shell min-h-screen bg-white lg:flex lg:flex-row-reverse lg:gap-3 lg:p-3">
      <div className="flex min-h-screen flex-1 flex-col px-5 sm:px-10 lg:min-h-[calc(100vh-1.5rem)] xl:px-16">
        <header className="flex h-[112px] shrink-0 items-center justify-between gap-4">
          <TransitionLink to="/welcome" aria-label="ISCS HR home" className="shrink-0" style={BRAND_TRANSITION}>
            <BrandLogo className="h-16 sm:h-20" />
          </TransitionLink>
          {/* On desktop this link sits top-left on the showcase panel instead. */}
          <TransitionLink
            to="/welcome"
            className="group inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13.5px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
            Back to site
          </TransitionLink>
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="auth-enter w-full max-w-[400px]">
            <h1 className={clsx(display, 'text-balance text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-slate-950 sm:text-[36px]')}>
              {title}
            </h1>
            {subtitle ? <p className="mt-3 text-[15.5px] leading-relaxed text-slate-500">{subtitle}</p> : <span />}
            <div className="mt-9">{children}</div>
            {footer ? <div className="mt-8 text-center text-[14px] text-slate-500">{footer}</div> : <span />}
          </div>
        </main>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-slate-100 py-5 text-[12.5px] text-slate-500">
          <span>© {new Date().getFullYear()} ISCS Technologies Private Limited</span>
          <a href={`mailto:${HELP_EMAIL}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-900">
            <Mail size={13} /> Need help? {HELP_EMAIL}
          </a>
        </footer>
      </div>

      <aside className="relative hidden overflow-hidden rounded-[28px] bg-[#0b1024] lg:sticky lg:top-3 lg:block lg:h-[calc(100vh-1.5rem)] lg:w-[50%] lg:max-w-[880px]">
        <Showcase />
      </aside>
    </div>
  );
}
