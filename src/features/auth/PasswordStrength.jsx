import clsx from 'clsx';

/** The backend only enforces 8+ characters; the rest is guidance. */
export function passwordProblems(password) {
  const problems = [];
  if ((password || '').length < 8) problems.push('At least 8 characters');
  return problems;
}

function score(password) {
  let s = 0;
  if (password.length >= 8) s += 1;
  if (password.length >= 12) s += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s += 1;
  if (/\d/.test(password)) s += 1;
  if (/[^A-Za-z0-9]/.test(password)) s += 1;
  return Math.min(s, 4);
}

const LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
const COLORS = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];

export function PasswordStrength({ password }) {
  if (!password) return null;
  const s = password.length < 8 ? 0 : score(password);
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={clsx('h-1 flex-1 rounded-full', i <= s ? COLORS[s] : 'bg-slate-200')} />
        ))}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {LABELS[s]}
        {s < 3 && ' · mix upper & lower case, numbers and symbols'}
      </p>
    </div>
  );
}
