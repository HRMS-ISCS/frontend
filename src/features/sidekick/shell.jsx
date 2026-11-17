/**
 * Pieces shared by the dashboard card and the pop-out panel: the header with
 * its controls, Fun mode, and the storage helpers both rely on.
 */
import { useState } from 'react';
import clsx from 'clsx';
import { Bot, RotateCcw, Sparkles, X } from 'lucide-react';

/** Dispatch this on `window` to open the sidekick from anywhere (the Ctrl K palette does). */
export const OPEN_SIDEKICK_EVENT = 'hr-sidekick:open';

const FUN_KEY = 'hr-sidekick-fun';

/* Per-viewer conveniences only; the sidekick works the same without storage. */
export const store = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* private window or blocked storage */
    }
  },
};

/** Fun mode adds the joke topic. Off by default; remembered per browser. */
export function useFunMode() {
  const [fun, setFun] = useState(() => store.get(FUN_KEY) === '1');
  const toggle = () =>
    setFun((on) => {
      store.set(FUN_KEY, on ? '0' : '1');
      return !on;
    });
  return [fun, toggle];
}

function IconButton({ label, onClick, pressed, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={clsx(
        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
        pressed ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
      )}
    >
      {children}
    </button>
  );
}

export function SidekickHeader({ fun, onToggleFun, onReset, onClose, closeLabel = 'Close' }) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-sm">
        <Bot size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-slate-900">Chatbot</p>
        <p className="truncate text-[11.5px] text-slate-500">From today's dashboard data</p>
      </div>
      <IconButton label={fun ? 'Fun mode on' : 'Fun mode off'} onClick={onToggleFun} pressed={fun}>
        <Sparkles size={16} />
      </IconButton>
      <IconButton label="Start over" onClick={onReset}>
        <RotateCcw size={15} />
      </IconButton>
      {onClose && (
        <IconButton label={closeLabel} onClick={onClose}>
          <X size={17} />
        </IconButton>
      )}
    </div>
  );
}
