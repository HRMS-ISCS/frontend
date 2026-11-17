/** The product tour: one tab per module, each with a detailed product screen. */
import { useRef, useState } from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

import { TOUR } from './copy';
import { Container, Icon, SectionHeader, display } from './primitives';
import { TOUR_SCREENS } from './TourScreens';

/* `?tour=esign` opens that tab, so a link can point straight at one module. */
function initialTab() {
  try {
    const wanted = new URLSearchParams(window.location.search).get('tour');
    const index = TOUR.findIndex((t) => t.key === wanted);
    return index >= 0 ? index : 0;
  } catch {
    return 0;
  }
}

export function ProductTour() {
  const [active, setActive] = useState(initialTab);
  const tabs = useRef([]);
  const item = TOUR[active];
  const Screen = TOUR_SCREENS[item.key];

  const onKeyDown = (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (active + step + TOUR.length) % TOUR.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <section id="product" className="scroll-mt-20 bg-slate-50/70 py-24 sm:py-28">
      <Container>
        <SectionHeader
          center
          eyebrow="The platform"
          title="Everything HR runs on, connected to one employee record."
          sub="Enter a person once. The same record writes their letters, carries their Aadhaar signature, sets their salary and prints their payslips."
        />

        <div
          role="tablist"
          aria-label="Product modules"
          onKeyDown={onKeyDown}
          className="mx-auto mt-12 flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_1px_2px_rgb(15_23_42/0.04)]"
        >
          {TOUR.map((t, i) => (
            <button
              key={t.key}
              ref={(el) => (tabs.current[i] = el)}
              type="button"
              role="tab"
              id={`tour-tab-${t.key}`}
              aria-selected={i === active}
              aria-controls={`tour-panel-${t.key}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={clsx(
                'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-[14px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
                i === active ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
              )}
            >
              <Icon name={t.icon} size={16} strokeWidth={2} />
              {t.tab}
            </button>
          ))}
        </div>

        <div
          key={item.key}
          role="tabpanel"
          id={`tour-panel-${item.key}`}
          aria-labelledby={`tour-tab-${item.key}`}
          className="site-fade mt-12 grid items-center gap-10 lg:min-h-[600px] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16"
        >
          <div>
            <p className="text-[13px] font-semibold text-brand-600">{item.kicker}</p>
            <h3 className={clsx(display, 'mt-3 text-balance text-[28px] font-bold leading-[1.12] tracking-[-0.02em] text-slate-950 sm:text-[34px]')}>
              {item.title}
            </h3>
            <p className="mt-4 text-pretty text-[16px] leading-relaxed text-slate-600">{item.body}</p>
            <ul className="mt-7 space-y-3.5">
              {item.points.map((p) => (
                <li key={p} className="flex gap-3 text-[15px] leading-snug text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex items-center gap-4 border-t border-slate-200 pt-6">
              <p className={clsx(display, 'shrink-0 text-[36px] font-bold leading-none tracking-[-0.02em] text-slate-950')}>
                {item.fact.value}
              </p>
              <p className="text-[14px] leading-snug text-slate-500">{item.fact.label}</p>
            </div>
          </div>

          <div className="relative rounded-[28px] bg-gradient-to-br from-brand-100/70 via-white to-violet-100/60 p-3 ring-1 ring-inset ring-slate-200/70 sm:p-6">
            <Screen />
          </div>
        </div>
      </Container>
    </section>
  );
}
