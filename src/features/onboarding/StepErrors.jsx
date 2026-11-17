/**
 * "What's wrong?" pop-up for onboarding Steps 1-5.
 *
 * When Save & continue fails - because the page's own checks found problems,
 * or because the server refused something - the employee gets ONE pop-up that
 * lists every problem in plain words, grouped by section, each with a Fix
 * button that scrolls to the field, focuses it and flashes it.
 *
 * An issue is:
 *   { section, label, message, target?, row? }
 *     section  FormSection title the field sits in (used to find it)
 *     label    what the pop-up calls it, e.g. "Family member 2 — Name"
 *     target   the field's on-screen label, e.g. "Name" (used to find it)
 *     row      index of a repeated row (family member, qualification…)
 *
 * Steps describe their fields once, in a FIELDS map:
 *   { aadhar_no: { label: 'Aadhaar number', section: 'Government IDs' }, … }
 */
import { useState } from 'react';
import { AlertTriangle, ArrowRight, RefreshCw, WifiOff } from 'lucide-react';

import { Button, Modal } from '@/components/ui';

/* ------------------------------------------------------------- Builders -- */

/** Issues from a { key: message } map, in the order FIELDS lists them. */
export function fieldIssues(errors, fields) {
  const keys = Object.keys(errors || {}).filter((k) => errors[k]);
  const order = Object.keys(fields);
  keys.sort((a, b) => (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999));
  return keys.map((key) => {
    const f = fields[key] || {};
    const label = f.label || humanize(key);
    return { section: f.section, label, target: f.target ?? label, message: errors[key] };
  });
}

/**
 * Issues from repeated rows: { [rowIndex]: { key: message } }.
 *   item    what one row is called, e.g. "Family member"
 *   fields  { key: 'On-screen label' }
 */
export function rowIssues(rowErrors, { section, item, fields }) {
  return Object.keys(rowErrors || {})
    .map(Number)
    .sort((a, b) => a - b)
    .flatMap((row) =>
      Object.entries(rowErrors[row] || {})
        .filter(([, message]) => message)
        .map(([key, message]) => {
          const target = fields?.[key] || humanize(key);
          // Rows use short messages ("Required") under the field; spell them out here.
          const text = /^required$/i.test(message) ? `${target} is required.` : message;
          return { section, row, target, label: `${item} ${row + 1} — ${target}`, message: text };
        }),
    );
}

/** A problem that is not about one field (e.g. "Add at least one reference"). */
export function generalIssue(message, section, label = 'Missing information') {
  return { section, label, message };
}

