/**
 * Global command palette - Ctrl/Cmd + K.
 *
 * One box that reaches everything the signed-in role is allowed to reach:
 * every employee, every page in their sidebar, and the handful of actions
 * that would otherwise take three clicks.
 *
 * Nothing here is new capability. The employee list comes from the same
 * cached `useEmployees()` query the pickers already use, and every result is
 * a route the role's own navigation already grants - so the palette can never
 * offer a door the sidebar would not.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  ArrowRight,
  Bot,
  CornerDownLeft,
  FileSignature,
  FileText,
  Receipt,
  ScrollText,
  Search,
  ShieldCheck,
  UserMinus,
  Users,
} from 'lucide-react';

import { useAuth } from '@/lib/auth';
import { isHrRole } from '@/lib/constants';
import { employeeType } from '@/lib/format';
import { Avatar } from '@/components/ui';
import { photoOf, useEmployees } from '@/components/EmployeePicker';
import { navigationFor } from '@/components/layout/navigation';
import { OPEN_SIDEKICK_EVENT } from '@/features/sidekick/shell';

const RECENTS_KEY = 'hrms.palette.recents';
const MAX_RECENTS = 5;
const MAX_EMPLOYEE_HITS = 8;

/* Actions worth a shortcut: the ones that are a form, not a page, and that HR
 * reaches several times a day. Each is a route the HR sidebar already covers
 * (/letters, /payroll), reached one level deeper. */
const HR_ACTIONS = [
  { id: 'a:offer', label: 'Issue proposed offer letter', to: '/letters/proposed-offer', icon: FileText, keywords: 'offer ctc new hire' },
  { id: 'a:appointment', label: 'Issue appointment letter', to: '/letters/appointment', icon: ScrollText, keywords: 'appointment joining annexure' },
  { id: 'a:nda', label: 'Issue non-disclosure agreement', to: '/letters/nda', icon: ShieldCheck, keywords: 'nda confidentiality' },
  { id: 'a:relieving', label: 'Issue relieving & experience letter', to: '/letters/relieving', icon: UserMinus, keywords: 'relieving exit experience resignation' },
  { id: 'a:payslip', label: 'Generate a payslip', to: '/payroll/run', icon: Receipt, keywords: 'payslip salary payroll month' },
  { id: 'a:sign', label: 'Send documents for signature', to: '/signatures', icon: FileSignature, keywords: 'zoho esign aadhaar envelope send' },
  /* Not a page: opens the sidekick panel wherever you are. */
  { id: 'a:sidekick', label: 'Ask the chatbot', event: OPEN_SIDEKICK_EVENT, icon: Bot, keywords: 'chatbot chat bot sidekick assistant help today needs me stuck birthdays' },
];

/**
 * How well `text` answers `q`, or -1 for no match.
 *
 * Deliberately not a generic fuzzy library: the ranking has to be predictable
 * for someone typing an employee ID, so a prefix beats a word start beats a
 * substring, and a scattered subsequence ranks last rather than surfacing
 * "Salary Structures" for the query "sts".
 */
export function score(text, q) {
  if (!text) return -1;
  const t = text.toLowerCase();
  const at = t.indexOf(q);
  if (at === 0) return 100;
  if (at > 0) return ' /-_.'.includes(t[at - 1]) ? 80 : 55;

  let i = 0;
  for (const ch of q) {
    i = t.indexOf(ch, i);
    if (i === -1) return -1;
    i += 1;
  }
  return 15;
}

export function scoreItem(item, q) {
  return Math.max(score(item.label, q), score(item.sub, q) - 10, score(item.keywords, q) - 25);
}

function readRecents() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((id) => typeof id === 'string').slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

function pushRecent(id) {
  try {
    const next = [id, ...readRecents().filter((x) => x !== id)].slice(0, MAX_RECENTS);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* Private window or blocked storage - recents are a convenience, not state. */
  }
}

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);

