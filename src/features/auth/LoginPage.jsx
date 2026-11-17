import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, KeyRound, Loader2, User } from 'lucide-react';

import { onboardingApi } from '@/api';
import { useAuth } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { canAccess, homePathFor } from '@/components/layout/navigation';
import { AuthShell } from './signin/AuthShell';
import { AuthField, PasswordField } from './signin/fields';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  /* Bumped on each failure so the alert re-mounts and shakes every time. */
  const [attempt, setAttempt] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const profile = await login(username.trim(), password);
      // `from` is the page that bounced this browser to /login - which may have
      // belonged to whoever was signed in before. Honour it only if THIS role
      // can actually open it, otherwise send them to their own landing page.
      let target = location.state?.from;
      if (!target || target === '/' || !canAccess(profile.role, target)) {
        target = homePathFor(profile.role);
        if (profile.role === ROLES.EMPLOYEE) {
          const progress = await onboardingApi.progress().catch(() => null);
          if (progress && !progress.is_completed) target = '/onboarding';
        }
      }
      navigate(target, { replace: true });
    } catch (err) {
      setError(err);
      setAttempt((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Sign in to ISCS HRMS" subtitle="Welcome back. Use your work email or username to continue.">
      <form onSubmit={submit} className="space-y-5">
        {error && (
          <div
            key={attempt}
            role="alert"
            className="auth-shake flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-800"
          >
            <AlertCircle size={18} className="mt-px shrink-0 text-red-500" />
            <p className="leading-relaxed">
              {error.status === 429
                ? 'Too many failed attempts. Please wait a few minutes and try again.'
                : error.message}
            </p>
          </div>
        )}

        <AuthField
          label="Work email or username"
          icon={User}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="you@iscstech.co.in"
          invalid={Boolean(error)}
          required
          autoFocus
        />

        <PasswordField
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Enter your password"
          invalid={Boolean(error)}
          required
          aside={
            <Link to="/forgot-password" className="text-[13px] font-semibold text-brand-600 transition-colors hover:text-brand-700">
              Forgot password?
            </Link>
          }
        />

        <button
          type="submit"
          disabled={loading}
          className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-[15px] font-semibold text-white shadow-[0_8px_20px_-6px_rgb(49_71_230/0.5),inset_0_1px_0_rgb(255_255_255/0.15)] transition-all duration-150 hover:bg-brand-700 active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Signing in…
            </>
          ) : (
            <>
              Sign in <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      {/* First-time help: there is no self sign-up, so say how accounts start. */}
      <div className="mt-8 flex gap-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-[0_1px_2px_rgb(15_23_42/0.06)] ring-1 ring-slate-200">
          <KeyRound size={17} />
        </span>
        <div className="text-[13px] leading-relaxed text-slate-600">
          <p className="font-semibold text-slate-900">Signing in for the first time?</p>
          <p className="mt-0.5">
            HR creates your account and emails you a one-time link to set your password. Link expired?{' '}
            <Link to="/forgot-password" className="font-semibold text-brand-600 hover:text-brand-700">
              Request a new one
            </Link>
            .
          </p>
        </div>
      </div>

    </AuthShell>
  );
}
