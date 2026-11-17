/**
 * Page entrance animation, plus scroll reset, on every navigation.
 *
 * Deliberately NOT the landing page's scroll-reveal. That page is read once,
 * slowly, so content arriving as you scroll is delight. These pages are tools
 * opened dozens of times a day: anything that makes data appear later than it
 * could reads as lag, not polish. So this is one fast pass on arrival and then
 * the page is completely still while you work in it.
 *
 * WHY THE ANIMATION IS ON THE CHILD, NOT THIS WRAPPER
 *
 * The obvious version - `animate-slide-up` on this div, keyed by pathname -
 * looks right and is wrong. Pages like the dashboard return a skeleton first
 * and their real content second:
 *
 *     if (isLoading) return <DashboardSkeleton />;
 *     return <div className="space-y-6">…</div>;
 *
 * The wrapper mounts once, animates the *skeleton*, and finishes long before
 * the data lands. The real content then replaces the skeleton with no motion
 * at all - which is exactly the "no motion after signing in" you would see,
 * because the slowest page is the one you land on.
 *
 * Putting the animation on `.page-enter > *` instead means it runs whenever a
 * child element is inserted: on a route change (this div remounts via `key`)
 * and again when a loading root is swapped for a content root. The animation
 * follows the content rather than the clock.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function PageTransition({ children }) {
  const { pathname } = useLocation();

  /* Start every page at the top. Without this the browser keeps the previous
   * page's offset, so opening Employees from a scrolled dashboard drops you
   * into the middle of the table.
   *
   * Keyed on pathname only: changing a filter or a page number must not yank
   * the reader back to the top of a list they are working through. */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
