import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';

export function Card({
  title,
  subtitle,
  actions,
  footer,
  children,
  className,
  bodyClassName,
  flush,
  icon: Icon,
  /** 'flat' (default) keeps the page baseline; 'raised' lifts one card that matters. */
  elevation = 'flat',
}) {
  return (
    <div className={clsx(elevation === 'raised' ? 'card-raised' : 'card', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="mt-px flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                <Icon size={17} strokeWidth={2} />
              </span>
            )}
            <div className="min-w-0">
              {title && <h3 className="truncate text-title text-slate-900">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-caption text-slate-500">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={clsx(!flush && 'p-5', bodyClassName)}>{children}</div>
      {footer && (
        <div className="flex flex-wrap items-center justify-end gap-2 rounded-b-card border-t border-slate-100 bg-slate-50/70 px-5 py-3.5">
          {footer}
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, breadcrumbs }) {
  return (
    <div className="mb-6">
      {breadcrumbs && (
        <nav className="mb-2.5 flex items-center gap-1 text-caption text-slate-500">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={13} className="text-slate-300" />}
              {crumb.to ? (
                <Link to={crumb.to} className="font-medium transition-colors hover:text-brand-600">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-slate-700">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-display-sm text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-3xl text-body text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* Icon chip tones. Semantic colours stay distinct from the brand accent so
 * "this is the accent" and "this is a warning" never read as the same thing. */
const TONES = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-100',
  success: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-600 ring-amber-100',
  danger: 'bg-red-50 text-red-600 ring-red-100',
  info: 'bg-sky-50 text-sky-600 ring-sky-100',
  neutral: 'bg-slate-100 text-slate-500 ring-slate-200',
  violet: 'bg-accent-50 text-accent-600 ring-accent-100',
};

/**
 * Headline figure. The number is the point, so it carries the display size
 * and tabular figures; everything else on the tile stays quiet.
 *
 * `trend` is optional: { value: '+12%', direction: 'up' | 'down', label: 'vs last month' }
 */
export function StatCard({ label, value, sub, icon: Icon, tone = 'brand', onClick, className, trend }) {
  const Comp = onClick ? 'button' : 'div';
  const TrendIcon = trend?.direction === 'down' ? TrendingDown : TrendingUp;
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'card group relative w-full overflow-hidden p-5 text-left',
        onClick && 'card-interactive cursor-pointer',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-caption font-medium text-slate-500">{label}</p>
        {Icon && (
          <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', TONES[tone])}>
            <Icon size={17} strokeWidth={2} />
          </span>
        )}
      </div>
      <p className="tabular mt-3 text-display text-slate-900">{value ?? '—'}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        {trend && (
          <span
            className={clsx(
              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
              trend.direction === 'down' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600',
            )}
          >
            <TrendIcon size={11} strokeWidth={2.5} />
            {trend.value}
          </span>
        )}
        {(sub || trend?.label) && (
          <p className="truncate text-xs text-slate-500">{sub || trend.label}</p>
        )}
      </div>
      {onClick && (
        <ArrowUpRight
          size={15}
          className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100 text-slate-300"
        />
      )}
    </Comp>
  );
}

export function DefinitionList({ items, cols = 2 }) {
  return (
    <dl
      className={clsx(
        'grid grid-cols-1 gap-x-6 gap-y-5',
        cols === 2 && 'sm:grid-cols-2',
        cols === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
      )}
    >
      {items.map(({ label, value, full }) => (
        <div key={label} className={clsx(full && 'sm:col-span-full')}>
          <dt className="eyebrow">{label}</dt>
          <dd className="mt-1.5 break-words text-body font-medium text-slate-800">
            {value === null || value === undefined || value === '' ? (
              <span className="font-normal text-slate-400">—</span>
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ProgressBar({ value = 0, tone = 'brand', className, size = 'md' }) {
  const colors = {
    brand: 'bg-brand-600',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div
      className={clsx('w-full overflow-hidden rounded-full bg-slate-100', size === 'sm' ? 'h-1.5' : 'h-2', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={clsx('h-full rounded-full transition-[width] duration-500 ease-out', colors[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
