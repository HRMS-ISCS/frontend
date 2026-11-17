import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  Ban,
  BellRing,
  CheckCircle2,
  Download,
  FileCheck2,
  FileSignature,
  Lock,
  PenLine,
  RefreshCw,
  RotateCcw,
  Send,
  XCircle,
} from 'lucide-react';

import { signatureAdminApi } from '@/api';
import { openExternal } from '@/lib/api';
import { OPEN_STATUSES, RESTARTABLE_STATUSES, ZOHO_EMBED_HOST } from '@/lib/constants';
import { formatBytes, formatDateTime } from '@/lib/format';
import { usePolling } from '@/lib/hooks';
import { Alert, Button, ConfirmDialog, EmptyState, Menu, Modal, Spinner, useToast } from '@/components/ui';
import { EmployeePicker } from '@/components/EmployeePicker';
import { SignatureStatusBadge } from '@/components/StatusBadges';
import { SavingOverlay, SEND_PACKAGE_WAIT } from '@/features/onboarding/SavingOverlay';
import { CountersignDone, CountersignIntro, CountersignStepsBar, introSkipped } from './CountersignGuide';

export function useInvalidateSignatures() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['signatures'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);
}

/* ------------------------------------------------------ Countersign ----- */
export function CountersignModal({ request, onClose }) {
  const toast = useToast();
  const invalidate = useInvalidateSignatures();
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const hostMismatch = window.location.origin !== ZOHO_EMBED_HOST;
  // intro -> signing -> done. The intro is skippable per browser.
  const [phase, setPhase] = useState(() => (introSkipped() ? 'signing' : 'intro'));
  const [confirmClose, setConfirmClose] = useState(false);

  const requestClose = () => {
    if (phase === 'signing' && session?.embed_url) setConfirmClose(true);
    else onClose();
  };

  const open = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoaded(false);
    try {
      setSession(await signatureAdminApi.countersign(request.id));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [request.id]);

  // Embed links are single use and short lived, so only fetch one once HR
  // has read the intro and is actually starting.
  useEffect(() => {
    if (phase === 'signing') open();
  }, [phase, open]);

  usePolling(
    async () => {
      try {
        const latest = await signatureAdminApi.get(request.id);
        if (latest.status === 'completed') {
          toast.success(`${latest.employee_name}'s documents are fully signed and archived.`, 'Countersigned');
          invalidate();
          setConfirmClose(false);
          setPhase('done');
        }
      } catch {
        /* keep polling */
      }
    },
    phase === 'signing' && session?.embed_url ? 5000 : null,
  );

  return (
    <>
    <Modal
      open
      onClose={requestClose}
      size="full"
      title="Company counter-signature"
      description={`${request.employee_name || request.employee_id} · ${request.document_count} documents`}
      bodyClassName="p-0"
    >
      {phase === 'intro' ? (
        <CountersignIntro request={request} onStart={() => setPhase('signing')} />
      ) : phase === 'done' ? (
        <CountersignDone request={request} onClose={onClose} />
      ) : loading ? (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-sm text-slate-500">
          <Spinner size={28} /> Opening the signing window…
        </div>
      ) : error ? (
        <div className="p-6">
          <Alert tone="danger" title="Could not open the countersign window" action={<Button size="sm" variant="secondary" onClick={open}>Retry</Button>}>
            {error.message}
          </Alert>
        </div>
      ) : !session?.embed_url ? (
        <div className="p-6">
          <Alert tone="success" icon={CheckCircle2}>{session?.message}</Alert>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-6 py-2.5 text-sm text-slate-600">
            <span className="flex items-center gap-2"><Lock size={14} className="text-emerald-600" /> {session.message}</span>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={open}>Reload</Button>
          </div>
          <CountersignStepsBar />
          {hostMismatch && (
            <div className="px-6 pt-4">
              <Alert tone="warning">Zoho only renders this window on {ZOHO_EMBED_HOST}. It may stay blank on {window.location.origin}.</Alert>
            </div>
          )}
          <div className="relative">
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <Spinner size={28} />
              </div>
            )}
            <iframe
              key={session.embed_url}
              src={session.embed_url}
              title="Countersign documents"
              onLoad={() => setLoaded(true)}
              // Fill the modal (92vh minus its header and the bar above), but
              // never shorter than Zoho's signature pop-up, or its Ok button is
              // clipped. On short screens the modal body scrolls instead.
              className="block h-[calc(92vh-126px)] min-h-[760px] w-full border-0"
            />
          </div>
        </div>
      )}
    </Modal>
    <ConfirmDialog
      open={confirmClose}
      onClose={() => setConfirmClose(false)}
      onConfirm={onClose}
      title="Stop countersigning?"
      message="The package is not countersigned yet. If you close now you can continue later with the Countersign button, but anything entered in the signing window is lost."
      confirmLabel="Close anyway"
    />
    </>
  );
}