function humanize(key) {
  const s = String(key).replace(/_/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ------------------------------------------------ Server error translator */

// Known server messages -> which field, and what to tell the employee.
const SERVER_RULES = [
  { test: /aadh?aa?r (card )?(exceeds|must be)/i, key: 'aadhar_card' },
  { test: /pan (card )?(exceeds|must be)/i, key: 'pan_card' },
  { test: /profile photo (exceeds|must be)/i, key: 'profile_photo' },
  { test: /resume (exceeds|must be)/i, key: 'resume' },
  { test: /aadh?aa?r/i, key: 'aadhar_no', message: 'This Aadhaar number is invalid or already registered to another employee. Check the 12 digits.' },
  { test: /\bpan\b/i, key: 'pan_card_no', message: 'This PAN is invalid or already registered to another employee. Format: ABCDE1234F.' },
  { test: /passport/i, key: 'passport_no', message: 'This passport number is invalid or already registered. Format: A1234567.' },
  { test: /\buan\b/i, key: 'uan_number', message: 'This UAN is invalid or already registered to another employee. It must be 12 digits.' },
  { test: /\besi\b/i, key: 'esi_no', message: 'This ESI number is invalid or already registered. It must be 17 digits.' },
  { test: /account number already exists/i, key: 'account_number', message: 'This bank account number is already registered to another employee.' },
  { test: /ifsc/i, key: 'ifsc_code', message: 'This IFSC code is not valid. Format: 4 letters, 0, then 6 characters (e.g. SBIN0001234).' },
  { test: /employee id .* already exists/i, key: null, message: 'Your Employee ID was just taken by someone else. Click Save & continue again to get the next one, or contact HR.' },
  { test: /tenant already has an employee/i, key: null, message: 'Your basic details are already saved. Refresh the page to continue from where you left off.' },
  { test: /email/i, key: 'email', message: 'This email is invalid or already used by another employee.' },
  { test: /phone|mobile/i, key: 'phone', message: 'This mobile number is not valid. Enter 10 digits.' },
];

const FRIENDLY_422 = [
  [/string should match pattern/i, 'is not in the right format'],
  [/at least (\d+) characters?/i, (m) => `must be at least ${m[1]} characters`],
  [/at most (\d+) characters?/i, (m) => `must be at most ${m[1]} characters`],
  [/field required|missing/i, 'is required'],
  [/valid email/i, 'is not a valid email address'],
  [/valid date/i, 'is not a valid date'],
  [/valid integer|valid number/i, 'must be a number'],
];

function friendly422(msg) {
  for (const [re, out] of FRIENDLY_422) {
    const m = re.exec(msg || '');
    if (m) return typeof out === 'function' ? out(m) : out;
  }
  return (msg || 'is not valid').replace(/^Value error, /, '');
}

/**
 * Turn an ApiError into issues pointing at fields where possible.
 * fields: the step's FIELDS map, so keys become the labels the employee sees.
 */
export function serverIssues(err, fields = {}) {
  if (!err) return [];
  if (err.status === 0) {
    return [{ kind: 'network', label: 'No connection', message: err.message }];
  }

  const toIssue = (key, message) => {
    if (key && fields[key]) {
      const f = fields[key];
      return { section: f.section, label: f.label, target: f.target ?? f.label, message };
    }
    return { label: 'Could not save', message };
  };

  // FastAPI validation errors: [{ loc: ['body', 'aadhar_no'], msg }]
  const detail = err.payload?.detail;
  if (Array.isArray(detail) && detail.length) {
    return detail.map((item) => {
      const loc = Array.isArray(item.loc) ? item.loc.filter((p) => p !== 'body') : [];
      const key = [...loc].reverse().find((p) => typeof p === 'string');
      const label = fields[key]?.label || (key ? humanize(key) : 'A field');
      return toIssue(key, `${label} ${friendly422(item.msg)}.`);
    });
  }

  const text = err.message || '';
  const rule = SERVER_RULES.find((r) => r.test.test(text));
  if (rule) return [toIssue(rule.key, rule.message || text)];

  if (err.status >= 500 || /constraint/i.test(text)) {
    return [{
      label: 'Could not save',
      message: 'Something on this page was not accepted. Check the values you entered (IDs, numbers, dates) and try again. If it keeps happening, contact HR.',
      detail: text,
    }];
  }
  return [{ label: 'Could not save', message: text || 'Something went wrong. Please try again.' }];
}

/* ------------------------------------------------------ Find & highlight - */

const norm = (s) => String(s || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

function isVisible(el) {
  return el && el.offsetParent !== null && el.type !== 'hidden';
}

/** Locate the field for an issue inside root. Returns { box, control } or null. */
export function findField(root, issue) {
  if (!root || (!issue.section && !issue.target)) return null;
  let scope = root;

  if (issue.section) {
    const heading = [...root.querySelectorAll('section h3')].find((h) => norm(h.textContent) === norm(issue.section));
    if (heading) scope = heading.closest('section') || scope;
  }
  if (issue.row != null) {
    const rows = scope.querySelectorAll('[data-repeat-row]');
    if (rows[issue.row]) scope = rows[issue.row];
  }
  if (!issue.target) return scope !== root ? { box: scope, control: null } : null;

  const label = [...scope.querySelectorAll('label, p.label')].find((l) => norm(l.textContent) === norm(issue.target));
  if (!label) return scope !== root ? { box: scope, control: null } : null;

  const box = label.parentElement;
  let control = label.htmlFor ? document.getElementById(label.htmlFor) : null;
  if (!isVisible(control)) {
    control = [...box.querySelectorAll('input, select, textarea, button')].find(isVisible) || null;
  }
  return { box, control };
}

export function focusIssue(root, issue) {
  const found = findField(root, issue);
  if (!found) return false;
  const { box, control } = found;
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  // Focus after the scroll starts, without the browser jumping again.
  setTimeout(() => control?.focus({ preventScroll: true }), 350);
  const flash = ['ring-2', 'ring-red-400', 'ring-offset-4', 'rounded-lg', 'transition-shadow'];
  box.classList.add(...flash);
  setTimeout(() => box.classList.remove(...flash), 2400);
  return true;
}

/* ---------------------------------------------------------------- Modal -- */

export function ErrorSummaryModal({ issues, root, onClose, onRetry }) {
  const [showDetail, setShowDetail] = useState(false);
  if (!issues?.length) return null;

  const network = issues.some((i) => i.kind === 'network');
  const fieldCount = issues.filter((i) => i.target || i.section).length;
  const title = network
    ? 'Could not reach the server'
    : fieldCount
      ? `Please fix ${issues.length === 1 ? 'this' : `these ${issues.length} things`} before continuing`
      : 'Could not save this step';

  // Group by section, keeping first-seen order.
  const groups = [];
  issues.forEach((issue) => {
    const name = issue.section || 'General';
    let g = groups.find((x) => x.name === name);
    if (!g) groups.push((g = { name, items: [] }));
    g.items.push(issue);
  });

  const close = () => {
    onClose();
    // Take them straight to the first thing to fix.
    const first = issues.find((i) => i.target || i.section);
    if (first) setTimeout(() => focusIssue(root, first), 50);
  };

  const fix = (issue) => {
    onClose();
    setTimeout(() => focusIssue(root, issue), 50);
  };

  const details = issues.map((i) => i.detail).filter(Boolean);

  return (
    <Modal
      open
      onClose={close}
      size="md"
      title={
        <span className="flex items-center gap-2">
          {network ? <WifiOff size={18} className="text-red-500" /> : <AlertTriangle size={18} className="text-red-500" />}
          {title}
        </span>
      }
      footer={
        <>
          {onRetry && (network || !fieldCount) && (
            <Button variant="secondary" icon={RefreshCw} onClick={() => { onClose(); onRetry(); }}>
              Try again
            </Button>
          )}
          <Button onClick={close}>{fieldCount ? "OK, I'll fix them" : 'OK'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.name}>
            {groups.length > 1 || g.name !== 'General' ? <p className="eyebrow mb-2">{g.name}</p> : null}
            <ul className="space-y-2">
              {g.items.map((issue, i) => {
                const locatable = Boolean(issue.target || issue.section);
                return (
                  <li key={`${issue.label}-${i}`} className="flex items-start justify-between gap-3 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2.5">
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold text-slate-800">{issue.label}</p>
                      <p className="mt-0.5 leading-relaxed text-red-700">{issue.message}</p>
                    </div>
                    {locatable && (
                      <Button size="sm" variant="secondary" iconRight={ArrowRight} onClick={() => fix(issue)} className="shrink-0">
                        Fix
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {details.length > 0 && (
          <div className="text-xs text-slate-500">
            <button type="button" className="underline" onClick={() => setShowDetail((v) => !v)}>
              {showDetail ? 'Hide' : 'Show'} technical details
            </button>
            {showDetail && <p className="mt-1 break-words rounded bg-slate-50 p-2 font-mono">{details.join(' · ')}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}
