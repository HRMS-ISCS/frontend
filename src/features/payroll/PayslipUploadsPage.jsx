import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Circle, XCircle } from 'lucide-react';

import { payslipsApi } from '@/api';
import { useAuth } from '@/lib/auth';
import { MONTHS } from '@/lib/format';
import { Alert, Button, Card, Input, PageHeader, Segmented, Select, useToast } from '@/components/ui';
import { EmployeePicker, useEmployees } from '@/components/EmployeePicker';
import { FileUpload } from '@/components/FileUpload';

const ID_PATTERN = /^ISCS[IE]\d+$/;

/** Payslips are usually published for the month that just ended. */
function lastMonth() {
  const now = new Date();
  return now.getMonth() === 0
    ? { month: 12, year: now.getFullYear() - 1 }
    : { month: now.getMonth(), year: now.getFullYear() };
}

function yearOptions() {
  const y = new Date().getFullYear();
  return [y, y - 1, y - 2].map((v) => ({ value: v, label: String(v) }));
}

/* --------------------------------------------------------- layout --- */
function Step({ n, title, hint, children }) {
  return (
    <section className="px-5 py-5 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">{n}</span>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {hint && <p className="mt-1 pl-9 text-xs text-slate-500">{hint}</p>}
      <div className="mt-3 space-y-3 sm:pl-9">{children}</div>
    </section>
  );
}

function Steps({ children }) {
  return <div className="card divide-y divide-slate-100">{children}</div>;
}

/** Right-hand panel: what will happen, and the one button that does it. */
function Summary({ rows, children, action }) {
  return (
    <Card title="Summary" className="lg:sticky lg:top-24">
      <dl className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-2.5">
            {r.done ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
            ) : (
              <Circle size={16} className="mt-0.5 shrink-0 text-slate-300" />
            )}
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">{r.label}</dt>
              <dd className={clsx('truncate text-sm font-medium', r.done ? 'text-slate-900' : 'text-slate-400')}>{r.value}</dd>
            </div>
          </div>
        ))}
      </dl>
      {children && <div className="mt-4 space-y-3">{children}</div>}
      <div className="mt-5">{action}</div>
    </Card>
  );
}

function TwoColumns({ main, side }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">{main}</div>
      {side}
    </div>
  );
}

/* ------------------------------------------------------------ one --- */
function SingleUpload() {
  const toast = useToast();
  const { isHr } = useAuth();
  const queryClient = useQueryClient();
  const start = lastMonth();
  const [employeeId, setEmployeeId] = useState('');
  const [employee, setEmployee] = useState(null);
  const [month, setMonth] = useState(start.month);
  const [year, setYear] = useState(start.year);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const id = employeeId.trim().toUpperCase();
  const existing = useQuery({
    queryKey: ['payslips', id, year],
    queryFn: () => payslipsApi.list(id, year),
    enabled: ID_PATTERN.test(id),
    retry: false,
  });
  const uploadedMonths = new Set((existing.data?.payslips || []).map((p) => p.month));
  const alreadyThere = uploadedMonths.has(month);
  const period = `${MONTHS[month - 1]} ${year}`;
  const who = employee?.name ? `${employee.name} (${id})` : id;
  const ready = Boolean(id && file) && !alreadyThere;

  const upload = async () => {
    setUploading(true);
    setError(null);
    try {
      const res = await payslipsApi.upload(id, month, year, file);
      toast.success(res.message);
      setDone({ who, period });
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
    } catch (err) {
      setError(err);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setDone(null);
    setFile(null);
    setEmployeeId('');
    setEmployee(null);
    setError(null);
  };

  if (done) {
    return (
      <Card className="max-w-xl">
        <div className="flex items-start gap-4">
          <CheckCircle2 size={28} className="shrink-0 text-emerald-500" />
          <div className="space-y-4">
            <div>
              <p className="text-base font-semibold text-slate-900">Payslip published</p>
              <p className="mt-1 text-sm text-slate-600">
                {done.who} can now see their {done.period} payslip under Payslips.
              </p>
            </div>
            <Button onClick={reset}>Upload another payslip</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <TwoColumns
      main={
        <Steps>
          <Step n={1} title="Choose the employee">
            {isHr ? (
              <EmployeePicker
                value={employeeId || null}
                onChange={(value, emp) => {
                  setEmployeeId(value || '');
                  setEmployee(emp || null);
                }}
              />
            ) : (
              <Input
                aria-label="Employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                placeholder="Employee ID, e.g. ISCSI001"
              />
            )}
          </Step>

          <Step n={2} title="Pick the pay month" hint="Defaults to last month. Months already uploaded are marked.">
            <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
              <Select
                aria-label="Month"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                placeholder={null}
                options={MONTHS.map((m, i) => ({ value: i + 1, label: uploadedMonths.has(i + 1) ? `${m} (already uploaded)` : m }))}
              />
              <Select aria-label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))} placeholder={null} options={yearOptions()} />
            </div>
          </Step>

          <Step n={3} title="Attach the payslip PDF">
            <FileUpload accept=".pdf" file={file} onChange={setFile} hint="PDF only" />
          </Step>
        </Steps>
      }
      side={
        <Summary
          rows={[
            { label: 'Employee', value: id ? who : 'Not selected', done: Boolean(id) },
            { label: 'Pay month', value: period, done: !alreadyThere },
            { label: 'Payslip PDF', value: file ? file.name : 'Not attached', done: Boolean(file) },
          ]}
          action={
            <Button onClick={upload} loading={uploading} disabled={!ready} className="w-full">
              Publish payslip
            </Button>
          }
        >
          {alreadyThere && (
            <Alert tone="warning">
              {period} is already uploaded for this employee. Delete it from their profile first to replace it.
            </Alert>
          )}
          {error && <Alert tone="danger">{error.message}</Alert>}
        </Summary>
      }
    />
  );
}

