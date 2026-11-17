import { useState } from 'react';

import { authApi } from '@/api';
import { useAuth } from '@/lib/auth';
import { Alert, Button, Input, Modal, useToast } from '@/components/ui';
import { PasswordStrength, passwordProblems } from './PasswordStrength';

export function ChangePasswordModal({ open, onClose }) {
  const { logout } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reset = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.changePassword(current, next, confirm);
      toast.success('Password changed. Please sign in again.');
      close();
      // The backend revokes every session on password change.
      logout();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const invalid = passwordProblems(next).length > 0 || next !== confirm || !current || current === next;

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : close}
      title="Change password"
      description="You will be signed out of all devices after changing it."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} loading={loading} disabled={invalid}>
            Update password
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="danger">{error.message}</Alert>}
        <Input label="Current password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        <div>
          <Input label="New password" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          <PasswordStrength password={next} />
        </div>
        <Input
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          error={confirm && confirm !== next ? 'Passwords do not match' : current && next && current === next ? 'Must differ from current password' : undefined}
        />
      </form>
    </Modal>
  );
}
