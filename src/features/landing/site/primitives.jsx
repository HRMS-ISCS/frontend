/**
 * Shared building blocks for the landing page: layout, headings, buttons,
 * the icon map and the browser frame the product screens sit in.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  BadgeIndianRupee,
  Clock,
  Cloud,
  Database,
  FileSignature,
  FileText,
  Fingerprint,
  History,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Receipt,
  ScrollText,
  ShieldCheck,
  Workflow,
} from 'lucide-react';

/* Copy names its icons as strings so copy.js stays free of imports. */
const ICONS = {
  BadgeIndianRupee, Clock, Cloud, Database, FileSignature, FileText, Fingerprint, History,
  KeyRound, LayoutDashboard, Lock, LogOut, Mail, MapPin, Receipt, ScrollText, Workflow,
};

export function Icon({ name, ...props }) {
  const Cmp = ICONS[name] || ShieldCheck;
  return <Cmp {...props} />;
}

/* The display face is only needed on this page, so it is loaded here rather
 * than in index.html, where every screen of the app would pay for it. */
const DISPLAY_FONT_ID = 'site-display-font';
const DISPLAY_FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800&display=swap';

export function useDisplayFont() {
  useEffect(() => {
    if (document.getElementById(DISPLAY_FONT_ID)) return;
    const link = document.createElement('link');
    link.id = DISPLAY_FONT_ID;
    link.rel = 'stylesheet';
    link.href = DISPLAY_FONT_HREF;
    document.head.appendChild(link);
  }, []);
}

export const display = "font-['Inter_Tight',Inter,ui-sans-serif,system-ui,sans-serif]";

export function Container({ className, children }) {
  return <div className={clsx('mx-auto w-full max-w-[1200px] px-5 sm:px-8', className)}>{children}</div>;
}

export function Eyebrow({ children, dark }) {
  return (
    <p className={clsx('text-[13px] font-semibold tracking-wide', dark ? 'text-brand-300' : 'text-brand-600')}>
      {children}
    </p>
  );
}

export function SectionHeader({ eyebrow, title, sub, center, dark, className }) {
  return (
    <div className={clsx('max-w-[720px]', center && 'mx-auto text-center', className)}>
      {eyebrow && <Eyebrow dark={dark}>{eyebrow}</Eyebrow>}
      <h2
        className={clsx(
          display,
          'mt-3 text-balance text-[32px] font-bold leading-[1.08] tracking-[-0.025em] sm:text-[44px]',
          dark ? 'text-white' : 'text-slate-950',
        )}
      >
        {title}
      </h2>
      {sub && (
        <p className={clsx('mt-5 text-pretty text-[17px] leading-relaxed', dark ? 'text-slate-400' : 'text-slate-600')}>
          {sub}
        </p>
      )}
    </div>
  );
}

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4';

export const button = {
  primary: clsx(
    BTN_BASE,
    'bg-brand-600 px-6 py-3.5 text-[15px] text-white shadow-[0_1px_0_0_rgb(255_255_255/0.15)_inset,0_8px_24px_-8px_rgb(49_71_230/0.6)] hover:-translate-y-px hover:bg-brand-700 focus-visible:ring-brand-500/30',
  ),
  secondary: clsx(
    BTN_BASE,
    'border border-slate-300 bg-white px-6 py-3.5 text-[15px] text-slate-900 hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-brand-500/20',
  ),
  light: clsx(
    BTN_BASE,
    'bg-white px-6 py-3.5 text-[15px] text-slate-950 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.4)] hover:-translate-y-px hover:bg-slate-100 focus-visible:ring-white/40',
  ),
  ghostDark: clsx(
    BTN_BASE,
    'border border-white/20 px-6 py-3.5 text-[15px] text-white hover:border-white/40 hover:bg-white/5 focus-visible:ring-white/20',
  ),
};

/**
 * Renders its children at a fixed design width and scales them down to fit
 * the space available, the way a product screenshot shrinks on a phone.
 *
 * A product mock that reflows at narrow widths turns into a cramped mobile
 * layout where every label is truncated; scaling keeps the composition intact
 * and simply makes it smaller. Measured before paint, so nothing jumps.
 */
export function FitToWidth({ width, children, className }) {
  const outer = useRef(null);
  const inner = useRef(null);
  const [box, setBox] = useState({ scale: 1, height: undefined });

  useLayoutEffect(() => {
    const measure = () => {
      if (!outer.current || !inner.current) return;
      const scale = Math.min(1, outer.current.clientWidth / width);
      setBox({ scale, height: inner.current.offsetHeight * scale });
    };
    measure();
    if (typeof ResizeObserver !== 'function') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(outer.current);
    ro.observe(inner.current);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={outer} className={clsx('relative w-full', className)} style={{ height: box.height }}>
      <div
        ref={inner}
        className="absolute left-0 top-0 origin-top-left"
        style={{ width, transform: box.scale < 1 ? `scale(${box.scale})` : undefined }}
      >
        {children}
      </div>
    </div>
  );
}

/** Window chrome around a product screen, so it reads as "this is the app". */
export function BrowserFrame({ url = 'iscshrms.vercel.app/dashboard', children, className }) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        'overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_0_0_1px_rgb(15_23_42/0.02),0_2px_4px_rgb(15_23_42/0.04),0_32px_80px_-24px_rgb(15_23_42/0.35)]',
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-slate-200/80 bg-slate-50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto flex min-w-0 max-w-sm flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500">
          <Lock size={10} className="shrink-0 text-emerald-600" />
          <span className="truncate">{url}</span>
        </div>
        <div className="w-10" />
      </div>
      {children}
    </div>
  );
}

/** Small uppercase label used inside product mocks. */
export function MockLabel({ children, className }) {
  return <p className={clsx('text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400', className)}>{children}</p>;
}

/** Initials avatar for mocks. */
const AVATAR_TONES = [
  'bg-brand-100 text-brand-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
];

export function Initials({ name, size = 'h-7 w-7 text-[10px]', className }) {
  const parts = name.split(' ');
  const text = (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  const tone = AVATAR_TONES[name.length % AVATAR_TONES.length];
  return (
    <span className={clsx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', size, tone, className)}>
      {text}
    </span>
  );
}

export function Chip({ tone = 'slate', children, className }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
    brand: 'bg-brand-50 text-brand-700 ring-brand-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  };
  return (
    <span className={clsx('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset', tones[tone], className)}>
      {children}
    </span>
  );
}