/* ----------------------------------------------------------- many --- */
function ResultGroup({ icon: Icon, tone, title, rows }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <p className={clsx('mb-2 flex items-center gap-2 text-sm font-semibold', tone)}>
        <Icon size={16} /> {title} ({rows.length})
      </p>
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {rows.map((r) => (
          <li key={r.key} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 px-3 py-2 text-sm">
            <span className="font-medium text-slate-800">{r.label}</span>
            <span className="text-slate-500">{r.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ZipUpload() {
  const toast = useToast();
  const { isHr } = useAuth();
  const queryClient = useQueryClient();
  const { data: employees = [] } = useEmployees(isHr);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const example = lastMonth();
  const exampleName = `ISCSI001_${example.year}_${String(example.month).padStart(2, '0')}.pdf`;

  const nameOf = (empId) => employees.find((e) => e.employee_id === empId)?.name;
  const row = (s) => ({
    key: `${s.employee_id}-${s.year}-${s.month}`,
    label: [nameOf(s.employee_id), s.employee_id].filter(Boolean).join(' · '),
    detail: `${MONTHS[s.month - 1]} ${s.year}`,
  });

  const upload = async () => {
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const res = await payslipsApi.uploadZip(file);
      setResult(res);
      toast.success(res.message);
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
    } catch (err) {
      setError(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <TwoColumns
      main={
        <>
          <Steps>
            <Step n={1} title="Name every PDF by employee ID and month" hint="Put all the PDFs into one ZIP file.">
              <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p>
                  Format <code className="ml-1 font-mono text-slate-900">EMPLOYEEID_YEAR_MONTH.pdf</code>
                </p>
                <p className="mt-1.5">
                  Example <code className="ml-1 font-mono font-semibold text-brand-700">{exampleName}</code>
                  <span className="text-slate-500">
                    {' '}· {MONTHS[example.month - 1]} {example.year} for ISCSI001
                  </span>
                </p>
              </div>
            </Step>
            <Step n={2} title="Attach the ZIP file">
              <FileUpload accept=".zip" file={file} onChange={setFile} hint="ZIP only" />
            </Step>
          </Steps>

          {result && (
            <Card title="Upload results">
              <div className="space-y-5">
                <ResultGroup icon={CheckCircle2} tone="text-emerald-700" title="Published" rows={(result.uploaded || []).map(row)} />
                <ResultGroup icon={AlertTriangle} tone="text-amber-700" title="Skipped, already uploaded" rows={(result.skipped_duplicates || []).map(row)} />
                <ResultGroup
                  icon={XCircle}
                  tone="text-red-700"
                  title="Could not upload"
                  rows={(result.errors || []).map((e) => ({ key: e.filename, label: e.filename, detail: e.reason }))}
                />
                {result.total_uploaded + result.total_skipped + result.total_errors === 0 && (
                  <p className="text-sm text-slate-500">The ZIP contained no PDF files.</p>
                )}
              </div>
            </Card>
          )}
        </>
      }
      side={
        <Summary
          rows={
            result
              ? [
                  { label: 'Published', value: String(result.total_uploaded), done: true },
                  { label: 'Skipped, already uploaded', value: String(result.total_skipped), done: result.total_skipped === 0 },
                  { label: 'Could not upload', value: String(result.total_errors), done: result.total_errors === 0 },
                ]
              : [{ label: 'ZIP file', value: file ? file.name : 'Not attached', done: Boolean(file) }]
          }
          action={
            <Button onClick={upload} loading={uploading} disabled={!file} className="w-full">
              Upload and publish
            </Button>
          }
        >
          <p className="text-xs text-slate-500">Payslips that already exist are skipped, never overwritten.</p>
          {error && <Alert tone="danger">{error.message}</Alert>}
        </Summary>
      }
    />
  );
}

/* ----------------------------------------------------------- page --- */
export function PayslipUploadsPage() {
  const [mode, setMode] = useState('one');

  return (
    <div>
      <PageHeader
        title="Payslip uploads"
        subtitle="Publish payslip PDFs so employees can see them in their portal."
        actions={
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'one', label: 'One employee' },
              { value: 'many', label: 'Many employees (ZIP)' },
            ]}
          />
        }
      />
      {mode === 'one' ? <SingleUpload /> : <ZipUpload />}
    </div>
  );
}
