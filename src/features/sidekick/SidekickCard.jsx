/**
 * The sidekick as a card on the dashboard, where the data is already loaded.
 * "Hide for today" folds it to a small pill until tomorrow (same key the old
 * card used, so an existing choice carries over).
 */
import { useState } from 'react';
import { Bot } from 'lucide-react';

import { SidekickChat } from './SidekickChat';
import { SidekickHeader, store, useFunMode } from './shell';

const HIDE_KEY = 'hr-sidekick-hidden-on';
const today = () => new Date().toDateString();

export function SidekickCard({ data, firstName }) {
  const [hidden, setHidden] = useState(() => store.get(HIDE_KEY) === today());
  const [fun, toggleFun] = useFunMode();
  const [session, setSession] = useState(0);

  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => {
          store.set(HIDE_KEY, '');
          setHidden(false);
        }}
        className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-xs hover:border-brand-300 hover:text-brand-700"
      >
        <Bot size={14} className="text-brand-600" /> Show chatbot
      </button>
    );
  }

  return (
    <section className="card flex flex-col overflow-hidden" aria-label="Chatbot">
      <SidekickHeader
        fun={fun}
        onToggleFun={toggleFun}
        onReset={() => setSession((n) => n + 1)}
        onClose={() => {
          store.set(HIDE_KEY, today());
          setHidden(true);
        }}
        closeLabel="Hide for today"
      />
      <SidekickChat key={session} data={data} firstName={firstName} fun={fun} className="max-h-[360px]" />
    </section>
  );
}
