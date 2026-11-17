/**
 * The employee's own profile hero - the HR 360 header, fed from the endpoints
 * an employee is actually allowed to call.
 *
 * The visual treatment is shared with the HR side (`ProfileHero`), so the two
 * screens stop looking like different products. Only the vitals differ, and
 * they differ for a permissions reason, not a design one:
 *
 *   - Annual CTC is HR-only. `/salary-structure/{id}` is guarded by
 *     `hr_or_superadmin_required`, so an employee asking for it gets a 403.
 *     Rendering a tile that can only ever say "—" would be worse than not
 *     rendering it, so the employee sees Payslips instead - their own payslip
 *     count, from an endpoint they own.
 *   - Documents comes from `/db/generate-sas/{id}`, which scopes an employee
 *     to their own files.
 *   - E-signature comes from `/zoho-sign/status`, the employee's own view of
 *     their envelope.
 *
 * Every query here is read-only and already used elsewhere in the employee
 * screen, so the cache is shared and most of these are free.
 */
import { useQuery } from '@tanstack/react-query';
import { FileSignature, FileStack, FolderOpen } from 'lucide-react';

import { employeesApi, payslipsApi, signingApi } from '@/api';
import { SIGNATURE_STATUS } from '@/lib/constants';
import { MONTHS } from '@/lib/format';
import { ProfileHero } from '@/features/employees/ProfileHero';

/** Signing status as a vital: short label plus the tone that carries urgency. */
export function signingVital(status) {
  if (!status) return { value: '—', sub: null, tone: 'neutral' };
  // `envelope` is whichever of the two envelopes needs attention.
  const env = status.envelope || {};
  if (!env.status) return { value: 'Not started', sub: 'Nothing to sign yet', tone: 'neutral' };

  // One envelope signed, the other still being prepared: not done yet.
  const envs = status.envelopes || [];
  const signedByMe = envs.filter((e) => ['employee_signed', 'completed'].includes(e.status)).length;
  if (envs.length > 1 && signedByMe < envs.length && ['employee_signed', 'completed'].includes(env.status)) {
    return { value: `${signedByMe} of ${envs.length} signed`, sub: 'Other envelope being prepared', tone: 'neutral' };
  }

  const cfg = SIGNATURE_STATUS[env.status];
  const SHORT = {
    completed: { value: 'Signed', tone: 'success' },
    employee_signed: { value: 'Signed', sub: 'Waiting on HR', tone: 'success' },
    sent: { value: 'Action needed', sub: 'Ready for your signature', tone: 'warning' },
    viewed: { value: 'Action needed', sub: 'Opened, not signed', tone: 'warning' },
    declined: { value: 'Declined', tone: 'warning' },
    expired: { value: 'Expired', tone: 'warning' },
    cancelled: { value: 'Cancelled', tone: 'neutral' },
    pending_service: { value: 'Preparing', sub: 'HR is getting it ready', tone: 'neutral' },
    failed: { value: 'Failed', sub: 'HR has been notified', tone: 'danger' },
  };
  const short = SHORT[env.status];
  if (!short) return { value: cfg?.label || env.status, sub: null, tone: cfg?.tone || 'neutral' };
  return {
    value: short.value,
    sub: short.sub ?? (env.document_count ? `${env.document_count} documents` : null),
    tone: short.tone,
  };
}

/* The four groups the SAS endpoint returns. Each is a flat map of
 * key -> { sas_url, ... }, and an absent file is still present as an entry
 * with no sas_url - so presence of the key proves nothing, only the url does.
 * Kept in step with DocumentsPanel, which renders these same four. */
const DOC_GROUPS = ['personal_documents', 'education_certificates', 'experience_documents', 'signed_policy_documents'];

/** How many files this employee can actually open. */
export function countDocuments(data) {
  if (!data) return null;
  return DOC_GROUPS.reduce(
    (n, group) => n + Object.values(data[group] || {}).filter((doc) => doc?.sas_url).length,
    0,
  );
}

export function MyProfileHero({ record, photo, actions, employeeId }) {
  // Same key as DocumentsPanel, so opening My Documents and this page share
  // one fetch instead of each paying for their own.
  const docs = useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: () => employeesApi.documents(employeeId),
    enabled: Boolean(employeeId),
    retry: false,
  });
  const slips = useQuery({
    queryKey: ['payslips', employeeId, ''],
    queryFn: () => payslipsApi.list(employeeId),
    enabled: Boolean(employeeId),
    retry: false,
  });
  const signing = useQuery({
    queryKey: ['signing', 'status'],
    queryFn: signingApi.status,
    enabled: Boolean(employeeId),
    retry: false,
  });

  // A 404 here means "nothing uploaded yet", which is zero, not an error.
  const docCount = docs.isLoading || (docs.isError && docs.error?.status !== 404)
    ? null
    : countDocuments(docs.data) ?? 0;

  const payslips = slips.data?.payslips || [];
  const latest = payslips[0];
  const sig = signingVital(signing.data);

  return (
    <ProfileHero
      record={record}
      photo={photo}
      actions={actions}
      vitals={[
        {
          key: 'docs',
          icon: FolderOpen,
          label: 'My documents',
          value: docCount ?? '—',
          sub: docs.isError && docs.error?.status !== 404 ? 'Could not load' : null,
        },
        {
          key: 'payslips',
          icon: FileStack,
          label: 'Payslips',
          value: slips.isLoading ? '—' : payslips.length,
          sub: latest ? `Latest ${MONTHS[latest.month - 1]} ${latest.year}` : null,
          tone: 'violet',
        },
        {
          key: 'signing',
          icon: FileSignature,
          label: 'E-signature',
          value: signing.isLoading ? '—' : sig.value,
          sub: sig.sub,
          tone: sig.tone,
        },
      ]}
    />
  );
}
