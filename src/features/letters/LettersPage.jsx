import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { CheckCircle2, Download, FileSignature, FileText, Info, Mail, ScrollText, ShieldCheck, UserMinus } from 'lucide-react';

import { employeesApi, lettersApi } from '@/api';
import { saveBlob } from '@/lib/api';
import { formatINR, formatLPA, todayISO } from '@/lib/format';
import { letterSalaryBreakup, numberToIndianWords } from '@/lib/salary';
import { Alert, Button, Card, FormGrid, FormSection, Input, PageHeader, Select, useToast } from '@/components/ui';
import { EmployeePicker } from '@/components/EmployeePicker';
import { RecipientsFields } from '@/components/EmailRecipients';
import { GeneratingNotice } from '@/components/GeneratingNotice';

const LETTERS = {
  'proposed-offer': {
    title: 'Proposed offer letter',
    filePrefix: 'Proposed_Offer_Letter',
    icon: FileText,
    description: 'Offer with CTC breakup, sent before joining.',
    api: lettersApi.proposedOffer,
    emails: true,
    salary: true,
    linkEmployee: false,
  },
  appointment: {
    title: 'Appointment letter',
    filePrefix: 'Appointment_Letter',
    icon: ScrollText,
    description: 'Formal appointment with Annexure II salary breakup. Filed for Zoho signing.',
    api: lettersApi.appointment,
    emails: true,
    salary: true,
    linkEmployee: true,
  },
  nda: {
    title: 'Non-disclosure agreement',
    filePrefix: 'NDA',
    icon: ShieldCheck,
    description: 'Confidentiality agreement. Filed for Zoho signing; not emailed.',
    api: lettersApi.nda,
    emails: false,
    salary: false,
    linkEmployee: true,
  },
  relieving: {
    title: 'Relieving & experience letter',
    filePrefix: 'Relieving_Experience_Letter',
    icon: UserMinus,
    description: 'Issued at exit with tenure and last designation.',
    api: lettersApi.relieving,
    emails: true,
    salary: false,
    linkEmployee: false,
  },
};

const EMPTY = {
  employee_name: '',
  employee_id: '',
  gender_prefix: '',
  father_name: '',
  address_line1: '',
  address_line2: '',
  address_line3: '',
  designation: '',
  date_of_joining: '',
  annual_ctc: '',
  letter_date: '',
  effective_date: '',
  relieving_date: '',
  client_name: '',
  client_release_date: '',
  generated_date: '',
  reference_number: '',
  recipients: { to_emails: [], cc_emails: [], bcc_emails: [] },
};

function fromRecord(record) {
  const p = record.personal_profile || {};
  const father = (record.family_background || []).find((f) => /father/i.test(f.relationship_status || ''));
  const line2 = [p.current_address_city, p.current_address_district].filter(Boolean).join(', ');
  const line3 = [p.current_address_state, p.current_address_pin_code].filter(Boolean).join(' - ');
  return {
    employee_name: record.name || '',
    employee_id: record.employee_id || '',
    gender_prefix: p.gender === 'Male' ? 'Mr.' : p.gender === 'Female' ? 'Ms.' : '',
    father_name: father?.name || '',
    address_line1: line2,
    address_line2: line3,
    address_line3: p.nationality && p.nationality !== 'Indian' ? p.nationality : 'India',
    designation: record.position || '',
    date_of_joining: record.date_of_joining ? String(record.date_of_joining).slice(0, 10) : '',
    client_name: record.client || '',
  };
}

