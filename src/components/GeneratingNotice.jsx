import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Shown while a document is being generated on the server, which usually
 * takes 30-40 seconds per document. Tells the user how long to expect,
 * counts the seconds, and asks the browser to warn before the tab is closed
 * so the download is not lost halfway.
 *
 *   active - render only while true
 *   what   - what is being made, e.g. "the appointment letter"
 *   count  - number of documents in a bulk run (optional)
 */
const TYPICAL_SECONDS = 40;

export function GeneratingNotice({ active, what = 'the document', count }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    setSeconds(0);
    const started = Date.now();
    const tick = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      clearInterval(tick);
      window.removeEventListener('beforeunload', warn);
    };
  }, [active]);

  if (!active) return null;

  const bulk = count > 1;
  const expected = bulk ? TYPICAL_SECONDS * count : TYPICAL_SECONDS;
  // Never reaches 100% on its own: the bar only says "still working", not "done".
  const percent = Math.min(95, Math.round((seconds / expected) * 100));
  const overdue = seconds > expected;

  return (
    <div role="status" aria-live="polite" className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <Loader2 size={18} className="mt-0.5 shrink-0 animate-spin text-brand-600" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">Generating {what}…</p>
            <span className="shrink-0 text-xs tabular-nums text-slate-500">{seconds}s</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {overdue
              ? 'Taking a little longer than usual. Still working on it, please wait.'
              : bulk
                ? `Each payslip takes about 30–40 seconds, so ${count} payslips can take a few minutes.`
                : 'This usually takes 30–40 seconds.'}{' '}
            Please keep this page open.
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-100">
            <div className="h-full rounded-full bg-brand-600 transition-[width] duration-1000 ease-linear" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
