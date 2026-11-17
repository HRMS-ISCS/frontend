/**
 * "Needs attention" - the categories the backend flags, most severe first.
 * Each row opens the page where the fix happens. When nothing is flagged the
 * panel shrinks to a single reassuring line instead of an empty card.
 */
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { AlertOctagon, AlertTriangle, ChevronRight, Info, ShieldCheck } from 'lucide-react';

/** Backend action items point at API paths; map them to portal routes. */
export function routeForEndpoint(endpoint = '') {
  const [path, query = ''] = endpoint.split('?');
  const qs = query ? `?${query}` : '';
  if (path.startsWith('/dashboard/stuck-employees') || path.startsWith('/dashboard/onboarding-funnel')) return `/onboarding-tracker${qs}`;
  if (path.startsWith('/zoho-sign') || path.startsWith('/dashboard/signature-status')) return `/signatures${qs}`;
  if (path.startsWith('/dashboard/document-history')) return `/documents/history${qs}`;
  return '/dashboard';
}

const ORDER = ['high', 'medium', 'low'];

const SEVERITY = {
  high: { icon: AlertOctagon, label: 'High', iconCls: 'bg-red-50 text-red-600 ring-red-100', count: 'bg-red-600 text-white' },
  medium: { icon: AlertTriangle, label: 'Medium', iconCls: 'bg-amber-50 text-amber-600 ring-amber-100', count: 'bg-amber-500 text-white' },
  low: { icon: Info, label: 'Low', iconCls: 'bg-slate-100 text-slate-500 ring-slate-200', count: 'bg-slate-200 text-slate-700' },
};

export function Attention({ block }) {
  const navigate = useNavigate();
  const items = [...(block?.items || [])].sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));

  if (!items.length) {
    return (
      <div className="flex items-center gap-3.5 rounded-card border border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-white px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-xs ring-1 ring-emerald-100">
          <ShieldCheck size={19} />
        </span>
        <div>
          <p className="text-[14px] font-semibold text-emerald-900">Nothing needs your attention</p>
          <p className="mt-0.5 text-[12.5px] text-emerald-800/80">Onboarding, signatures and document delivery are all healthy.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="card-raised overflow-hidden" aria-labelledby="attention-title">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <h2 id="attention-title" className="text-title text-slate-900">
            Needs attention
          </h2>
          <span className="tabular rounded-full bg-slate-100 px-2 py-0.5 text-[11.5px] font-semibold text-slate-600">{items.length}</span>
        </div>
        <p className="hidden text-[12.5px] text-slate-400 sm:block">Most severe first</p>
      </div>

      <ul className="divide-y divide-slate-100">
        {items.map((item) => {
          const cfg = SEVERITY[item.severity] || SEVERITY.low;
          return (
            <li key={item.type}>
              <button
                type="button"
                onClick={() => navigate(routeForEndpoint(item.endpoint))}
                className="group flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-slate-50/80"
              >
                <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', cfg.iconCls)}>
                  <cfg.icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium text-slate-800">{item.message}</span>
                  <span className="mt-0.5 block text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">{cfg.label} priority</span>
                </span>
                <span className={clsx('tabular min-w-[28px] rounded-full px-2 py-0.5 text-center text-[12px] font-bold', cfg.count)}>
                  {item.count}
                </span>
                <ChevronRight size={17} className="shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