function SalaryPreview({ ctc }) {
  const breakup = letterSalaryBreakup(ctc);
  if (!breakup) {
    return <p className="text-sm text-slate-500">Enter an annual CTC to preview the Annexure salary breakup.</p>;
  }
  const Section = ({ title, rows }) => (
    <div>
      <p className="px-3 pt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      {rows.map((r) => (
        <div key={r.label} className={clsx('grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-1.5 text-sm', r.emphasis ? 'font-semibold text-slate-900' : 'text-slate-600')}>
          <span>{r.label}</span>
          <span className="w-20 text-right">{formatINR(r.monthly)}</span>
          <span className="w-24 text-right">{formatINR(r.annual)}</span>
        </div>
      ))}
    </div>
  );
  return (
    <div>
      <div className="mb-3 rounded-lg bg-brand-50 px-4 py-3">
        <p className="text-xl font-semibold text-brand-900">{formatINR(ctc)}</p>
        <p className="text-xs text-brand-700">
          {formatLPA(ctc)} · Rupees {numberToIndianWords(ctc)} only
        </p>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <span>Component</span>
        <span className="w-20 text-right">Monthly</span>
        <span className="w-24 text-right">Annual</span>
      </div>
      <div className="divide-y divide-slate-100">
        <Section title="Earnings" rows={breakup.earnings} />
        <Section title="Employer contribution" rows={breakup.employer} />
        <Section title="Deductions" rows={breakup.deductions} />
      </div>
    </div>
  );
}

