import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

/**
 * Full-screen "please wait" shown while an onboarding step is saving.
 *
 * Some saves take 7-10 seconds (uploads, several requests). During that time
 * the employee must not click Back, jump to another step, sign out, refresh
 * or use the browser Back button, or the save can be interrupted halfway.
 *
 * While shown it:
 *  - covers the whole page, header and step list included, so nothing is clickable;
 *  - swallows keyboard input, so Tab + Enter cannot reach a button underneath;
 *  - asks for confirmation on refresh / tab close;
 *  - cancels the browser Back button (it stays on this page).
 */
const SLOW_AFTER_MS = 5000;

/** Wording for HR sending a signing package (build + merge + Zoho upload). */
export const SEND_PACKAGE_WAIT = {
  title: 'Saving your details…',
  message: 'This can take up to 30 seconds.',
};

export function SavingOverlay({ show, title = 'Saving your details…', message }) {
  const [slow, setSlow] = useState(false);
  const guardPushed = useRef(false);

  useEffect(() => {
    if (!show) {
      setSlow(false);
      return undefined;
    }

    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);

    // Nothing underneath should keep focus or receive keys.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const blockKeys = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Refresh / close tab.
    const beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    // Browser Back: push a copy of the current entry, and push it again
    // whenever Back pops it, so the page never actually leaves. The copy
    // carries the router's own state, so the router sees no navigation.
    const pushGuard = () => {
      window.history.pushState(window.history.state, '', window.location.href);
      guardPushed.current = true;
    };
    const onPop = () => {
      guardPushed.current = false;
      pushGuard();
    };

    pushGuard();
    window.addEventListener('keydown', blockKeys, true);
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('popstate', onPop);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', blockKeys, true);
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('popstate', onPop);
      // Remove the extra history entry so a later Back behaves normally.
      if (guardPushed.current) {
        guardPushed.current = false;
        window.history.back();
      }
    };
  }, [show]);

  if (!show) return null;

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="assertive"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px] animate-fade-in"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white px-6 py-7 text-center shadow-pop">
        <Loader2 size={36} className="mx-auto animate-spin text-brand-600" aria-hidden="true" />
        <p className="mt-4 text-base font-semibold text-slate-900">{title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          {message || 'This can take up to 10 seconds.'}
        </p>
        <p className="mt-3 text-sm font-medium text-amber-700">
          Please don&apos;t go back, refresh or close this page.
        </p>
        {slow && <p className="mt-3 text-xs text-slate-400">Still working, almost there…</p>}
      </div>
    </div>,
    document.body,
  );
}
