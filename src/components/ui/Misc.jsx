import { useRef, useState } from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

import { initials } from '@/lib/format';
import { useClickOutside } from '@/lib/hooks';
import { Button } from './Button';

/* ------------------------------------------------------------- Avatar --- */
/* Tinted rather than saturated: a wall of avatars in a table should read as
 * people, not as a colour chart competing with the status badges. */
const AVATAR_COLORS = [
  'bg-brand-100 text-brand-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-accent-100 text-accent-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
];

const AVATAR_SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-9 w-9 text-[11px]',
  md: 'h-11 w-11 text-[13px]',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-2xl',
};

export function Avatar({ name, src, size = 'md', className }) {
  const [failed, setFailed] = useState(false);
  const color = AVATAR_COLORS[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
  const cls = clsx(
    'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ring-1 ring-inset ring-black/5',
    AVATAR_SIZES[size],
    className,
  );
  if (src && !failed) {
    return <img src={src} alt={name || ''} onError={() => setFailed(true)} className={clsx(cls, 'object-cover')} />;
  }
  return <span className={clsx(cls, color)}>{initials(name)}</span>;
}

/* --------------------------------------------------------------- Tabs --- */
export function Tabs({ tabs, value, onChange, className, variant = 'underline' }) {
  if (variant === 'pill') {
    return (
      <div className={clsx('inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1', className)}>
        {tabs.map((tab) => {
          const active = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={clsx(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all',
                active ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800',
              )}
            >
              {tab.icon && <tab.icon size={14} />}
              {tab.label}
              {tab.count !== undefined && tab.count !== null && (
                <span className={clsx('rounded-md px-1.5 text-[11px] font-semibold', active ? 'bg-brand-50 text-brand-700' : 'bg-slate-200/70 text-slate-600')}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={clsx('border-b border-slate-200', className)}>
      <nav className="-mb-px flex gap-6 overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => {
          const active = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={clsx(
                'flex items-center gap-2 whitespace-nowrap border-b-2 px-0.5 pb-3 pt-1 text-[13.5px] font-semibold transition-colors',
                active
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800',
              )}
            >
              {tab.icon && <tab.icon size={15} />}
              {tab.label}
              {tab.count !== undefined && tab.count !== null && (
                <span
                  className={clsx(
                    'rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
                    active ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* --------------------------------------------------------- Pagination --- */
export function Pagination({ page, totalPages, total, pageSize, onChange }) {
  if (!total) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-caption text-slate-500">
      <span className="tabular">
        <span className="font-semibold text-slate-700">{from}</span>–
        <span className="font-semibold text-slate-700">{to}</span> of{' '}
        <span className="font-semibold text-slate-700">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page" />
        <span className="tabular px-2 text-xs font-medium">
          {page} / {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="secondary"
          size="sm"
          icon={ChevronRight}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------- Dropdown menu --- */
export function Menu({ items, trigger, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  const visible = items.filter(Boolean).filter((i) => !i.hidden);
  if (!visible.length) return null;

  return (
    <div className="relative inline-block text-left" ref={ref}>
      {trigger ? (
        <span onClick={() => setOpen((v) => !v)}>{trigger}</span>
      ) : (
        <Button variant="ghost" size="sm" icon={MoreHorizontal} onClick={() => setOpen((v) => !v)} aria-label="Actions" />
      )}
      {open && (
        <div
          className={clsx(
            'absolute z-30 mt-1.5 min-w-[200px] overflow-hidden rounded-xl border border-slate-200/80 bg-white p-1 shadow-pop animate-scale-in',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
          )}
        >
          {visible.map((item) =>
            item.divider ? (
              <div key={item.key || Math.random()} className="my-1 border-t border-slate-100" />
            ) : (
              <button
                key={item.label}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
                className={clsx(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                  item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-100',
                )}
              >
                {item.icon && <item.icon size={15} className={item.danger ? '' : 'text-slate-400'} />}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------ Segmented ------- */
export function Segmented({ options, value, onChange, size = 'md' }) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={clsx(
            'rounded-lg font-semibold transition-colors',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-[13px]',
            value === opt.value ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white hover:text-slate-900',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
