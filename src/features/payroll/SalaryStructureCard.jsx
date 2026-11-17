import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeIndianRupee, History, Pencil, Plus } from 'lucide-react';

import { salaryApi } from '@/api';
import { PATTERNS } from '@/lib/constants';
import { formatDate, formatINR, formatLPA, todayISO } from '@/lib/format';
import { useForm, validate } from '@/lib/hooks';
import { payrollSalaryComponents } from '@/lib/salary';
import { Alert, Badge, Button, Card, DefinitionList, EmptyState, ErrorState, FormGrid, Input, Modal, Skeleton, useToast } from '@/components/ui';
import { ResponsiveTable } from '@/components/ResponsiveTable';

function SalaryForm({ employeeId, current, defaults, onClose }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const revising = Boolean(current);
  const { values, set, errors, setErrors } = useForm({
    annual_ctc: current ? String(current.annual_ctc) : '',
    effective_from: todayISO(),
    pan_number: current?.pan_number || defaults?.pan || '',
    uan_number: current?.uan_number || defaults?.uan || '',
    esi_account_no: current?.esi_account_no || defaults?.esi || '',
    pf_account_no: current?.pf_account_no && current.pf_account_no !== '0' ? current.pf_account_no : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const preview = payrollSalaryComponents(values.annual_ctc);

  const submit = async () => {
    const found = validate(values, {
      annual_ctc: (v) => (!(Number(v) > 0) ? 'Enter the annual CTC' : undefined),
      effective_from: (v, all) =>
        !v ? 'Required' : revising && v < current.effective_from ? `Cannot be before ${formatDate(current.effective_from)}` : undefined,
      pan_number: (v) => (v && !PATTERNS.pan.test(v) ? 'PAN format: ABCDE1234F' : undefined),
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        annual_ctc: Number(values.annual_ctc),
        effective_from: values.effective_from,
        pan_number: values.pan_number || null,
        uan_number: values.uan_number || null,
        esi_account_no: values.esi_account_no || null,
        pf_account_no: values.pf_account_no || '0',
      };
      if (revising) await salaryApi.revise(employeeId, body);
      else await salaryApi.create(employeeId, body);
      toast.success(revising ? 'Salary structure revised' : 'Salary structure created');
      queryClient.invalidateQueries({ queryKey: ['salary', employeeId] });
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const row = (label, value, strong) => (
    <div className={`flex justify-between py-1.5 text-sm ${strong ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
      <span>{label}</span>
      <span>{formatINR(value)}</span>
    </div>
  );

  return (
    <Modal
      open
      onClose={saving ? undefined : onClose}
      size="lg"
      title={revising ? 'Revise salary structure' : 'Create salary structure'}
      description={revising ? 'A new version is created; payslips for earlier months keep using the old one.' : 'Monthly components are derived automatically from the annual CTC.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{revising ? 'Save revision' : 'Create structure'}</Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          {error && <Alert tone="danger">{error.message}</Alert>}
          <FormGrid>
            <Input label="Annual CTC (₹)" required inputMode="numeric" value={values.annual_ctc} onChange={(e) => set('annual_ctc', e.target.value.replace(/[^\d.]/g, ''))} error={errors.annual_ctc} hint={values.annual_ctc ? formatLPA(values.annual_ctc) : undefined} />
            <Input label="Effective from" required type="date" value={values.effective_from} onChange={(e) => set('effective_from', e.target.value)} error={errors.effective_from} />
            <Input label="PAN" maxLength={10} value={values.pan_number} onChange={(e) => set('pan_number', e.target.value.toUpperCase())} error={errors.pan_number} />
            <Input label="UAN" value={values.uan_number} onChange={(e) => set('uan_number', e.target.value)} />
            <Input label="ESI account no." value={values.esi_account_no} onChange={(e) => set('esi_account_no', e.target.value)} />
            <Input label="PF account no." value={values.pf_account_no} onChange={(e) => set('pf_account_no', e.target.value)} placeholder="0" />
          </FormGrid>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="mb-2 eyebrow">Monthly preview</p>
          {preview ? (
            <div className="divide-y divide-slate-200">
              <div>
                {row('Basic (60% of gross)', preview.basic)}
                {row('HRA (40% of basic)', preview.hra)}
                {row('Conveyance (15% of basic)', preview.conveyance)}
                {row('CCA (balance)', preview.cca)}
              </div>
              <div>{row('Gross / month', preview.monthlyGross, true)}</div>
              <div>
                {row('Employee PF', 1800)}
                {row('Professional tax', 200)}
                {row('Net take-home', preview.monthlyGross - 2000, true)}
              </div>
              <p className="pt-2 text-[11px] text-slate-500">Gross excludes the ₹1,800/month employer PF included in the CTC.</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Enter a CTC to see the breakup.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function SalaryStructureCard({ employeeId, defaults }) {
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const current = useQuery({
    queryKey: ['salary', employeeId, 'current'],
    queryFn: () => salaryApi.get(employeeId).catch((err) => (err.status === 404 ? null : Promise.reject(err))),
    enabled: Boolean(employeeId),
  });
  const history = useQuery({
    queryKey: ['salary', employeeId, 'history'],
    queryFn: () => salaryApi.history(employeeId),
    enabled: Boolean(employeeId) && showHistory,
  });

  const s = current.data;

  return (
    <Card
      title="Salary structure"
      icon={BadgeIndianRupee}
      actions={
        s !== undefined && (
          <>
            {s && (
              <Button variant="ghost" size="sm" icon={History} onClick={() => setShowHistory((v) => !v)}>
                {showHistory ? 'Hide history' : 'History'}
              </Button>
            )}
            <Button size="sm" variant={s ? 'secondary' : 'primary'} icon={s ? Pencil : Plus} onClick={() => setEditing(true)}>
              {s ? 'Revise' : 'Create'}
            </Button>
          </>
        )
      }
    >
      {current.isLoading ? (
        <Skeleton className="h-32" />
      ) : current.error ? (
        <ErrorState error={current.error} onRetry={current.refetch} />
      ) : !s ? (
        <EmptyState icon={BadgeIndianRupee} title="No salary structure" description="Create one before generating payslips for this employee." className="py-8" />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-brand-50 p-4">
              <p className="text-xs font-medium text-brand-700">Annual CTC</p>
              <p className="mt-1 text-2xl font-semibold text-brand-900">{formatINR(s.annual_ctc)}</p>
              <p className="text-xs text-brand-700">{formatLPA(s.annual_ctc)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Monthly gross</p>
              <p className="mt-1 text-2xl font-semibold">{formatINR(s.monthly_gross)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Effective from</p>
              <p className="mt-1 text-2xl font-semibold">{formatDate(s.effective_from)}</p>
            </div>
          </div>
          <DefinitionList
            cols={3}
            items={[
              { label: 'Basic', value: formatINR(s.basic_salary) },
              { label: 'HRA', value: formatINR(s.hra) },
              { label: 'Conveyance', value: formatINR(s.conveyance_allowance) },
              { label: 'CCA', value: formatINR(s.cca) },
              { label: 'PF deduction', value: formatINR(s.pf) },
              { label: 'Professional tax', value: formatINR(s.professional_tax) },
              { label: 'PAN', value: s.pan_number },
              { label: 'UAN', value: s.uan_number },
              { label: 'PF account', value: s.pf_account_no },
            ]}
          />
          {showHistory && (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <ResponsiveTable
                rows={history.data?.history || []}
                rowKey={(h) => h.id}
                breakpoint="sm"
                emptyCard="No previous revisions"
                columns={[
                  {
                    key: 'effective',
                    header: 'Effective from',
                    role: 'primary',
                    cell: (h) => <span className="tabular font-semibold text-slate-800">{formatDate(h.effective_from)}</span>,
                  },
                  { key: 'ctc', header: 'Annual CTC', className: 'font-medium', cell: (h) => <span className="tabular">{formatINR(h.annual_ctc)}</span> },
                  { key: 'gross', header: 'Monthly gross', cell: (h) => <span className="tabular">{formatINR(h.monthly_gross)}</span> },
                  { key: 'by', header: 'Created by', cell: (h) => h.created_by || '—' },
                  {
                    key: 'status',
                    header: 'Status',
                    role: 'badge',
                    cell: (h) => (h.is_active ? <Badge tone="success">Active</Badge> : <Badge>Superseded</Badge>),
                  },
                ]}
              />
            </div>
          )}
        </div>
      )}
      {editing && <SalaryForm employeeId={employeeId} current={s} defaults={defaults} onClose={() => setEditing(false)} />}
    </Card>
  );
}
