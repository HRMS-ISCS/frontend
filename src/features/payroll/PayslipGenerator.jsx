import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Download, Mail, Receipt } from 'lucide-react';

import { payslipGeneratorApi, salaryApi } from '@/api';
import { saveBlob } from '@/lib/api';
import { daysInMonth, formatDate, formatINR, MONTHS, workingDaysInMonth } from '@/lib/format';
import { numberToIndianWords, payslipAmounts } from '@/lib/salary';
import { Alert, Button, Card, FormGrid, FormSection, Input, Select, Skeleton, useToast } from '@/components/ui';
import { EmployeePicker, useEmployees } from '@/components/EmployeePicker';
import { RecipientsFields } from '@/components/EmailRecipients';
import { GeneratingNotice } from '@/components/GeneratingNotice';

/** The structure the backend will use: latest effective_from on or before month end. */
function structureForMonth(history, year, month) {
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth(year, month)).padStart(2, '0')}`;
  return (history || [])
    .filter((s) => s.effective_from <= monthEnd)
    .sort((a, b) => (b.effective_from.localeCompare(a.effective_from) || b.id - a.id))[0];
}

function previousMonth() {
  const now = new Date();
  return now.getMonth() === 0 ? { month: 12, year: now.getFullYear() - 1 } : { month: now.getMonth(), year: now.getFullYear() };
}

function Preview({ employeeId, month, year, working, paid, tds }) {
  const history = useQuery({
    queryKey: ['salary', employeeId, 'history'],
    queryFn: () => salaryApi.history(employeeId),
    enabled: Boolean(employeeId),
  });

  if (!employeeId) {
    return <p className="text-sm text-slate-500">Choose an employee to preview their payslip.</p>;
  }
  if (history.isLoading) return <Skeleton className="h-64" />;
  if (history.error) return <Alert tone="danger">{history.error.message}</Alert>;

  const all = history.data?.history || [];
  const structure = structureForMonth(all, year, month);

  if (!all.length) {
    return (
      <Alert tone="warning" icon={AlertTriangle} title="No salary structure">
        Create one first in{' '}
        <Link to={`/payroll/salary?employee=${employeeId}`} className="font-semibold underline">
          Salary structures
        </Link>
        .
      </Alert>
    );
  }
  if (!structure) {
    const earliest = [...all].sort((a, b) => a.effective_from.localeCompare(b.effective_from))[0];
    return (
      <Alert tone="warning" icon={AlertTriangle} title={`No structure in force for ${MONTHS[month - 1]} ${year}`}>
        The earliest structure starts on {formatDate(earliest.effective_from)}.
      </Alert>
    );
  }

  const amounts = payslipAmounts(structure, working, paid, tds);
  if (!amounts) return <p className="text-sm text-slate-500">Enter valid working and paid days to preview.</p>;

  const Rows = ({ title, rows, total, totalLabel }) => (
    <div>
      <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between px-1 py-1 text-sm text-slate-600">
          <span>{r.label}</span>
          <span>{formatINR(r.value)}</span>
        </div>
      ))}
      <div className="mt-1 flex justify-between border-t border-slate-100 px-1 pt-2 text-sm font-semibold text-slate-900">
        <span>{totalLabel}</span>
        <span>{formatINR(total)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-slate-500">Monthly gross</p>
          <p className="text-sm font-semibold text-slate-800">{formatINR(amounts.gross)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-slate-500">Structure from</p>
          <p className="text-sm font-semibold text-slate-800">{formatDate(structure.effective_from)}</p>
        </div>
      </div>
      <Rows title={`Earnings · ${paid}/${working} days`} rows={amounts.earnings} total={amounts.totalEarnings} totalLabel="Total earnings" />
      <Rows title="Deductions" rows={amounts.deductions} total={amounts.totalDeductions} totalLabel="Total deductions" />
      <div className="rounded-xl bg-brand-50 px-4 py-3">
        <p className="text-xs font-medium text-brand-700">Net salary</p>
        <p className="text-2xl font-semibold text-brand-900">{formatINR(amounts.netSalary)}</p>
        <p className="text-xs text-brand-700">Rupees {numberToIndianWords(Math.max(amounts.netSalary, 0))} only</p>
      </div>
    </div>
  );
}

/**
 * Generate one payslip: stored against the employee, optionally emailed, and
 * downloaded. The preview mirrors the backend's calculation exactly.
 */
export function PayslipGenerator({ initialEmployeeId = null }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: employees } = useEmployees();
  const start = previousMonth();

  const [employeeId, setEmployeeId] = useState(initialEmployeeId);
  const [month, setMonth] = useState(start.month);
  const [year, setYear] = useState(start.year);
  const defaultDays = workingDaysInMonth(year, month);
  const [working, setWorking] = useState(String(defaultDays));
  const [paid, setPaid] = useState(String(defaultDays));
  const [tds, setTds] = useState('0');
  const [recipients, setRecipients] = useState({ to_emails: [], cc_emails: [], bcc_emails: [] });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setWorking(String(defaultDays));
    setPaid(String(defaultDays));
  }, [defaultDays]);

  // Pre-fill the employee's email once the list is available (e.g. deep link).
  const employee = useMemo(() => (employees || []).find((e) => e.employee_id === employeeId), [employees, employeeId]);
  useEffect(() => {
    if (employee?.email) setRecipients((r) => (r.to_emails.length ? r : { ...r, to_emails: [employee.email.toLowerCase()] }));
  }, [employee]);

  const paidTooHigh = Number(paid) > Number(working);
  const invalid = !employeeId || !(Number(working) > 0) || paid === '' || paidTooHigh || Number(working) > 31;
  const current = new Date().getFullYear();

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const { blob, headers } = await payslipGeneratorApi.generate({
        employee_id: employeeId,
        month,
        year,
        total_working_days: Number(working),
        total_paid_days: Number(paid),
        tds: Number(tds || 0),
        ...recipients,
      });
      const filename = `Payslip_${employeeId}_${year}_${String(month).padStart(2, '0')}.pdf`;
      saveBlob(blob, filename);
      const emailed = headers.get('X-Email-Sent') === 'true';
      setResult({ filename, emailed });
      toast.success(emailed ? 'Payslip generated, stored and emailed.' : 'Payslip generated and stored.', `${MONTHS[month - 1]} ${year}`);
      queryClient.invalidateQueries({ queryKey: ['payslips', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['document-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      setError(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <Card
        title="Payslip"
        icon={Receipt}
        footer={
          <>
            <span className="mr-auto text-xs text-slate-500">Re-generating the same month replaces the stored payslip.</span>
            <Button icon={recipients.to_emails.length ? Mail : Download} onClick={generate} loading={generating} disabled={invalid}>
              {recipients.to_emails.length ? 'Generate & email' : 'Generate & download'}
            </Button>
          </>
        }
      >
        <div className="divide-y divide-slate-100">
          <FormSection title="Employee & period" description="Employee details, bank, PAN/UAN and salary components come from their records.">
            <div className="space-y-4">
              <EmployeePicker
                label="Employee"
                required
                value={employeeId}
                onChange={(id, emp) => {
                  setEmployeeId(id);
                  setResult(null);
                  setRecipients((r) => ({ ...r, to_emails: emp?.email ? [emp.email.toLowerCase()] : [] }));
                }}
              />
              <FormGrid>
                <Select label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))} placeholder={null} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
                <Select label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))} placeholder={null} options={[current + 1, current, current - 1, current - 2].map((y) => ({ value: y, label: String(y) }))} />
              </FormGrid>
            </div>
          </FormSection>

          <FormSection title="Attendance & tax" description={`Defaults to ${defaultDays} working days (Monday–Saturday). Earnings are prorated; deductions are not.`}>
            <FormGrid cols={3}>
              <Input label="Working days" required inputMode="numeric" maxLength={2} value={working} onChange={(e) => setWorking(e.target.value.replace(/\D/g, ''))} error={Number(working) > 31 ? 'Max 31' : undefined} />
              <Input label="Paid days" required inputMode="numeric" maxLength={2} value={paid} onChange={(e) => setPaid(e.target.value.replace(/\D/g, ''))} error={paidTooHigh ? 'Cannot exceed working days' : undefined} />
              <Input label="TDS (₹)" inputMode="numeric" value={tds} onChange={(e) => setTds(e.target.value.replace(/[^\d.]/g, ''))} hint="Income tax for this month" />
            </FormGrid>
          </FormSection>

          <FormSection title="Email delivery" description="The payslip PDF is attached. BCC recipients stay hidden.">
            <RecipientsFields value={recipients} onChange={setRecipients} toHint="Defaults to the employee's email. Leave empty to only store & download." />
          </FormSection>
        </div>
        {generating && (
          <div className="mt-5">
            <GeneratingNotice active what={`the ${MONTHS[month - 1]} ${year} payslip`} />
          </div>
        )}
        {error && <Alert tone="danger" className="mt-5" title="Could not generate the payslip">{error.message}</Alert>}
      </Card>

      <div className="space-y-6">
        {result && (
          <Card title="Generated" icon={CheckCircle2}>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2"><Download size={15} className="text-emerald-500" /> {result.filename} downloaded</li>
              <li className="flex items-center gap-2"><Receipt size={15} className="text-emerald-500" /> Published to the employee's Payslips page</li>
              <li className="flex items-center gap-2">
                <Mail size={15} className={result.emailed ? 'text-emerald-500' : 'text-slate-400'} />
                {result.emailed ? 'Emailed to recipients' : 'Not emailed'}
              </li>
            </ul>
          </Card>
        )}
        <Card title="Payslip preview" subtitle={`${MONTHS[month - 1]} ${year} · as it will be printed`}>
          <Preview employeeId={employeeId} month={month} year={year} working={working} paid={paid} tds={tds} />
        </Card>
      </div>
    </div>
  );
}
