import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Search, ShieldCheck, UserPlus, Users } from 'lucide-react';

import { usersApi } from '@/api';
import { useAuth } from '@/lib/auth';
import { PATTERNS, ROLE_LABELS, ROLES } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { useForm, validate } from '@/lib/hooks';
import { Alert, Avatar, Badge, Button, Card, EmptyState, ErrorState, FormGrid, Input, Modal, PageHeader, Select, Skeleton, Switch, Tabs, useToast } from '@/components/ui';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { ChangeEmployeeIdModal, EmployeeIdField } from './EmployeeIdField';

const ROLE_TONE = { superadmin: 'violet', hr: 'brand', admin: 'info', employee: 'neutral' };

function randomPassword() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `Tmp#${Array.from(bytes, (b) => b.toString(36)).join('').slice(0, 20)}`;
}

function CreateUserModal({ onClose }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isSuperadmin } = useAuth();
  const { values, set, errors, setErrors } = useForm({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    mobile_number: '',
    role: ROLES.EMPLOYEE,
    send_email: true,
    password: '',
    confirm_password: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  // { employeeId: null = automatic | 'ISCSI150', ready } from EmployeeIdField.
  const [idChoice, setIdChoice] = useState({ employeeId: null, ready: true });
  const isEmployee = values.role === ROLES.EMPLOYEE;

  const roles = isSuperadmin
    ? [ROLES.EMPLOYEE, ROLES.HR, ROLES.ADMIN].map((r) => ({ value: r, label: ROLE_LABELS[r] }))
    : [{ value: ROLES.EMPLOYEE, label: ROLE_LABELS.employee }];

  const submit = async () => {
    const found = validate(values, {
      first_name: (v) => (!v.trim() ? 'Required' : undefined),
      last_name: (v) => (!v.trim() ? 'Required' : undefined),
      username: (v) => (v.trim().length < 3 ? 'At least 3 characters' : undefined),
      email: (v) => (!PATTERNS.email.test(v) ? 'Enter a valid email' : undefined),
      mobile_number: (v) => (!/^[6-9]\d{9}$/.test(v) ? '10 digits, starting 6-9' : undefined),
      password: (v, all) => (!all.send_email && v.length < 8 ? 'At least 8 characters' : undefined),
      confirm_password: (v, all) => (!all.send_email && v !== all.password ? 'Passwords do not match' : undefined),
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    if (isEmployee && !idChoice.ready) {
      setError({ message: 'Enter an Employee ID that is available, or switch to Automatic.' });
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // With send_email the backend stores a random password and emails a
      // set-password link; it still validates the field, so send a throwaway.
      const password = values.send_email ? randomPassword() : values.password;
      const res = await usersApi.create({
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        username: values.username.trim(),
        email: values.email.trim().toLowerCase(),
        mobile_number: values.mobile_number,
        role: values.role,
        send_email: values.send_email,
        password,
        confirm_password: password,
        // Only for employee logins; omitted means automatic at Step 1.
        employee_id: isEmployee ? idChoice.employeeId || undefined : undefined,
      });
      toast.success(
        values.send_email
          ? res.email_sent
            ? `Invitation emailed to ${res.user.email}.`
            : 'User created, but email is not configured — they must use "Forgot password".'
          : 'User created with the password you set.',
        `${res.user.first_name} added`,
      );
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={saving ? undefined : onClose}
      size="lg"
      title={isEmployee ? 'Create employee' : 'Create user'}
      description="New employees receive a secure link to set their own password."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button icon={UserPlus} onClick={submit} loading={saving} disabled={isEmployee && !idChoice.ready}>{isEmployee ? 'Create employee' : 'Create user'}</Button>
        </>
      }
    >
      <div className="space-y-5">
        {error && <Alert tone="danger">{error.message}</Alert>}
        <FormGrid>
          <Input label="First name" required value={values.first_name} onChange={(e) => set('first_name', e.target.value)} error={errors.first_name} />
          <Input label="Last name" required value={values.last_name} onChange={(e) => set('last_name', e.target.value)} error={errors.last_name} />
          <Input label="Work email" required type="email" value={values.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
          <Input label="Username" required value={values.username} onChange={(e) => set('username', e.target.value.replace(/\s/g, ''))} error={errors.username} placeholder="e.g. rahul.sharma" />
          <Input label="Mobile" required inputMode="numeric" maxLength={10} value={values.mobile_number} onChange={(e) => set('mobile_number', e.target.value.replace(/\D/g, ''))} error={errors.mobile_number} />
          <Select label="Role" required value={values.role} onChange={(e) => set('role', e.target.value)} options={roles} placeholder={null} />
        </FormGrid>
        {isEmployee && <EmployeeIdField onChange={setIdChoice} />}
        <div className="rounded-xl border border-slate-200 p-4">
          <Switch
            checked={values.send_email}
            onChange={(v) => set('send_email', v)}
            label="Email a password setup link"
            description="Recommended. The link is valid for 24 hours and can be used once."
          />
          {!values.send_email && (
            <FormGrid className="mt-4">
              <Input label="Password" type="password" value={values.password} onChange={(e) => set('password', e.target.value)} error={errors.password} autoComplete="new-password" />
              <Input label="Confirm password" type="password" value={values.confirm_password} onChange={(e) => set('confirm_password', e.target.value)} error={errors.confirm_password} autoComplete="new-password" />
            </FormGrid>
          )}
        </div>
      </div>
    </Modal>
  );
}

function flatten(data) {
  if (!data) return [];
  if (data.superadmin_data) return Object.values(data.superadmin_data).flat();
  if (data.hr_data) return Object.values(data.hr_data).flat();
  if (data.admin_data) return data.admin_data;
  return [];
}

export function UsersPage() {
  const { isHr } = useAuth();
  const [params, setParams] = useSearchParams();
  const [role, setRole] = useState('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const creating = params.get('create') === '1';

  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
  const users = useMemo(() => flatten(data), [data]);

  const counts = users.reduce((acc, u) => ({ ...acc, [u.role]: (acc[u.role] || 0) + 1 }), {});
  const filtered = users
    .filter((u) => role === 'all' || u.role === role)
    .filter((u) => {
      const q = search.trim().toLowerCase();
      return !q || [u.first_name, u.last_name, u.username, u.email, u.employee_id].some((v) => v?.toLowerCase().includes(q));
    })
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

  const tabs = [{ id: 'all', label: 'All', count: users.length }, ...Object.keys(counts).map((r) => ({ id: r, label: ROLE_LABELS[r] || r, count: counts[r] }))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & access"
        subtitle="Login accounts and roles."
      />

      <Card flush>
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 pt-3 lg:flex-row lg:items-end lg:justify-between">
          <Tabs tabs={tabs} value={role} onChange={setRole} className="border-b-0" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, username, email or ID" aria-label="Search users" prefix={<Search size={16} className="text-brand-600" />} className="border-slate-300 bg-slate-50 font-medium placeholder:font-normal placeholder:text-slate-500 hover:border-brand-300 focus:bg-white" fieldClassName="pb-3 lg:w-80" />
        </div>
        {isLoading ? (
          <div className="space-y-2 p-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No users found" />
        ) : (
          <ResponsiveTable
            rows={filtered}
            rowKey={(u) => u.id}
            columns={[
              {
                key: 'user',
                header: 'User',
                role: 'primary',
                cell: (u) => {
                  const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username;
                  return (
                    <div className="flex items-center gap-3">
                      <Avatar name={name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">{name}</p>
                        <p className="flex items-center gap-1 truncate text-xs text-slate-500"><Mail size={11} /> {u.email}</p>
                      </div>
                    </div>
                  );
                },
              },
              { key: 'username', header: 'Username', className: 'tabular text-xs text-slate-600', cell: (u) => <span className="tabular">{u.username}</span> },
              {
                key: 'role',
                header: 'Role',
                role: 'badge',
                cell: (u) => (
                  <Badge tone={ROLE_TONE[u.role]} icon={u.role === 'superadmin' ? ShieldCheck : undefined}>
                    {ROLE_LABELS[u.role] || u.role}
                  </Badge>
                ),
              },
              {
                key: 'employee_id',
                header: 'Employee ID',
                cell: (u) =>
                  u.role !== 'employee' ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {u.employee_id ? (
                        <span className="tabular font-medium text-slate-700">{u.employee_id}</span>
                      ) : (
                        <span className="text-xs text-slate-400">Automatic</span>
                      )}
                      {isHr && (
                        <button
                          type="button"
                          onClick={() => setEditingId(u)}
                          className="text-xs font-medium text-brand-700 hover:underline"
                        >
                          Change
                        </button>
                      )}
                    </span>
                  ),
              },
              { key: 'mobile', header: 'Mobile', cell: (u) => u.mobile_number || '—' },
              {
                key: 'created',
                header: 'Created',
                className: 'tabular whitespace-nowrap text-slate-500',
                cell: (u) => <span className="tabular">{formatDate(u.created_at)}</span>,
              },
            ]}
          />
        )}
      </Card>

      {creating && isHr && <CreateUserModal onClose={() => setParams({}, { replace: true })} />}
      {editingId && isHr && <ChangeEmployeeIdModal user={editingId} onClose={() => setEditingId(null)} />}
    </div>
  );
}
