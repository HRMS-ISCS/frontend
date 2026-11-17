import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

import { authApi } from '@/api';
import { Alert, Button, Input } from '@/components/ui';
import { PasswordStrength, passwordProblems } from './PasswordStrength';
import { AuthLayout } from './AuthLayout';

/**
 * Handles both the "forgot password" link and the welcome email's
 * "Set up your password" link - the backend issues the same token type.
 */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const problems = passwordProblems(password);
  const mismatch = confirm && confirm !== password;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword(token, password, confirm);
      setDone(true);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid link" footer={<Link to="/forgot-password" className="font-medium text-brand-600">Request a new link</Link>}>
        <Alert tone="danger">This password link is missing its token. Please use the link from your email.</Alert>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={done ? 'Password updated' : 'Set your password'}
      subtitle={done ? undefined : 'Choose a strong password you have not used elsewhere.'}
    >
      {done ? (
        <div className="space-y-6 text-center">
          <CheckCircle2 size={44} className="mx-auto text-emerald-500" />
          <p className="text-sm text-slate-600">Your password has been set. You can now sign in with your new password.</p>
          <Button className="w-full py-2.5" onClick={() => navigate('/login', { replace: true })}>
            Continue to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {error && <Alert tone="danger">{error.message}</Alert>}
          <div>
            <Input
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              autoFocus
            />
            <PasswordStrength password={password} />
          </div>
          <Input
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            error={mismatch ? 'Passwords do not match' : undefined}
            required
          />
          <Button
            type="submit"
            className="w-full py-2.5"
            loading={loading}
            disabled={problems.length > 0 || !confirm || mismatch}
          >
            Set password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
