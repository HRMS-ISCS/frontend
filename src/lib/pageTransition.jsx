/**
 * Animated page changes between the public pages (landing <-> sign-in).
 *
 * A plain <Link> swaps the whole screen in one frame, which reads as a jump
 * when the two pages look nothing alike. Here the swap runs inside the
 * browser's View Transitions API: the outgoing page recedes, the incoming one
 * settles in, and any element carrying the same `view-transition-name` on both
 * pages (the logo) glides from one position to the other.
 *
 * Browsers without the API, and readers who prefer reduced motion, get the
 * ordinary instant navigation - nothing breaks, it just doesn't animate.
 *
 * Used only on the public pages, so no portal navigation is affected.
 */
import { forwardRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';

import './pageTransition.css';

/** Put on the logo on both pages so it morphs across the transition. */
export const BRAND_TRANSITION = { viewTransitionName: 'brand-logo' };

function canTransition() {
  if (typeof document === 'undefined' || typeof document.startViewTransition !== 'function') return false;
  return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function useTransitionNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (to, options) => {
      const go = () => {
        navigate(to, options);
        window.scrollTo(0, 0);
      };
      if (!canTransition()) {
        go();
        return;
      }
      // flushSync so the new route is in the DOM before the browser takes the
      // "after" snapshot; otherwise it would animate to the old page.
      document.startViewTransition(() => flushSync(go));
    },
    [navigate],
  );
}

/**
 * Apply a state change inside a view transition, so whatever it swaps on
 * screen cross-fades instead of cutting. Runs `update` directly where the API
 * is missing or motion is reduced. Resolves once the new state is in the DOM.
 *
 * Only the state change belongs in here - never a network call. The page is
 * frozen on its "before" snapshot until `update` returns.
 */
export function runViewTransition(update) {
  if (!canTransition()) {
    update();
    return Promise.resolve();
  }
  const transition = document.startViewTransition(() => flushSync(update));
  return transition.updateCallbackDone.catch(() => {});
}

/** Drop-in for <Link> that animates the page change. */
export const TransitionLink = forwardRef(function TransitionLink({ to, replace, state, onClick, ...rest }, ref) {
  const go = useTransitionNavigate();

  const handleClick = (e) => {
    onClick?.(e);
    // Leave modified clicks (new tab, new window) and middle clicks to the browser.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go(to, { replace, state });
  };

  return <Link ref={ref} to={to} replace={replace} state={state} onClick={handleClick} {...rest} />;
});
