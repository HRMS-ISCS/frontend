import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, CheckCircle2, FileSignature, FileText, Pencil, Receipt, Send } from 'lucide-react';

import { documentHistoryApi, employeesApi, onboardingApi, payslipsApi, positionsApi, salaryApi, signatureAdminApi } from '@/api';
import { PATTERNS } from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/format';
import { useForm, validate } from '@/lib/hooks';
import { Alert, Badge, Button, Card, Combobox, DefinitionList, EmptyState, ErrorState, FormGrid, Input, Modal, PageHeader, PageLoader, Tabs, Textarea, useToast } from '@/components/ui';
import { AadhaarBadge } from '@/components/StatusBadges';
import { photoOf, useEmployees } from '@/components/EmployeePicker';
import { ProfileHero, OnboardingChecklist } from './ProfileHero';
import { ActivityTimeline, buildTimeline } from './ActivityTimeline';
import { SalaryStructureCard } from '@/features/payroll/SalaryStructureCard';
import { CountersignModal, RequestActions, RequestSummary, SendEnvelopeModal, SignedDocumentsModal } from '@/features/signatures/components';
import { DocumentsPanel } from './DocumentsPanel';
import { PayslipsPanel } from './PayslipsPanel';
import { BankFamilySection, CareerSection, PersonalSection, ReferencesSection } from './ProfileSections';

function EditBasicModal({ record, onClose }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: positionData } = useQuery({ queryKey: ['positions', 'names'], queryFn: positionsApi.names });
  const positions = positionData?.positions || [];
  const { values, set, errors, setErrors } = useForm({
    name: record.name || '',
    email: record.email || '',
    phone: record.phone || '',
    position: record.position || '',
    date_of_joining: record.date_of_joining ? String(record.date_of_joining).slice(0, 10) : '',
    client: record.client || '',
    skill_set: record.skill_set || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    const found = validate(values, {
      name: (v) => (!v.trim() ? 'Required' : undefined),
      email: (v) => (!PATTERNS.email.test(v) ? 'Invalid email' : undefined),
      phone: (v) => (!PATTERNS.phone.test(v) ? '10 digits' : undefined),
      position: (v) => (!v.trim() ? 'Required' : undefined),
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setError(null);
    try {
      if (!positions.some((p) => p.toLowerCase() === values.position.trim().toLowerCase())) {
        await positionsApi.create(values.position.trim()).catch(() => {});
      }
      // Employee ID is deliberately not editable here: renaming it through this
      // endpoint re-creates the record and drops salary and signing history.
      await onboardingApi.updateBasic(record.employee_id, {
        name: values.name.trim(),
        employee_id: record.employee_id,
        email: values.email.trim().toLowerCase(),
        phone: values.phone,
        position: values.position.trim(),
        date_of_joining: values.date_of_joining ? `${values.date_of_joining}T00:00:00` : null,
        client: values.client.trim() || undefined,
        skill_set: values.skill_set.trim() || undefined,
      });
      toast.success('Employee details updated');
      queryClient.invalidateQueries({ queryKey: ['employee', record.employee_id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
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
      title="Edit basic details"
      description={record.employee_id}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Save changes</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error.message}</Alert>}
        <FormGrid>
          <Input label="Full name" required value={values.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
          <Input label="Email" required value={values.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
          <Input label="Phone" required maxLength={10} value={values.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))} error={errors.phone} />
          <Combobox label="Position" required value={values.position} onChange={(v) => set('position', v)} options={positions} error={errors.position} placeholder="Type or choose a position" />
          <Input label="Date of joining" type="date" value={values.date_of_joining} onChange={(e) => set('date_of_joining', e.target.value)} />
          <Input label="Client" value={values.client} onChange={(e) => set('client', e.target.value)} />
          <Textarea label="Skills" rows={2} fieldClassName="sm:col-span-2" value={values.skill_set} onChange={(e) => set('skill_set', e.target.value)} />
        </FormGrid>
      </div>
    </Modal>
  );
}

function SigningTab({ employeeId }) {
  const [countersign, setCountersign] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [sending, setSending] = useState(false);
  const list = useQuery({
    queryKey: ['signatures', 'employee', employeeId],
    queryFn: () => signatureAdminApi.list({ search: employeeId, page_size: 50 }),
  });
  const requests = (list.data?.requests || []).filter((r) => r.employee_id === employeeId);

  return (
    <div className="space-y-5">
      <Card
        title="Signing envelopes"
        icon={FileSignature}
        flush
        actions={<Button size="sm" icon={Send} onClick={() => setSending(true)}>Send envelope for signing</Button>}
      >
        {list.isLoading ? (
          <div className="p-6"><PageLoader /></div>
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.refetch} />
        ) : requests.length === 0 ? (
          <EmptyState icon={FileSignature} title="No envelopes yet" description="An envelope is created when the employee reaches Step 6, or when you send the package." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-800">{r.envelope_label}</p>
                    <span className="text-xs text-slate-400">#{r.id}</span>
                    <AadhaarBadge signMethod={r.sign_method} confirmed={r.aadhaar_confirmed} />
                  </div>
                  <div className="mt-1"><RequestSummary request={r} /></div>
                  <p className="mt-1 text-xs text-slate-500">
                    Created {formatDateTime(r.created_at)}
                    {r.sent_at && ` · sent ${formatDate(r.sent_at)}`}
                    {r.employee_signed_at && ` · employee signed ${formatDate(r.employee_signed_at)}`}
                    {r.completed_at && ` · completed ${formatDate(r.completed_at)}`}
                  </p>
                </div>
                <RequestActions request={r} onCountersign={setCountersign} onDocuments={setDocuments} />
              </li>
            ))}
          </ul>
        )}
      </Card>
      {countersign && <CountersignModal request={countersign} onClose={() => setCountersign(null)} />}
      {documents && <SignedDocumentsModal request={documents} onClose={() => setDocuments(null)} />}
      {sending && <SendEnvelopeModal employeeId={employeeId} onClose={() => setSending(false)} />}
    </div>
  );
}

