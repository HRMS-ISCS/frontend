/**
 * HR / Superadmin choice of an employee's ID when creating their login.
 *
 *  Automatic      - nothing is reserved; the employee picks Internal/External
 *                   at Step 1 and gets the next number (highest + 1).
 *  Enter manually - HR types the ID (e.g. ISCSI150). It is saved EXACTLY as
 *                   typed, reserved on the login, and used at Step 1.
 *
 * The rules and the availability check live in the backend
 * (src/core/employee_id_allocator.py); this only asks and displays.
 */
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Hash, Loader2, XCircle } from 'lucide-react';

import { employeeIdsApi } from '@/api';
import { Alert, Button, FormGrid, Input, Modal, Segmented, useToast } from '@/components/ui';

const PREFIX_OPTIONS = [
  { value: 'ISCSI', label: 'Internal (ISCSI)' },
  { value: 'ISCSE', label: 'External (ISCSE)' },
];

function useDebounced(value, ms = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function splitId(id) {
  const m = /^(ISCSI|ISCSE)(\d*)$/.exec(id || '');
  return m ? { prefix: m[1], digits: m[2] } : { prefix: 'ISCSI', digits: '' };
}

/**
 * onChange({ employeeId, ready }):
 *   employeeId - the full typed ID, or null for Automatic
 *   ready      - false while a typed ID is empty, being checked, invalid or taken
 */
export function EmployeeIdField({ userId, initialId, onChange }) {
  const start = splitId(initialId);
  const [mode, setMode] = useState(initialId ? 'manual' : 'auto');
  const [prefix, setPrefix] = useState(start.prefix);
  const [digits, setDigits] = useState(start.digits);

  const full = `${prefix}${digits}`;
  const debounced = useDebounced(full);
  const manual = mode === 'manual';

  const next = useQuery({ queryKey: ['employee-ids', 'next'], queryFn: employeeIdsApi.next, staleTime: 10_000 });

  const check = useQuery({
    queryKey: ['employee-ids', 'check', debounced, userId ?? null],
    queryFn: () => employeeIdsApi.check(debounced, userId),
    enabled: manual && digits.length > 0 && debounced === full,
    staleTime: 0,
    retry: false,
  });
  const result = check.data;
  const checking = manual && digits.length > 0 && (debounced !== full || check.isFetching);
  const ready = !manual || (digits.length > 0 && !checking && Boolean(result?.valid && result?.available));

  useEffect(() => {
    onChange?.({ employeeId: manual ? full : null, ready });
  }, [manual, full, ready, onChange]);

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Hash size={15} className="text-brand-600" /> Employee ID
        </p>
        <Segmented
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'auto', label: 'Automatic' },
            { value: 'manual', label: 'Enter manually' },
          ]}
        />
      </div>

      {!manual ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          Generated when the employee completes Step 1 and chooses Internal or External.
          {next.data?.next && (
            <>
              {' '}Next IDs right now:{' '}
              <strong className="tabular text-slate-700">{next.data.next.ISCSI}</strong> ·{' '}
              <strong className="tabular text-slate-700">{next.data.next.ISCSE}</strong>
            </>
          )}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <FormGrid>
            <div role="group" aria-labelledby="employee-id-type">
              <p id="employee-id-type" className="label">Type</p>
              <Segmented value={prefix} onChange={setPrefix} options={PREFIX_OPTIONS} />
            </div>
            <Input
              label="Number"
              inputMode="numeric"
              maxLength={10}
              value={digits}
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))}
              prefix={<span className="text-xs font-semibold text-brand-600">{prefix}</span>}
              className="!pl-16"
              placeholder="e.g. 150"
              hint="Saved exactly as typed. Leading zeros are kept."
            />
          </FormGrid>

          {digits.length > 0 && (
            <p className="flex items-start gap-2 text-sm" aria-live="polite">
              {checking ? (
                <><Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-slate-400" /> <span className="text-slate-500">Checking {full}…</span></>
              ) : check.error ? (
                <><XCircle size={16} className="mt-0.5 shrink-0 text-red-500" /> <span className="text-red-700">{check.error.message}</span></>
              ) : result && (!result.valid || !result.available) ? (
                <><XCircle size={16} className="mt-0.5 shrink-0 text-red-500" /> <span className="text-red-700">{result.message}</span></>
              ) : result?.lookalikes?.length ? (
                <><AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" /> <span className="text-amber-800">{result.message}</span></>
              ) : result ? (
                <><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" /> <span className="text-emerald-700">{result.message}</span></>
              ) : null}
            </p>
          )}

          {next.data?.next && (
            <p className="text-xs text-slate-500">
              After this, automatic numbering continues from the highest number in use (next now: {next.data.next[prefix]}).
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------- Change before Step 1 ----- */
export function ChangeEmployeeIdModal({ user, onClose }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [choice, setChoice] = useState({ employeeId: user.employee_id || null, ready: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await employeeIdsApi.reserve(user.id, choice.employeeId);
      toast.success(res.message, 'Employee ID updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['employee-ids'] });
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
      size="md"
      title="Employee ID"
      description={`${name} · can be changed until they complete Step 1`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={!choice.ready}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error.message}</Alert>}
        <EmployeeIdField userId={user.id} initialId={user.employee_id} onChange={setChoice} />
      </div>
    </Modal>
  );
}