/* ---------------------------------------------------- Signed documents -- */
export function SignedDocumentsModal({ request, onClose }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['signatures', 'documents', request.id],
    queryFn: () => signatureAdminApi.documents(request.id),
    staleTime: 0,
    gcTime: 0,
  });

  const Artefact = ({ link, icon: Icon, description }) =>
    link ? (
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800">{link.label}</p>
          <p className="text-xs text-slate-500">
            {description} · {formatBytes(link.file_size_bytes)} · link valid {link.expires_in_minutes} min
          </p>
        </div>
        <Button size="sm" icon={Download} onClick={() => openExternal(link.download_url)}>
          Open
        </Button>
      </div>
    ) : null;

  return (
    <Modal open onClose={onClose} size="lg" title="Signed documents" description={`${request.employee_name || request.employee_id} · HR & Superadmin only`}>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : error ? (
        <Alert tone="danger" action={<Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>}>{error.message}</Alert>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{data.message}</p>
          <Artefact link={data.signed_bundle} icon={FileCheck2} description="Sealed PDF with both signatures" />
          <Artefact link={data.completion_certificate} icon={FileSignature} description="Audit trail with Aadhaar transaction reference" />
          {data.documents_in_bundle?.length > 0 && (
            <div>
              <p className="mb-2 eyebrow">Documents in this package</p>
              <ol className="list-inside list-decimal space-y-1 text-sm text-slate-600">
                {data.documents_in_bundle.map((d) => <li key={d}>{d.replace(/\.pdf$/i, '')}</li>)}
              </ol>
            </div>
          )}
          <p className="text-xs text-slate-500">Completed {formatDateTime(data.completed_at)}. Download links expire quickly on purpose — these are legal documents.</p>
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------- Send envelope -- */
export function SendEnvelopeModal({ employeeId: presetId, onClose }) {
  const toast = useToast();
  const invalidate = useInvalidateSignatures();
  const [employeeId, setEmployeeId] = useState(presetId || null);
  const [sending, setSending] = useState(false);

  const readiness = useQuery({
    queryKey: ['signatures', 'readiness', employeeId],
    queryFn: () => signatureAdminApi.readiness(employeeId),
    enabled: Boolean(employeeId),
    staleTime: 0,
  });
  // Two envelopes: the appointment letter alone, and the NDA with the
  // policies and declaration. Each is sent - and signed - on its own.
  const envelopes = readiness.data?.envelopes || [];
  const isAlreadyOpen = (r) => r.existing_status && (OPEN_STATUSES.includes(r.existing_status) || r.existing_status === 'completed');
  const sendable = envelopes.filter((r) => r.ready && !isAlreadyOpen(r));

  const send = async (types) => {
    setSending(true);
    try {
      for (const type of types) {
        const res = await signatureAdminApi.send(employeeId, type);
        for (const item of res.results || []) {
          if (['sent', 'viewed', 'employee_signed', 'completed'].includes(item.status)) toast.success(item.message, 'Envelope sent');
          else toast.info(item.message, item.status_label);
        }
      }
      invalidate();
      onClose();
    } catch (err) {
      toast.error(err);
      invalidate();
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open
      onClose={sending ? undefined : onClose}
      size="lg"
      title="Send envelopes for signing"
      description="Two envelopes, each signed with its own Aadhaar OTP and costing one eSign credit: the appointment letter, and the NDA with company policies and declaration."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button icon={Send} onClick={() => send(sendable.map((r) => r.envelope_type))} loading={sending} disabled={!sendable.length}>
            {sendable.length === 2 ? 'Send both envelopes' : 'Send for signature'}
          </Button>
        </>
      }
    >
      <SavingOverlay show={sending} {...SEND_PACKAGE_WAIT} />
      <div className="space-y-5">
        {!presetId && <EmployeePicker label="Employee" value={employeeId} onChange={(id) => setEmployeeId(id)} />}
        {readiness.isLoading && <div className="flex justify-center py-6"><Spinner /></div>}
        {readiness.error && <Alert tone="danger">{readiness.error.message}</Alert>}
        {envelopes.map((r) => {
          const alreadyOpen = isAlreadyOpen(r);
          return (
            <div key={r.envelope_type} className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">{r.envelope_label}</p>
                {r.ready && !alreadyOpen && (
                  <Button size="sm" variant="secondary" icon={Send} disabled={sending} onClick={() => send([r.envelope_type])}>
                    Send this one
                  </Button>
                )}
              </div>
              <Alert tone={alreadyOpen ? 'info' : r.ready ? 'success' : 'warning'}>{r.message}</Alert>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(r.documents).map(([name, present]) => (
                  <div key={name} className={clsx('flex items-center gap-2 rounded-lg border px-3 py-2 text-sm', present ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50')}>
                    {present ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-amber-500" />}
                    <span className="truncate text-slate-700">{name.replace(/\.pdf$/i, '')}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                {r.document_count} of {r.expected_document_count} documents present.
              </p>
            </div>
          );
        })}
        {envelopes.length > 0 && (
          <p className="text-xs text-slate-500">
            Missing policies do not block sending. The appointment letter and NDA do — generate them from HR Letters.
          </p>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------ Row actions ----- */
export function RequestActions({ request, onCountersign, onDocuments, compact }) {
  const toast = useToast();
  const invalidate = useInvalidateSignatures();
  const [busy, setBusy] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const run = async (key, fn, fallback) => {
    setBusy(key);
    try {
      const res = await fn();
      toast.success(res?.message || fallback);
      invalidate();
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(null);
      setConfirmCancel(false);
    }
  };

  const isOpen = OPEN_STATUSES.includes(request.status);
  const restartable = RESTARTABLE_STATUSES.includes(request.status);

  return (
    <div className="flex items-center justify-end gap-1.5">
      {/* Send / Retry builds and uploads the whole package before replying. */}
      <SavingOverlay show={busy === 'retry'} {...SEND_PACKAGE_WAIT} />
      {request.status === 'employee_signed' && (
        <Button size="sm" icon={PenLine} onClick={() => onCountersign(request)}>
          Countersign
        </Button>
      )}
      {request.status === 'completed' && (
        <Button size="sm" variant="secondary" icon={Download} onClick={() => onDocuments(request)}>
          {compact ? 'Docs' : 'Documents'}
        </Button>
      )}
      {restartable && (
        <Button size="sm" variant="secondary" icon={RotateCcw} loading={busy === 'retry'} onClick={() => run('retry', () => signatureAdminApi.retry(request.id), 'Retry started')}>
          {request.status === 'pending_service' ? 'Send' : 'Retry'}
        </Button>
      )}
      {busy && busy !== 'retry' && <Spinner size={16} />}
      <Menu
        items={[
          { label: 'Sync from Zoho', icon: RefreshCw, onClick: () => run('sync', () => signatureAdminApi.sync(request.id), 'Synced') },
          isOpen && { label: 'Send reminder', icon: BellRing, onClick: () => run('remind', () => signatureAdminApi.remind(request.id), 'Reminder sent') },
          request.status !== 'completed' && request.status !== 'cancelled' && { divider: true, key: 'd' },
          request.status !== 'completed' &&
            request.status !== 'cancelled' && { label: 'Cancel envelope', icon: Ban, danger: true, onClick: () => setConfirmCancel(true) },
        ]}
      />
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        loading={busy === 'cancel'}
        onConfirm={() => run('cancel', () => signatureAdminApi.cancel(request.id), 'Envelope cancelled')}
        title="Cancel this signing envelope?"
        message="The envelope is recalled in Zoho and marked cancelled. The history is kept; use Retry to issue a fresh package."
        confirmLabel="Cancel envelope"
      />
    </div>
  );
}

export function RequestSummary({ request }) {
  return (
    <div className="min-w-0 space-y-1">
      <SignatureStatusBadge status={request.status} />
      {request.last_error && request.status !== 'completed' && (
        <span className="block max-w-[240px] truncate text-xs text-slate-500" title={request.last_error}>
          {request.last_error}
        </span>
      )}
    </div>
  );
}

export function EmptySignatures() {
  return <EmptyState icon={FileSignature} title="No signing envelopes" description="Envelopes appear here once an employee reaches Step 6 or HR sends a package." />;
}
