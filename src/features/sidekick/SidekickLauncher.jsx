/**
 * The sidekick everywhere else: a floating button bottom-right on every HR
 * page, opening a panel with the same conversation as the dashboard card.
 *
 * The badge counts the things that need HR (countersigns, stalled joiners,
 * failed emails, celebrations today) and clears once the panel has been opened
 * - it comes back only when those numbers change, so it signals something new
 * rather than nagging about what HR has already seen.
 *
 * Mounted once in AppShell. On the dashboard the button hides (the card is
 * right there), but the panel can still be opened from Ctrl K.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot } from 'lucide-react';

import { useAuth } from '@/lib/auth';
import { Skeleton } from '@/components/ui';
import { attentionCounts } from './answers';
import { SidekickChat } from './SidekickChat';
import { OPEN_SIDEKICK_EVENT, SidekickHeader, store, useFunMode } from './shell';
import { useOverview } from './useOverview';

const SEEN_KEY = 'hr-sidekick-seen';

function signatureOf(counts) {
  return counts ? [counts.countersign, counts.stuck, counts.emailFailures, counts.celebrationsToday].join('-') : '';
}

function Panel({ data, isLoading, error, firstName, onClose }) {
  const [fun, toggleFun] = useFunMode();
  const [session, setSession] = useState(0);
  const dialogOpen = useRef(false);
  const panelRef = useRef(null);

  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && !dialogOpen.current) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-label="Chatbot"
      className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-white outline-none animate-slide-up sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(640px,calc(100vh-2.5rem))] sm:w-[400px] sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-[0_24px_64px_-16px_rgb(15_23_42/0.35)]"
    >
      <SidekickHeader fun={fun} onToggleFun={toggleFun} onReset={() => setSession((n) => n + 1)} onClose={onClose} />
      {isLoading ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      ) : error || !data ? (
        <p className="p-5 text-[13.5px] text-slate-500">I couldn't load today's data. Try again in a moment.</p>
      ) : (
        <SidekickChat
          key={session}
          data={data}
          firstName={firstName}
          fun={fun}
          onNavigate={onClose}
          onDialogChange={(open) => {
            dialogOpen.current = open;
          }}
        />
      )}
    </div>
  );
}

export function SidekickLauncher() {
  const { isHr, displayName } = useAuth();
  const { pathname } = useLocation();
  const { data, isLoading, error } = useOverview({ enabled: isHr });
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => store.get(SEEN_KEY));
  const close = useCallback(() => setOpen(false), []);

  const counts = data ? attentionCounts(data) : null;
  const signature = signatureOf(counts);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_SIDEKICK_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SIDEKICK_EVENT, onOpen);
  }, []);

  // Opening the panel marks the current numbers as seen.
  useEffect(() => {
    if (open && signature) {
      store.set(SEEN_KEY, signature);
      setSeen(signature);
    }
  }, [open, signature]);

  if (!isHr) return null;

  const unread =
    counts && signature !== seen
      ? [counts.countersign, counts.stuck, counts.emailFailures, counts.celebrationsToday].filter(Boolean).length
      : 0;
  const firstName = displayName.split(' ')[0] || 'there';

  return (
    <>
      {!open && pathname !== '/dashboard' && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={unread ? `Open chatbot, ${unread} new` : 'Open chatbot'}
          title="Chatbot"
          className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-[0_12px_32px_-8px_rgb(49_71_230/0.6)] transition-transform hover:scale-105 active:scale-95"
        >
          <Bot size={21} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
              {unread}
            </span>
          )}
        </button>
      )}
      {open && (
        <Panel data={data} isLoading={isLoading} error={error} firstName={firstName} onClose={close} />
      )}
    </>
  );
}
