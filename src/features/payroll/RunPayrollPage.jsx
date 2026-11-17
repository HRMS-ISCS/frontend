import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { CheckCircle2, Play, Users, XCircle } from 'lucide-react';

import { payslipGeneratorApi } from '@/api';
import { formatINR, MONTHS, workingDaysInMonth } from '@/lib/format';
import { Alert, Avatar, Badge, Button, Card, Checkbox, EmptyState, FormGrid, PageHeader, Segmented, Select, Skeleton, StatCard, useToast } from '@/components/ui';
import { photoOf, useEmployees } from '@/components/EmployeePicker';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { GeneratingNotice } from '@/components/GeneratingNotice';
import { PayslipGenerator } from './PayslipGenerator';

const NO_EMPLOYEES = [];

function PeriodPicker({ month, year, onChange }) {
  const current = new Date().getFullYear();
  return (
    <FormGrid cols={2}>
      <Select label="Month" value={month} onChange={(e) => onChange(Number(e.target.value), year)} placeholder={null} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
      <Select label="Year" value={year} onChange={(e) => onChange(month, Number(e.target.value))} placeholder={null} options={[current + 1, current, current - 1, current - 2].map((y) => ({ value: y, label: String(y) }))} />
    </FormGrid>
  );
}

function BulkPayroll({ month, year }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  // No `= []` default here: a fresh array each render would re-fire the row
  // initialisation effect below in an endless loop while loading.
  const { data, isLoading } = useEmployees();
  const employees = data || NO_EMPLOYEES;
  const defaultDays = workingDaysInMonth(year, month);
  const [rows, setRows] = useState({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setRows((prev) => {
      const next = {};
      employees.forEach((e) => {
        next[e.employee_id] = {
          selected: prev[e.employee_id]?.selected ?? true,
          working: String(defaultDays),
          paid: String(defaultDays),
          tds: prev[e.employee_id]?.tds ?? '0',
          email: prev[e.employee_id]?.email ?? true,
        };
      });
      return next;
    });
  }, [employees, defaultDays]);

  const sorted = useMemo(() => [...employees].sort((a, b) => (a.name || '').localeCompare(b.name || '')), [employees]);
  const update = (id, patch) => setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  const selectedIds = sorted.filter((e) => rows[e.employee_id]?.selected).map((e) => e.employee_id);
  const allSelected = selectedIds.length === sorted.length && sorted.length > 0;
  const invalidRow = selectedIds.find((id) => Number(rows[id].paid) > Number(rows[id].working) || !(Number(rows[id].working) > 0));

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await payslipGeneratorApi.generateBulk({
        month,
        year,
        employees: selectedIds.map((id) => {
          const r = rows[id];
          const emp = employees.find((e) => e.employee_id === id);
          return {
            employee_id: id,
            total_working_days: Number(r.working),
            total_paid_days: Number(r.paid),
            tds: Number(r.tds || 0),
            to_emails: r.email && emp?.email ? [emp.email.toLowerCase()] : [],
          };
        }),
      });
      setResult(res);
      toast.success(res.message, 'Payroll run complete');
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      setError(err);
    } finally {
      setRunning(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-6">
        <div className="stagger grid gap-4 sm:grid-cols-3">
          <StatCard label="Requested" value={result.total_requested} icon={Users} />
          <StatCard label="Generated" value={result.total_generated} icon={CheckCircle2} tone="success" />
          <StatCard label="Failed" value={result.total_failed} icon={XCircle} tone={result.total_failed ? 'danger' : 'neutral'} />
        </div>
        <Card title={`Results · ${MONTHS[month - 1]} ${year}`} flush actions={<Button variant="secondary" size="sm" onClick={() => setResult(null)}>New run</Button>}>
          <ResponsiveTable
            rows={result.results}
            rowKey={(r) => r.employee_id}
            columns={[
              {
                key: 'employee',
                header: 'Employee',
                role: 'primary',
                cell: (r) => (
                  <>
                    <p className="font-semibold text-slate-800">{r.employee_name || r.employee_id}</p>
                    <p className="text-xs text-slate-500">{r.employee_id}</p>
                  </>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                role: 'badge',
                cell: (r) => (r.status === 'success' ? <Badge tone="success" dot>Generated</Badge> : <Badge tone="danger" dot>Failed</Badge>),
              },
              {
                key: 'net',
                header: 'Net salary',
                className: 'font-medium',
                cell: (r) => <span className="tabular">{r.net_salary != null ? formatINR(r.net_salary) : '—'}</span>,
              },
              {
                key: 'email',
                header: 'Email',
                cell: (r) => (r.status === 'success' ? (r.email_sent ? <Badge tone="success">Sent</Badge> : <Badge>Not sent</Badge>) : '—'),
              },
              { key: 'details', header: 'Details', className: 'max-w-md text-xs text-slate-500', cell: (r) => r.error || r.blob_path },
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <Card
      title="Bulk payroll run"
      subtitle={`${selectedIds.length} of ${sorted.length} employees selected · default ${defaultDays} working days (Mon–Sat)`}
      icon={Users}
      flush
      footer={
        <>
          {running && (
            <div className="w-full">
              <GeneratingNotice
                active
                what={`${selectedIds.length} payslip${selectedIds.length === 1 ? '' : 's'} for ${MONTHS[month - 1]} ${year}`}
                count={selectedIds.length}
              />
            </div>
          )}
          {invalidRow && <span className="mr-auto text-xs text-red-600">{invalidRow}: paid days exceed working days</span>}
          <Button icon={Play} onClick={run} loading={running} disabled={!selectedIds.length || Boolean(invalidRow)}>
            Generate {selectedIds.length} payslip{selectedIds.length === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      {error && <div className="p-4"><Alert tone="danger">{error.message}</Alert></div>}
      {isLoading ? (
        <div className="space-y-2 p-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : sorted.length === 0 ? (
        <EmptyState icon={Users} title="No employees" />
      ) : (
        <ResponsiveTable
          rows={sorted.filter((emp) => rows[emp.employee_id])}
          rowKey={(emp) => emp.employee_id}
          breakpoint="lg"
          rowClassName={(emp) => (!rows[emp.employee_id].selected ? 'opacity-50' : undefined)}
          columns={[
            {
              key: 'select',
              role: 'select',
              headerClassName: 'w-10',
              header: <Checkbox checked={allSelected} onChange={(v) => sorted.forEach((e) => update(e.employee_id, { selected: v }))} />,
              cell: (emp) => <Checkbox checked={rows[emp.employee_id].selected} onChange={(v) => update(emp.employee_id, { selected: v })} />,
            },
            {
              key: 'employee',
              header: 'Employee',
              role: 'primary',
              cell: (emp) => (
                <div className="flex items-center gap-3">
                  <Avatar name={emp.name} src={photoOf(emp)} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{emp.name}</p>
                    <p className="truncate text-xs text-slate-500">{emp.employee_id} · {emp.email}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'working',
              header: 'Working days',
              headerClassName: 'w-28',
              cardRaw: true,
              cell: (emp) => (
                <input
                  className="input py-1.5"
                  inputMode="numeric"
                  value={rows[emp.employee_id].working}
                  disabled={!rows[emp.employee_id].selected}
                  onChange={(e) => update(emp.employee_id, { working: e.target.value.replace(/\D/g, '') })}
                />
              ),
            },
            {
              key: 'paid',
              header: 'Paid days',
              headerClassName: 'w-28',
              cardRaw: true,
              cell: (emp) => (
                <input
                  className={clsx('input py-1.5', Number(rows[emp.employee_id].paid) > Number(rows[emp.employee_id].working) && 'input-error')}
                  inputMode="numeric"
                  value={rows[emp.employee_id].paid}
                  disabled={!rows[emp.employee_id].selected}
                  onChange={(e) => update(emp.employee_id, { paid: e.target.value.replace(/\D/g, '') })}
                />
              ),
            },
            {
              key: 'tds',
              header: 'TDS (₹)',
              headerClassName: 'w-32',
              cardRaw: true,
              cell: (emp) => (
                <input
                  className="input py-1.5"
                  inputMode="numeric"
                  value={rows[emp.employee_id].tds}
                  disabled={!rows[emp.employee_id].selected}
                  onChange={(e) => update(emp.employee_id, { tds: e.target.value.replace(/[^\d.]/g, '') })}
                />
              ),
            },
            {
              key: 'email',
              header: 'Email',
              headerClassName: 'w-24 text-center',
              align: 'center',
              cardRaw: true,
              cell: (emp) => (
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  checked={rows[emp.employee_id].email}
                  disabled={!rows[emp.employee_id].selected}
                  onChange={(e) => update(emp.employee_id, { email: e.target.checked })}
                />
              ),
            },
          ]}
        />
      )}
    </Card>
  );
}

export function RunPayrollPage() {
  const now = new Date();
  const [params, setParams] = useSearchParams();
  const mode = params.get('mode') === 'bulk' ? 'bulk' : 'single';
  const [month, setMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth());
  const [year, setYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payslip generator"
        subtitle="Generate payslips from salary structures. Earnings are prorated by paid days; deductions (PF, PT, TDS) are not."
        actions={
          <Segmented
            value={mode}
            onChange={(v) => setParams(v === 'bulk' ? { mode: 'bulk' } : {}, { replace: true })}
            options={[
              { value: 'single', label: 'Single payslip' },
              { value: 'bulk', label: 'Bulk payroll run' },
            ]}
          />
        }
      />
      {mode === 'single' ? (
        <PayslipGenerator initialEmployeeId={params.get('employee')} />
      ) : (
        <>
          <Card>
            <div className="grid gap-4 md:grid-cols-[360px_1fr] md:items-end">
              <PeriodPicker
                month={month}
                year={year}
                onChange={(m, y) => {
                  setMonth(m);
                  setYear(y);
                }}
              />
              <Alert tone="info">
                Re-generating a payslip for the same month overwrites the stored file. Employees without a salary structure effective in{' '}
                {MONTHS[month - 1]} {year} are reported as failed.
              </Alert>
            </div>
          </Card>
          <BulkPayroll month={month} year={year} />
        </>
      )}
    </div>
  );
}
