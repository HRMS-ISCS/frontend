import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MailCheck } from 'lucide-react';

import { authApi } from '@/api';
import { Alert, Button, Input } from '@/components/ui';
import { AuthLayout } from './AuthLayout';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setSent(res?.message || 'If this email is registered, a reset link has been sent.');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email linked to your account and we'll send you a secure reset link."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <MailCheck className="mx-auto text-emerald-500" size={32} />
          <p className="mt-3 font-semibold text-emerald-900">Check your inbox</p>
          <p className="mt-1 text-sm text-emerald-800">{sent} The link expires in 15 minutes.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {error && (
            <Alert tone="danger">
              {error.status === 429 ? 'Too many reset requests. Please try again later.' : error.message}
            </Alert>
          )}
          <Input
            label="Work email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            prefix={<Mail size={16} />}
            required
            autoFocus
          />
          <Button type="submit" className="w-full py-2.5" loading={loading} disabled={!email}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
