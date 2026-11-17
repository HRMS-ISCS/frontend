/**
 * The sidekick conversation: tap a question, get an answer built from the
 * dashboard data, act on it with one click.
 *
 * Used by both the dashboard card and the pop-out panel. Messages store the
 * topic, not the text, so an answer always reflects the latest data - a
 * dashboard refresh quietly updates what the sidekick says. Jokes are the one
 * exception: they are picked once, so a refresh doesn't swap the punchline.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, Bot, Gift } from 'lucide-react';

import { greeting } from '@/lib/format';
import { WishModal } from '@/features/dashboard/CelebrationsCard';
import { answerFor, openingFor, TOPIC_GROUPS, TOPICS } from './answers';

const THINK_MS = 450;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

let nextId = 1;

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="Chatbot is typing">
      {[0, 150, 300].map((delay) => (
        <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${delay}ms` }} />
      ))}
    </span>
  );
}

function BotAvatar() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-sm">
      <Bot size={14} />
    </span>
  );
}

function ActionButton({ action, onRun }) {
  return (
    <button
      type="button"
      onClick={() => onRun(action)}
      className="group inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
    >
      {action.wish ? <Gift size={13} /> : null}
      {action.label}
      {!action.wish && <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />}
    </button>
  );
}

function BotMessage({ answer, heading }) {
  return (
    <div
      className={clsx(
        'w-fit max-w-full rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13.5px] leading-relaxed text-slate-800',
        answer.tone === 'attention' ? 'bg-amber-50 ring-1 ring-inset ring-amber-100' : 'bg-slate-100',
      )}
    >
      {heading && <p className="font-semibold text-slate-900">{heading}</p>}
      {answer.lines.map((line, i) => (
        <p key={i} className={clsx(line.startsWith('•') && 'pl-1')}>{line}</p>
      ))}
    </div>
  );
}

/**
 * @param data        dashboard overview payload
 * @param firstName   for the greeting
 * @param fun         show the joke topic
 * @param onNavigate  called after an action navigates (the panel closes itself)
 * @param onDialogChange  told when the wish dialog opens/closes, so the panel
 *                    doesn't close on the same Escape press that closes it
 * @param className   sizing of the scrolling message area
 */
export function SidekickChat({ data, firstName, fun, onNavigate, onDialogChange, className }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(() => [{ id: 0, from: 'bot', topic: 'opening' }]);
  const [typing, setTyping] = useState(false);
  const [wishTarget, setWishTarget] = useState(null);
  const [group, setGroup] = useState(TOPIC_GROUPS[0].id);
  const listRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [messages, typing]);

  const ask = (topic) => {
    if (typing) return;
    const fixed = topic.id === 'joke' ? answerFor('joke', data) : null;
    setMessages((list) => [...list, { id: nextId++, from: 'me', text: topic.label }]);
    const reply = () => {
      setMessages((list) => [...list, { id: nextId++, from: 'bot', topic: topic.id, fixed }]);
      setTyping(false);
    };
    if (prefersReducedMotion()) reply();
    else {
      setTyping(true);
      timer.current = setTimeout(reply, THINK_MS);
    }
  };

  const run = (action) => {
    if (action.wish) {
      setWishTarget(action.wish);
      onDialogChange?.(true);
      return;
    }
    navigate(action.to);
    onNavigate?.();
  };

  const closeWish = () => {
    setWishTarget(null);
    onDialogChange?.(false);
  };

  const topics = TOPICS.filter((t) => (fun || !t.fun) && t.group === group);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={listRef} className={clsx('min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 scrollbar-thin', className)} aria-live="polite">
        {messages.map((m) => {
          if (m.from === 'me') {
            return (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-600 px-3.5 py-2 text-[13.5px] font-medium text-white">{m.text}</p>
              </div>
            );
          }
          const opening = m.topic === 'opening';
          const answer = m.fixed || (opening ? openingFor(data) : answerFor(m.topic, data));
          if (!answer) return null;
          return (
            <div key={m.id} className="flex items-start gap-2.5">
              <BotAvatar />
              <div className="min-w-0 flex-1 space-y-2">
                <BotMessage answer={answer} heading={opening ? `${greeting()}, ${firstName}. Here's your day:` : null} />
                {answer.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {answer.actions.map((a) => (
                      <ActionButton key={a.label} action={a} onRun={run} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="flex items-start gap-2.5">
            <BotAvatar />
            <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">Ask me</p>
          <div role="tablist" aria-label="Question type" className="flex rounded-lg bg-slate-100 p-0.5">
            {TOPIC_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={group === g.id}
                onClick={() => setGroup(g.id)}
                className={clsx(
                  'rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors',
                  group === g.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800',
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex max-h-[148px] flex-wrap gap-1.5 overflow-y-auto scrollbar-thin">
          {topics.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={typing}
              onClick={() => ask(t)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-xs transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {wishTarget && (
        <WishModal item={wishTarget} onClose={closeWish} onSent={closeWish} />
      )}
    </div>
  );
}