/**
 * Open state plus the global hotkey. Lives here rather than in the palette so
 * the header's search button and the shortcut drive the same switch.
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return { open, setOpen };
}

export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const hr = isHrRole(role);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const listRef = useRef(null);

  // Employees are HR-only on the backend, and only worth fetching once the
  // palette is actually open. The query key is shared, so a page that already
  // loaded the list makes this free.
  const { data: employees = [], isLoading: employeesLoading } = useEmployees(open && hr);

  const pages = useMemo(
    () =>
      navigationFor(role).flatMap((group) =>
        group.items.map((item) => ({
          id: `p:${item.to}`,
          label: item.label,
          sub: group.section || null,
          keywords: `${group.section || ''} ${item.to}`,
          icon: item.icon,
          to: item.to,
          group: 'Pages',
        })),
      ),
    [role],
  );

  const actions = useMemo(() => (hr ? HR_ACTIONS.map((a) => ({ ...a, sub: null, group: 'Actions' })) : []), [hr]);

  const people = useMemo(
    () =>
      employees.map((e) => ({
        id: `e:${e.employee_id}`,
        label: e.name,
        sub: `${e.employee_id}${e.position ? ` · ${e.position}` : ''}`,
        keywords: `${e.employee_id} ${e.email || ''} ${e.client || ''} ${employeeType(e.employee_id)}`,
        to: `/employees/${e.employee_id}`,
        group: 'Employees',
        person: e,
      })),
    [employees],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = [...actions, ...pages, ...people];

    if (!q) {
      const recents = readRecents()
        .map((id) => all.find((i) => i.id === id))
        .filter(Boolean)
        .map((i) => ({ ...i, group: 'Recent' }));
      const recentIds = new Set(recents.map((i) => i.id));
      return [...recents, ...actions, ...pages].filter((i, idx, arr) => {
        if (i.group === 'Recent') return true;
        return !recentIds.has(i.id) && arr.findIndex((x) => x.id === i.id) === idx;
      });
    }

    const scored = [];
    all.forEach((item) => {
      const s = scoreItem(item, q);
      if (s >= 0) scored.push({ item, s });
    });
    scored.sort((a, b) => b.s - a.s || a.item.label.localeCompare(b.item.label));

    // People can run to hundreds; pages and actions are a fixed handful, so
    // only the person list gets capped.
    let shownPeople = 0;
    return scored
      .filter(({ item }) => (item.group === 'Employees' ? (shownPeople += 1) <= MAX_EMPLOYEE_HITS : true))
      .map(({ item }) => item);
  }, [query, actions, pages, people]);

  // Group headings are rendered from the flat list, so the index the keyboard
  // moves through is the same index that gets highlighted.
  const rows = useMemo(() => {
    const out = [];
    let last = null;
    results.forEach((item, index) => {
      if (item.group !== last) {
        out.push({ heading: item.group, key: `h:${item.group}:${index}` });
        last = item.group;
      }
      out.push({ item, index, key: item.id });
    });
    return out;
  }, [results]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const run = useCallback(
    (item) => {
      if (!item) return;
      pushRecent(item.id);
      onClose();
      if (item.event) window.dispatchEvent(new CustomEvent(item.event));
      else navigate(item.to);
    },
    [navigate, onClose],
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor((c) => (results.length ? (c + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor((c) => (results.length ? (c - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        run(results[cursor]);
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, results, cursor, run, onClose]);

  // Keep the highlighted row on screen when arrowing past the fold.
  useLayoutEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [cursor, results]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 px-4 pt-[12vh] backdrop-blur-[2px] animate-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search and commands"
        className="flex max-h-[68vh] w-full max-w-xl flex-col overflow-hidden rounded-panel bg-white shadow-pop animate-scale-in"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search size={17} className="shrink-0 text-slate-400" />
          <input
            id="command-palette-input"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees, pages and actions…"
            aria-label="Search employees, pages and actions"
            className="w-full border-0 bg-transparent py-4 text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
          <Keycap>esc</Keycap>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {rows.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-caption font-semibold text-slate-700">No matches for “{query}”</p>
              <p className="mt-1 text-xs text-slate-500">
                {hr && employeesLoading ? 'Still loading employees…' : 'Try a name, an employee ID, or a page name.'}
              </p>
            </div>
          ) : (
            rows.map((row) =>
              row.heading ? (
                <p key={row.key} className="eyebrow px-4 pb-1 pt-3 first:pt-1">
                  {row.heading}
                </p>
              ) : (
                <Row
                  key={row.key}
                  item={row.item}
                  active={row.index === cursor}
                  onSelect={() => run(row.item)}
                  onHover={() => setCursor(row.index)}
                />
              ),
            )
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-500">
          <Hint keys={['↑', '↓']}>navigate</Hint>
          <Hint keys={[<CornerDownLeft key="e" size={10} />]}>open</Hint>
          <Hint keys={[isMac() ? '⌘' : 'Ctrl', 'K']}>toggle</Hint>
          {hr && (
            <span className="ml-auto inline-flex items-center gap-1.5">
              <Users size={12} />
              {employeesLoading ? 'loading people…' : `${employees.length} employees`}
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Row({ item, active, onSelect, onHover }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      data-active={active}
      onClick={onSelect}
      onMouseMove={onHover}
      className={clsx(
        'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
        active ? 'bg-brand-50' : 'hover:bg-slate-50',
      )}
    >
      {item.person ? (
        <Avatar name={item.person.name} src={photoOf(item.person)} size="sm" />
      ) : (
        <span
          className={clsx(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
            active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500',
          )}
        >
          {Icon ? <Icon size={16} strokeWidth={2} /> : <ArrowRight size={16} />}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={clsx('block truncate text-caption font-semibold', active ? 'text-brand-800' : 'text-slate-800')}>
          {item.label}
        </span>
        {item.sub && <span className="block truncate text-xs text-slate-500">{item.sub}</span>}
      </span>
      {active && <CornerDownLeft size={14} className="shrink-0 text-brand-500" />}
    </button>
  );
}

function Keycap({ children }) {
  return (
    <kbd className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-slate-500">
      {children}
    </kbd>
  );
}

function Hint({ keys, children }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex items-center gap-1">
        {keys.map((k, i) => (
          <Keycap key={i}>{k}</Keycap>
        ))}
      </span>
      {children}
    </span>
  );
}

/** The header's search box. Looks like an input; it only opens the palette. */
export function CommandPaletteTrigger({ onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 py-2 pl-3 pr-2 text-caption text-slate-500 transition-colors hover:border-brand-300 hover:bg-white focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/10 sm:w-72"
      aria-label="Search employees, pages and actions"
    >
      <Search size={16} className="shrink-0 text-brand-600" />
      <span className="hidden flex-1 text-left sm:block">Search employees, pages…</span>
      <Keycap>{isMac() ? '⌘K' : 'Ctrl K'}</Keycap>
    </button>
  );
}
