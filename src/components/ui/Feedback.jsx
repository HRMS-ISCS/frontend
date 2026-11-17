import clsx from 'clsx';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2, RefreshCw } from 'lucide-react';

import { Button } from './Button';

/* Semantic tones are deliberately separate from the brand accent: a badge
 * should say "this is the state" without competing with "this is an action". */
const BADGE_TONES = {
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200/70',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200/70',
  info: 'bg-sky-50 text-sky-700 ring-sky-200/70',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200/70',
  danger: 'bg-red-50 text-red-700 ring-red-200/70',
  violet: 'bg-accent-50 text-accent-700 ring-accent-200/70',
};

const DOT_TONES = {
  neutral: 'bg-slate-400',
  brand: 'bg-brand-500',
  info: 'bg-sky-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  violet: 'bg-accent-500',
};

export function Badge({ tone = 'neutral', dot, icon: Icon, children, className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset',
        BADGE_TONES[tone],
        className,
      )}
    >
      {dot && <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', DOT_TONES[tone])} />}
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      {children}
    </span>
  );
}

const ALERT = {
  info: { cls: 'border-sky-200/80 bg-sky-50/70 text-sky-900', icon: Info, iconCls: 'text-sky-500' },
  success: { cls: 'border-emerald-200/80 bg-emerald-50/70 text-emerald-900', icon: CheckCircle2, iconCls: 'text-emerald-500' },
  warning: { cls: 'border-amber-200/80 bg-amber-50/70 text-amber-900', icon: AlertTriangle, iconCls: 'text-amber-500' },
  danger: { cls: 'border-red-200/80 bg-red-50/70 text-red-900', icon: AlertCircle, iconCls: 'text-red-500' },
  neutral: { cls: 'border-slate-200 bg-slate-50 text-slate-800', icon: Info, iconCls: 'text-slate-400' },
};

export function Alert({ tone = 'info', title, children, icon, action, className }) {
  const cfg = ALERT[tone] || ALERT.info;
  const Icon = icon || cfg.icon;
  return (
    <div className={clsx('flex gap-3 rounded-xl border px-4 py-3.5 text-[13.5px]', cfg.cls, className)} role="alert">
      <Icon size={18} className={clsx('mt-px shrink-0', cfg.iconCls)} strokeWidth={2} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={clsx('leading-relaxed opacity-90', title && 'mt-1')}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

export function Spinner({ size = 20, className }) {
  return <Loader2 size={size} className={clsx('animate-spin text-brand-600', className)} />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-caption text-slate-500">
      <Spinner size={26} />
      {label}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {Icon && (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200/70">
          <Icon size={24} strokeWidth={1.75} />
        </span>
      )}
      <p className="text-title text-slate-800">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-body text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-inset ring-red-100">
        <AlertCircle size={24} strokeWidth={1.75} />
      </span>
      <p className="text-title text-slate-800">
        {error?.status === 403 ? 'You do not have access to this' : title}
      </p>
      <p className="mt-1.5 max-w-md text-body text-slate-500">{error?.message || 'Please try again.'}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RefreshCw} className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={clsx('skeleton', className)} />;
}
