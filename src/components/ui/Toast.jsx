import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, cls: 'text-emerald-500' },
  error: { icon: AlertCircle, cls: 'text-red-500' },
  info: { icon: Info, cls: 'text-brand-500' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message, title) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((list) => [...list.slice(-3), { id, type, message, title }]);
      setTimeout(() => dismiss(id), type === 'error' ? 7000 : 4500);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (message, title) => push('success', message, title),
      error: (message, title) => push('error', message?.message || message, title),
      info: (message, title) => push('info', message, title),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-2">
          {toasts.map((t) => {
            const { icon: Icon, cls } = STYLES[t.type] || STYLES.info;
            return (
              <div
                key={t.id}
                className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-pop animate-slide-up"
              >
                <Icon size={18} className={clsx('mt-0.5 shrink-0', cls)} />
                <div className="min-w-0 flex-1 text-sm">
                  {t.title && <p className="font-semibold text-slate-900">{t.title}</p>}
                  <p className="text-slate-600">{t.message}</p>
                </div>
                <button type="button" onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
