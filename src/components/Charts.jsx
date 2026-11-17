import clsx from 'clsx';

/** Lightweight SVG donut - no chart library needed for a handful of slices. */
export function Donut({ segments, size = 148, thickness = 18, centerLabel, centerValue }) {
  const total = segments.reduce((sum, s) => sum + (s.value || 0), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
        {total > 0 &&
          segments.map((s) => {
            const length = ((s.value || 0) / total) * circumference;
            // A hairline gap between slices reads as separate values, not one ring.
            const gap = length > 4 ? 2 : 0;
            const dash = `${Math.max(length - gap, 0)} ${circumference - length + gap}`;
            const circle = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += length;
            return circle;
          })}
      </svg>
      <div className="absolute text-center">
        <p className="tabular text-display text-slate-900">{centerValue ?? total}</p>
        {centerLabel && <p className="mt-0.5 text-xs font-medium text-slate-500">{centerLabel}</p>}
      </div>
    </div>
  );
}

export function Legend({ items }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center justify-between gap-4 text-caption">
          <span className="flex min-w-0 items-center gap-2.5 text-slate-600">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
            <span className="truncate">{item.label}</span>
          </span>
          <span className="tabular shrink-0 font-semibold text-slate-800">
            {item.value}
            {item.sub !== undefined && <span className="ml-1.5 text-xs font-normal text-slate-400">{item.sub}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function HorizontalBars({ rows, highlight }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const isHighlight = highlight === row.label;
        return (
          <li key={row.label}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-caption">
              <span className="truncate text-slate-600">{row.label}</span>
              <span className={clsx('tabular shrink-0 font-semibold', isHighlight ? 'text-amber-600' : 'text-slate-800')}>
                {row.value}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={clsx(
                  'h-full rounded-full transition-[width] duration-500 ease-out',
                  isHighlight ? 'bg-amber-500' : 'bg-brand-500',
                )}
                style={{ width: `${(row.value / max) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