export function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const { data: employees = [] } = useEmployees();
  const { data: record, isLoading, error, refetch } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeesApi.get(employeeId),
  });

  /* Vitals and the timeline read from endpoints this page already owns.
   * Each is independent - one failing leaves the rest of the page intact. */
  const salary = useQuery({
    queryKey: ['salary', employeeId, 'current'],
    queryFn: () => salaryApi.get(employeeId).catch((err) => (err.status === 404 ? null : Promise.reject(err))),
    enabled: Boolean(employeeId),
    retry: false,
  });
  const docs = useQuery({
    queryKey: ['document-history', 'employee', employeeId],
    queryFn: () => documentHistoryApi.list({ search: employeeId, page_size: 100 }),
    enabled: Boolean(employeeId),
    retry: false,
  });
  const sigs = useQuery({
    queryKey: ['signatures', 'employee', employeeId],
    queryFn: () => signatureAdminApi.list({ search: employeeId, page_size: 50 }),
    enabled: Boolean(employeeId),
    retry: false,
  });
  const slips = useQuery({
    queryKey: ['payslips', employeeId, ''],
    queryFn: () => payslipsApi.list(employeeId),
    enabled: Boolean(employeeId),
    retry: false,
  });

  if (isLoading) return <PageLoader />;
  if (error) return <Card><ErrorState error={error} onRetry={refetch} /></Card>;

  const listEntry = employees.find((e) => e.employee_id === employeeId);
  const p = record.personal_profile;

  const employeeDocs = (docs.data?.documents || []).filter((d) => d.employee_id === employeeId);
  const employeeSigs = (sigs.data?.requests || []).filter((r) => r.employee_id === employeeId);
  const employeeSlips = slips.data?.payslips || [];
  const timeline = buildTimeline({ documents: employeeDocs, signatures: employeeSigs, payslips: employeeSlips });

  const latestSig = employeeSigs[0];
  const SIG_VITAL = {
    completed: { label: 'Completed', tone: 'success' },
    employee_signed: { label: 'Awaiting HR', tone: 'warning' },
    sent: { label: 'Awaiting employee', tone: 'info' },
    viewed: { label: 'Opened', tone: 'info' },
    pending_service: { label: 'Pending', tone: 'neutral' },
    failed: { label: 'Failed', tone: 'danger' },
  };
  const sigVital = latestSig ? SIG_VITAL[latestSig.status] : null;

  /* Vitals ride on a shallow copy so the cached record is never mutated. */
  const heroRecord = {
    ...record,
    __ctc: salary.data?.annual_ctc,
    __docCount: docs.isLoading ? null : employeeDocs.length,
    __lastDoc: employeeDocs[0]?.generated_at,
    __sigLabel: sigs.isLoading ? null : sigVital?.label || 'Not started',
    __sigSub: latestSig?.document_count ? `${latestSig.document_count} documents` : null,
    __sigTone: sigVital?.tone || 'neutral',
  };

  const heroBtn =
    'border-white/25 bg-white/10 text-white shadow-none backdrop-blur hover:border-white/40 hover:bg-white/20 hover:text-white';

  return (
    <div className="space-y-6">
      <PageHeader title={record.name} breadcrumbs={[{ label: 'Employees', to: '/employees' }, { label: record.employee_id }]} />

      <ProfileHero
        record={heroRecord}
        photo={photoOf(listEntry)}
        actions={
          <>
            <Link to={`/letters/appointment?employee=${employeeId}`}>
              <Button variant="secondary" icon={FileText} className={heroBtn}>
                Issue letter
              </Button>
            </Link>
            <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)} className={heroBtn}>
              Edit
            </Button>
          </>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'personal', label: 'Personal' },
          { id: 'bank', label: 'Bank & family' },
          { id: 'career', label: 'Career' },
          { id: 'references', label: 'References' },
          { id: 'documents', label: 'Documents' },
          { id: 'payroll', label: 'Payroll' },
          { id: 'signing', label: 'E-signature', count: employeeSigs.length || undefined },
        ]}
      />

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <Card
              title="Activity"
              subtitle="Letters, payslips and signing events"
              icon={Activity}
              actions={timeline.length > 12 ? <Badge>{timeline.length} events</Badge> : null}
            >
              <ActivityTimeline events={timeline} loading={docs.isLoading || sigs.isLoading || slips.isLoading} />
            </Card>

            <div className="space-y-6">
              <Card title="Onboarding record" icon={CheckCircle2}>
                <OnboardingChecklist record={record} />
              </Card>
              <Card title="Employment">
                <DefinitionList
                  cols={1}
                  items={[
                    { label: 'Employee ID', value: record.employee_id },
                    { label: 'Position', value: record.position },
                    { label: 'Date of joining', value: formatDate(record.date_of_joining) },
                    { label: 'Client', value: record.client },
                    { label: 'Skills', value: record.skill_set },
                  ]}
                />
              </Card>
            </div>
          </div>

          <SalaryStructureCard employeeId={employeeId} defaults={{ pan: p?.pan_card_no, uan: p?.uan_number, esi: p?.esi_no }} />
        </div>
      )}
      {tab === 'personal' && <PersonalSection record={record} revealIds />}
      {tab === 'bank' && <BankFamilySection record={record} revealIds />}
      {tab === 'career' && <CareerSection record={record} />}
      {tab === 'references' && <ReferencesSection record={record} />}
      {tab === 'documents' && <DocumentsPanel employeeId={employeeId} />}
      {tab === 'payroll' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Link to={`/payroll/run?employee=${employeeId}`}>
              <Button icon={Receipt}>Generate payslip</Button>
            </Link>
          </div>
          <SalaryStructureCard employeeId={employeeId} defaults={{ pan: p?.pan_card_no, uan: p?.uan_number, esi: p?.esi_no }} />
          <PayslipsPanel employeeId={employeeId} canDelete />
        </div>
      )}
      {tab === 'signing' && <SigningTab employeeId={employeeId} />}

      {editing && <EditBasicModal record={record} onClose={() => setEditing(false)} />}
    </div>
  );
}
