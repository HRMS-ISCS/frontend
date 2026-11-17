import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { greeting } from '@/lib/format';
import { ROLE_LABELS } from '@/lib/constants';
import { Avatar } from '@/components/ui';
import { BrandLogo } from '@/components/BrandLogo';
import { BRAND_TRANSITION, runViewTransition } from '@/lib/pageTransition';

/**
 * Shown for a moment after a successful sign-in, before the portal opens -
 * the same courtesy Zoho People and Keka extend: confirm who just signed in,
 * then get out of the way.
 *
 * It sits above the router (see App.jsx) rather than inside the login page,
 * because the `PublicOnly` guard redirects the moment the session is live.
 * The landing page therefore loads behind it and is ready when it clears.
 *
 * It never blocks: `onDone` fires on the timer, on any key press and on click,
 * and immediately when the visitor prefers reduced motion.
 */
const HOLD_MS = 2200;

/** Mounted once, above the routes; renders only right after a sign-in. */
export function SignInWelcome() {
  const { welcome, dismissWelcome } = useAuth();
  const closing = useRef(false);

  /* Clearing the splash runs as a view transition: the splash dissolves, the
   * portal rises in behind it and the logo glides to the sidebar. The timer,
   * a key press and a click can all fire - only the first one counts. Stable
   * identity matters too: WelcomeSplash restarts its timer when this changes. */
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    runViewTransition(dismissWelcome);
  }, [dismissWelcome]);

  useEffect(() => {
    if (welcome) closing.current = false;
  }, [welcome]);

  if (!welcome) return null;
  return <WelcomeSplash profile={welcome} onDone={close} />;
}

export function WelcomeSplash({ profile, onDone }) {
  const [progress, setProgress] = useState(0);

  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.username || '';
  const firstName = name.split(' ')[0] || 'there';
  const roleLabel = ROLE_LABELS[profile?.role] || profile?.role || '';

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      onDone();
      return undefined;
    }

    /* The landing page loads behind the overlay - keep its scrollbar out of sight. */
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const start = requestAnimationFrame(() => setProgress(100));
    const timer = setTimeout(onDone, HOLD_MS);
    const skip = () => onDone();
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);
    return () => {
      document.body.style.overflow = previousOverflow;
      cancelAnimationFrame(start);
      clearTimeout(timer);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-sidebar px-6 animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(900px 500px at 50% -20%, rgba(59,101,246,0.45), transparent 60%), radial-gradient(700px 500px at 110% 120%, rgba(37,71,235,0.35), transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-md text-center animate-slide-up">
        <div className="flex justify-center">
          <span className="inline-flex rounded-xl bg-white px-4 py-2.5 shadow-lg shadow-slate-950/20" style={BRAND_TRANSITION}>
            <BrandLogo className="h-11" />
          </span>
        </div>

        <div className="mt-10 flex justify-center">
          <Avatar
            name={name}
            src={profile?.profile_photo_url}
            size="xl"
            className="ring-4 ring-white/15 shadow-xl shadow-slate-950/30"
          />
        </div>

        <p className="mt-6 text-sm font-medium text-brand-300">{greeting()}, {firstName}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
          Welcome to ISCS Technologies
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Signed in as <span className="font-semibold text-white">{name}</span>
        </p>
        {(roleLabel || profile?.employee_id) && (
          <p className="mt-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-white/15">
              {roleLabel}
              {profile?.employee_id && (
                <>
                  <span className="text-slate-500">·</span>
                  {profile.employee_id}
                </>
              )}
            </span>
          </p>
        )}

        <div className="mx-auto mt-10 h-1 w-48 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-brand-400 transition-[width] duration-[2000ms] ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-4 text-xs text-slate-400">Preparing your workspace…</p>
      </div>
    </div>
  );
}
