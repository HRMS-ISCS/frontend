/**
 * Motion for the landing page: reveal-on-scroll, and anchor links that glide.
 *
 * Both are scoped to this page on purpose. Setting `scroll-behavior: smooth`
 * on <html> would have been one line, but it applies to the whole app — every
 * programmatic scroll, including the command palette keeping its highlighted
 * row in view, would start animating. So the smoothing lives in a click
 * handler here instead of in global CSS.
 *
 * Safety rule for the reveal: content must never be stranded invisible. If
 * IntersectionObserver is missing, or the reader has asked for reduced motion,
 * or the element is already on screen, it renders visible immediately and the
 * animation is simply skipped. The page at rest is always complete.
 */
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/* Animate only when we can both observe and are allowed to move. Anything
 * else falls through to "already visible". */
function canAnimate() {
  return typeof window !== 'undefined' && typeof window.IntersectionObserver === 'function' && !prefersReducedMotion();
}

/**
 * Fades and lifts its children into place the first time they scroll into
 * view. Reveals once and then stops observing — re-animating on every pass is
 * distracting on a page people scroll up and down.
 */
export function Reveal({ children, delay = 0, className, as: Tag = 'div' }) {
  // Initialised from a function so the check runs once, before first paint.
  const [shown, setShown] = useState(() => !canAnimate());
  const ref = useRef(null);

  useEffect(() => {
    if (shown) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      // Fire a little before the element is fully in view, so the movement is
      // finishing as the reader arrives rather than starting.
      { threshold: 0.05, rootMargin: '0px 0px -8% 0px' },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={ref}
      style={shown && delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={clsx(
        'transition-[opacity,transform] duration-[600ms] ease-out motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * An in-page anchor that scrolls smoothly instead of teleporting.
 *
 * Falls back to the browser's own jump if the target is missing, so a typo in
 * an href degrades to the old behaviour rather than to a dead link.
 */
export function AnchorLink({ href, children, className, ...rest }) {
  const onClick = (event) => {
    if (!href?.startsWith('#')) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
    // Keep the hash in the address bar so the section stays linkable, but
    // without pushing a history entry for every nav click.
    window.history.replaceState(null, '', href);
  };

  return (
    <a href={href} onClick={onClick} className={className} {...rest}>
      {children}
    </a>
  );
}
