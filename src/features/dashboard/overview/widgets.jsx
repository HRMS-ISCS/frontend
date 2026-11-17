/**
 * Small visual building blocks for the HR dashboard: a segmented bar, a
 * progress ring, a coloured dot legend row and a panel header link.
 *
 * All of them are plain SVG / CSS - no chart library - and all of them are
 * decorative companions to numbers that are also printed as text, so they are
 * hidden from screen readers.
 */
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight } from 'lucide-react';

/** Share of `total`, as a whole-number percentage that never divides by zero. */
export const pct = (value, total) => (total > 0 ? Math.round(((value || 0) / total) * 100) : 0);

/**
 * One bar split into coloured parts. `parts` is [{ value, className }]; widths
 * are relative to their sum, so the parts always fill the bar exactly.
 */
export function SegmentBar({ parts, className, size = 'md' }) {
  const total = parts.reduce((n, p) => n + (p.value || 0), 0);
  return (
    <div
      aria-hidden="true"
      className={clsx('flex w-full gap-[3px] overflow-hidden rounded-full bg-slate-100', size === 'sm' ? 'h-1.5' : 'h-2', className)}
    >
      {total > 0 &&
        parts.map((p, i) =>
          p.value ? (
            <span
              key={i}
              className={clsx('h-full rounded-full transition-[width] duration-700 ease-out', p.className)}
              style={{ width: `${(p.value / total) * 100}%` }}
            />
          ) : null,
        )}
    </div>
  );
}

/** A thin progress ring with the value printed in the middle. */
export function Ring({ value = 0, size = 64, stroke = 7, color = '#3147e6', track = '#eef2f7', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * c} ${c}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/** "● Label ........ value" - one row of a legend. */
export function DotRow({ dot, label, value, sub }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className="flex min-w-0 items-center gap-2 text-slate-600">
        <span className={clsx('h-2 w-2 shrink-0 rounded-full', dot)} />
        <span className="truncate">{label}</span>
      </span>
      <span className="tabular shrink-0 font-semibold text-slate-900">
        {value ?? 0}
        {sub !== undefined && <span className="ml-1.5 text-xs font-normal text-slate-400">{sub}</span>}
      </span>
    </div>
  );
}

/** The "View all →" link that sits in a card header. */
export function HeaderLink({ to, children }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-[13px] font-semibold text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
    >
      {children}
      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
