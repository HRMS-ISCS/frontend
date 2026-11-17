export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  // Plain dates ("2026-09-19") are parsed as local dates, not UTC midnight.
  const m = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value, fallback = '—') {
  const d = toDate(value);
  return d
    ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : fallback;
}

export function formatDateTime(value, fallback = '—') {
  const d = toDate(value);
  return d
    ? d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : fallback;
}

export function formatDayMonth(value) {
  const d = toDate(value);
  return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) : '—';
}

/** "12,00,000" */
export function formatIndianNumber(n) {
  if (n === null || n === undefined || n === '' || Number.isNaN(Number(n))) return '—';
  return Math.round(Number(n)).toLocaleString('en-IN');
}

/** "₹12,00,000" */
export function formatINR(n) {
  const s = formatIndianNumber(n);
  return s === '—' ? s : `₹${s}`;
}

/** 1250000 -> "12.5 LPA" */
export function formatLPA(n) {
  if (!n) return '—';
  const lpa = Number(n) / 100000;
  return `${lpa.toFixed(2).replace(/\.?0+$/, '')} LPA`;
}

export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function titleCase(value) {
  if (!value) return '';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/** Monday-Saturday count; a sensible default for "working days". */
export function workingDaysInMonth(year, month) {
  let count = 0;
  const total = daysInMonth(year, month);
  for (let day = 1; day <= total; day += 1) {
    if (new Date(year, month - 1, day).getDay() !== 0) count += 1;
  }
  return count;
}

export function employeeType(employeeId) {
  return String(employeeId || '').toUpperCase().startsWith('ISCSE') ? 'External' : 'Internal';
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function pluralize(count, word, plural = `${word}s`) {
  return `${count} ${count === 1 ? word : plural}`;
}