export function LettersPage() {
  const { type } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const cfg = LETTERS[type];

  const [values, setValues] = useState(EMPTY);
  const [linkedEmployee, setLinkedEmployee] = useState(params.get('employee') || null);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const set = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [type]);

  useEffect(() => {
    if (!linkedEmployee) return;
    let cancelled = false;
    setLoadingEmployee(true);
    employeesApi
      .get(linkedEmployee)
      .then((record) => {
        if (cancelled) return;
        setValues((prev) => ({
          ...prev,
          ...fromRecord(record),
          recipients: { ...prev.recipients, to_emails: record.email ? [record.email.toLowerCase()] : prev.recipients.to_emails },
        }));
      })
      .catch((err) => toast.error(err))
      .finally(() => !cancelled && setLoadingEmployee(false));
    return () => {
      cancelled = true;
    };
  }, [linkedEmployee, toast]);

  // Payslips used to be a tab here; they now live only under Payroll.
  if (type === 'payslip') return <Navigate to={`/payroll/run${linkedEmployee ? `?employee=${linkedEmployee}` : ''}`} replace />;
  if (!cfg) return <Navigate to="/letters/proposed-offer" replace />;

  const v = values;
  const opt = (x) => (x === '' || x === null || x === undefined ? undefined : x);

  const buildBody = () => {
    const base = { employee_name: opt(v.employee_name.trim()) };
    const emails = cfg.emails ? v.recipients : {};
    switch (type) {
      case 'proposed-offer':
        return { ...base, designation: opt(v.designation), date_of_joining: opt(v.date_of_joining), annual_ctc: v.annual_ctc ? Number(v.annual_ctc) : undefined, ...emails };
      case 'appointment':
        return {
          ...base,
          employee_id: opt(v.employee_id),
          gender_prefix: opt(v.gender_prefix),
          father_name: opt(v.father_name),
          address_line1: opt(v.address_line1),
          address_line2: opt(v.address_line2),
          address_line3: opt(v.address_line3),
          designation: opt(v.designation),
          date_of_joining: opt(v.date_of_joining),
          annual_ctc: v.annual_ctc ? Number(v.annual_ctc) : undefined,
          letter_date: opt(v.letter_date),
          ...emails,
        };
      case 'nda':
        return {
          ...base,
          employee_id: opt(v.employee_id),
          father_name: opt(v.father_name),
          address_line1: opt(v.address_line1),
          address_line2: opt(v.address_line2),
          address_line3: opt(v.address_line3),
          effective_date: opt(v.effective_date),
        };
      case 'relieving':
        return {
          ...base,
          designation: opt(v.designation),
          date_of_joining: opt(v.date_of_joining),
          relieving_date: opt(v.relieving_date),
          client_name: opt(v.client_name),
          client_release_date: opt(v.client_release_date),
          generated_date: opt(v.generated_date),
          reference_number: opt(v.reference_number),
          ...emails,
        };
      default:
        return base;
    }
  };

  const wantsEmail = cfg.emails && v.recipients.to_emails.length > 0;
  const emailBlocked = wantsEmail && (!v.employee_name || !v.designation || !v.date_of_joining);

  const generate = async () => {
    if (!v.employee_name.trim()) {
      setError({ message: 'Employee name is required.' });
      return;
    }
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const { blob, headers, filename: serverName } = await cfg.api(buildBody());
      // Content-Disposition is not CORS-exposed by the backend, so name the file here.
      const safeName = v.employee_name.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') || 'Employee';
      const filename = serverName !== 'download' ? serverName : `${cfg.filePrefix}_${safeName}.pdf`;
      saveBlob(blob, filename);
      const info = {
        filename,
        emailSent: headers.get('X-Email-Sent') === 'true',
        recipients: v.recipients.to_emails.length + v.recipients.cc_emails.length + v.recipients.bcc_emails.length,
        employeeId: headers.get('X-Employee-Id'),
        match: headers.get('X-Employee-Match'),
        readyForSigning: headers.get('X-Ready-For-Signing') === 'true',
      };
      setResult(info);
      toast.success(info.emailSent ? `Downloaded and emailed to ${info.recipients} recipient(s).` : 'Letter generated and downloaded.', cfg.title);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['document-history'] });
    } catch (err) {
      setError(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Letter generation"subtitle="Generate letters from the official templates. Every dispatch is archived in Document Dispatch History." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(LETTERS).map(([key, l]) => (
          <button
            key={key}
            type="button"
            onClick={() => navigate(`/letters/${key}${linkedEmployee ? `?employee=${linkedEmployee}` : ''}`)}
            className={clsx(
              'card flex items-start gap-3 p-4 text-left transition',
              key === type ? 'border-brand-400 ring-2 ring-brand-100' : 'hover:border-brand-200',
            )}
          >
            <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', key === type ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500')}>
              <l.icon size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-800">{l.title}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{l.description}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <Card
          title={cfg.title}
          icon={cfg.icon}
          footer={
            <>
              <span className="mr-auto text-xs text-slate-500">All fields are optional; blanks stay empty in the PDF.</span>
              <Button icon={wantsEmail ? Mail : Download} onClick={generate} loading={generating}>
                {wantsEmail ? 'Generate & email' : 'Generate & download'}
              </Button>
            </>
          }
        >
          <div className="divide-y divide-slate-100">
            <FormSection title="Recipient" description="Pick an existing employee to autofill, or type the details for a candidate.">
              <div className="space-y-4">
                <EmployeePicker
                  label="Autofill from employee (optional)"
                  value={linkedEmployee}
                  onChange={(id) => {
                    setLinkedEmployee(id);
                    if (!id) setValues(EMPTY);
                  }}
                  hint={loadingEmployee ? 'Loading employee record…' : undefined}
                />
                <FormGrid cols={3}>
                  {type === 'appointment' && (
                    <Select label="Salutation" value={v.gender_prefix} onChange={(e) => set('gender_prefix', e.target.value)} options={['Mr.', 'Ms.', 'Mrs.']} />
                  )}
                  <Input label="Full name" required value={v.employee_name} onChange={(e) => set('employee_name', e.target.value)} fieldClassName={type === 'appointment' ? '' : 'sm:col-span-2'} />
                  {cfg.linkEmployee && (
                    <Input label="Employee ID" value={v.employee_id} onChange={(e) => set('employee_id', e.target.value.toUpperCase())} hint="Links the file for Zoho signing" />
                  )}
                  {(type === 'appointment' || type === 'nda') && (
                    <Input label="Father's name" value={v.father_name} onChange={(e) => set('father_name', e.target.value)} />
                  )}
                </FormGrid>
                {(type === 'appointment' || type === 'nda') && (
                  <FormGrid cols={3}>
                    <Input label="Address line 1" value={v.address_line1} onChange={(e) => set('address_line1', e.target.value)} placeholder="House no, street" />
                    <Input label="Address line 2" value={v.address_line2} onChange={(e) => set('address_line2', e.target.value)} placeholder="Area, city" />
                    <Input label="Address line 3" value={v.address_line3} onChange={(e) => set('address_line3', e.target.value)} placeholder="State – PIN" />
                  </FormGrid>
                )}
              </div>
            </FormSection>

            {type !== 'nda' && (
              <FormSection title={type === 'relieving' ? 'Employment' : 'Offer terms'}>
                <FormGrid cols={3}>
                  <Input label={type === 'relieving' ? 'Last designation' : 'Designation'} value={v.designation} onChange={(e) => set('designation', e.target.value)} />
                  <Input label="Date of joining" type="date" value={v.date_of_joining} onChange={(e) => set('date_of_joining', e.target.value)} />
                  {cfg.salary && (
                    <Input label="Annual CTC (₹)" inputMode="numeric" value={v.annual_ctc} onChange={(e) => set('annual_ctc', e.target.value.replace(/[^\d]/g, ''))} hint={v.annual_ctc ? formatLPA(v.annual_ctc) : undefined} />
                  )}
                  {type === 'appointment' && (
                    <Input label="Letter date" type="date" value={v.letter_date} onChange={(e) => set('letter_date', e.target.value)} hint="Defaults to today" />
                  )}
                  {type === 'relieving' && (
                    <>
                      <Input label="Relieving date" type="date" value={v.relieving_date} onChange={(e) => set('relieving_date', e.target.value)} />
                      <Input label="Client" value={v.client_name} onChange={(e) => set('client_name', e.target.value)} />
                      <Input label="Client release date" type="date" value={v.client_release_date} onChange={(e) => set('client_release_date', e.target.value)} />
                      <Input label="Letter date" type="date" value={v.generated_date} onChange={(e) => set('generated_date', e.target.value)} hint="Defaults to today" />
                      <Input label="Reference number" value={v.reference_number} onChange={(e) => set('reference_number', e.target.value)} placeholder="ISCS/R/E/EMP/E083/…" fieldClassName="sm:col-span-2" />
                    </>
                  )}
                </FormGrid>
              </FormSection>
            )}

            {type === 'nda' && (
              <FormSection title="Agreement">
                <FormGrid cols={3}>
                  <Input label="Effective date" type="date" value={v.effective_date} onChange={(e) => set('effective_date', e.target.value)} hint={`Defaults to ${todayISO()}`} />
                </FormGrid>
              </FormSection>
            )}

            {cfg.emails && (
              <FormSection title="Email delivery" description="The PDF is attached. BCC recipients stay hidden.">
                <RecipientsFields value={v.recipients} onChange={(recipients) => set('recipients', recipients)} />
                {emailBlocked && (
                  <Alert tone="warning" className="mt-4">
                    Name, designation and date of joining are required for the email to be sent. Without them the letter is only downloaded.
                  </Alert>
                )}
              </FormSection>
            )}
          </div>
          {generating && (
            <div className="mt-5">
              <GeneratingNotice active what={`the ${cfg.title.toLowerCase()}`} />
            </div>
          )}
          {error && <Alert tone="danger" className="mt-5" title="Could not generate the letter">{error.message}</Alert>}
        </Card>

        <div className="space-y-6">
          {result && (
            <Card title="Generated" icon={CheckCircle2}>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-slate-700"><Download size={15} className="text-emerald-500" /> {result.filename} downloaded</li>
                {cfg.emails && (
                  <li className="flex items-center gap-2 text-slate-700">
                    <Mail size={15} className={result.emailSent ? 'text-emerald-500' : 'text-slate-400'} />
                    {result.emailSent ? `Emailed to ${result.recipients} recipient(s)` : 'Not emailed'}
                  </li>
                )}
                {cfg.linkEmployee && (
                  <li>
                    {result.readyForSigning ? (
                      <Alert tone="success" icon={FileSignature} title={`Filed against ${result.employeeId}`}>
                        Ready for Zoho signing (matched by {result.match?.replace('_', ' ')}).
                      </Alert>
                    ) : (
                      <Alert tone="warning" title="Not linked to an employee">
                        Saved under the candidate's name. It is picked up automatically for signing once their employee record exists.
                      </Alert>
                    )}
                  </li>
                )}
              </ul>
            </Card>
          )}
          {cfg.salary ? (
            <Card title="Salary breakup preview" subtitle="Exactly as printed in the letter">
              <SalaryPreview ctc={v.annual_ctc} />
            </Card>
          ) : (
            <Card title="About this letter" icon={Info}>
              <p className="text-sm leading-relaxed text-slate-600">
                {type === 'nda'
                  ? 'The NDA is archived for the employee and bundled into their Zoho Sign package at onboarding Step 6, where it is signed with Aadhaar eSign. It is not emailed.'
                  : 'The relieving & experience letter is emailed with the PDF attached when recipients are provided, and archived in Document Dispatch History.'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
