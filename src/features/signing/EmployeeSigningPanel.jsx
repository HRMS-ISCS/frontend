/**
 * Step 6 signing - Zoho Sign ONLY.
 *
 * Two envelopes go out together: the appointment letter on its own, and the
 * NDA with the company policies and the declaration. The employee signs each
 * with its own Aadhaar OTP inside Zoho's embedded window. The screen always
 * works on the envelope that needs attention (`status.envelope`), so once the
 * first is signed it moves straight on to the second. Signing is complete
 * only when both are.
 *
 * Rules enforced here:
 *  1. We never collect the Aadhaar number - it is typed into Zoho's iframe.
 *  2. embed_url is single use: fetched fresh on every open, never cached.
 *  3. pending_service is not an error - HR has not generated the contracts yet,
 *     onboarding can still finish.
 *  4. The declaration is saved with sign_policies=false, so no font-rendered
 *     "signatures" are created. Zoho applies the only signature.
 *  5. Employees never get download links to signed documents.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  Fingerprint,
  HelpCircle,
  Hourglass,
  Lock,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import { onboardingApi, signingApi } from '@/api';
import { ApiError } from '@/lib/api';
import { ZOHO_EMBED_HOST } from '@/lib/constants';
import { formatDateTime, todayISO } from '@/lib/format';
import { usePolling } from '@/lib/hooks';
import { Alert, Button, Card, Checkbox, Input, PageLoader, Spinner, useToast } from '@/components/ui';
import { SignatureStatusBadge } from '@/components/StatusBadges';
import { SavingOverlay } from '@/features/onboarding/SavingOverlay';
import {
  DocumentList,
  EnvelopeTracker,
  HowToSignSteps,
  ReadyToSignModal,
  SignedModal,
  SigningHelp,
  SigningProgress,
} from './SigningGuide';

const POLL_ACTIVE = 6000;
const POLL_PASSIVE = 30000;
// The envelope is built in the background after /start returns, typically in
// a few seconds. Check often while that happens so the screen moves on as
// soon as it is ready, instead of sitting on "preparing" for a full 6s tick.
const POLL_PREPARING = 1500;

export const DECLARATION_TEXT = `I hereby declare that the information furnished by me in this employment application and in all supporting documents is true, complete and correct to the best of my knowledge and belief.

I understand that any misrepresentation, omission or falsification of the information provided may result in the withdrawal of an offer of employment, or in termination of employment if discovered after joining.

I confirm that I have read and understood the Company's policies made available to me, including the Employee Handbook, the Code of Business Ethics and Conduct, the Anti-Bribery and Anti-Corruption Policy, the Information Security Policy, the Diversity and Equal Opportunities Policy, the Operational Risk Management Policy and the Secure Development Policy, and I agree to comply with them.

I authorise ISCS Technologies Private Limited to verify the information provided by me from any source it considers appropriate.`;

function deriveStage(envelope) {
  if (!envelope || !envelope.exists) return 'NO_ENVELOPE';
  if (envelope.can_sign_now) return 'SIGNABLE';
  switch (envelope.status) {
    case 'employee_signed':
      return 'SIGNED_AWAITING_HR';
    case 'completed':
      return 'COMPLETE';
    case 'pending_service':
      return 'PENDING_SERVICE';
    case 'declined':
    case 'expired':
    case 'cancelled':
      return 'BLOCKED_SOFT';
    case 'failed':
      return 'BLOCKED_HARD';
    default:
      return 'PREPARING';
  }
}

/* ------------------------------------------------------ Declaration ----- */
function DeclarationForm({ employeeId, defaultName, onDone }) {
  const [name, setName] = useState(defaultName || '');
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const today = useMemo(() => todayISO(), []);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onboardingApi.createDeclaration(employeeId, {
        name: name.trim(),
        date_of_declaration: today,
        declaration_text: DECLARATION_TEXT,
        // Zoho Sign is the only signature. Never font-sign the policy PDFs.
        sign_policies: false,
      });
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && /already exists/i.test(err.message)) {
        onDone();
        return;
      }
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <SavingOverlay
      show={saving}
      title="Saving your declaration…"
      message="Preparing your declaration for signing. This can take a few seconds."
    />
    <Card
      title="Employee declaration"
      subtitle="Confirm your declaration. It is signed together with your NDA and company policies."
      icon={FileText}
      footer={
        <>
          <span className="mr-auto text-xs text-slate-500">Dated {today}</span>
          <Button onClick={submit} loading={saving} disabled={!agreed || name.trim().length < 3}>
            Confirm declaration
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="max-h-64 overflow-y-auto whitespace-pre-line rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 scrollbar-thin">
          {DECLARATION_TEXT}
        </div>
        <Input
          label="Full name as on Aadhaar"
          value={name}
          onChange={(e) => setName(e.target.value)}
          hint="Must match the name on your Aadhaar for the eSign to succeed."
          fieldClassName="max-w-md"
        />
        <Checkbox
          checked={agreed}
          onChange={setAgreed}
          label="I have read the declaration above and confirm that the information I have provided is true and complete."
        />
        {error && <Alert tone="danger" title="Could not save your declaration">{error.message}</Alert>}
      </div>
    </Card>
    </>
  );
}

/* -------------------------------------------------------- Frame -------- */
function SigningFrame({ embedUrl, onRefresh, refreshing }) {
  const [loaded, setLoaded] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const hostMismatch = ZOHO_EMBED_HOST && origin && origin !== ZOHO_EMBED_HOST;

  useEffect(() => {
    setLoaded(false);
    setFrameKey((k) => k + 1);
  }, [embedUrl]);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
        <span className="flex items-center gap-2 text-caption font-medium text-slate-600">
          <Lock size={14} className="text-emerald-600" />
          Secure signing window · Zoho Sign (India data centre)
        </span>
        <Button variant="secondary" size="sm" icon={RefreshCw} loading={refreshing} onClick={onRefresh}>
          Reload window
        </Button>
      </div>
      {hostMismatch && (
        <div className="px-5 pt-4">
          <Alert tone="warning" title="Signing window may not display here">
            Zoho only renders the embedded signing window on <strong>{ZOHO_EMBED_HOST}</strong>. You are viewing
            this portal from <strong>{origin}</strong>, so the frame below may stay blank.
          </Alert>
        </div>
      )}
      <div className="relative">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white text-sm text-slate-500">
            <Spinner size={28} />
            Opening your documents…
          </div>
        )}
        {/* No sandbox: Zoho's signing flow needs scripts, forms, popups and storage. */}
        <iframe
          key={frameKey}
          src={embedUrl}
          title="Sign your onboarding documents"
          onLoad={() => setLoaded(true)}
          allow="camera; microphone; clipboard-write"
          // Zoho's signature pop-up needs ~750px or its Ok button is clipped.
          className="block h-[78vh] min-h-[760px] w-full border-0"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------ Status hero ---- */
const STAGE_UI = {
  NO_ENVELOPE: { icon: FileText, tone: 'bg-slate-100 text-slate-500', title: 'Your documents are ready to be opened' },
  PREPARING: { icon: Hourglass, tone: 'bg-sky-50 text-sky-600', title: 'Preparing your signing session' },
  SIGNABLE: { icon: Fingerprint, tone: 'bg-brand-50 text-brand-600', title: 'Sign with Aadhaar eSign' },
  // The title for SIGNABLE names the envelope; see the panel below.
  PENDING_SERVICE: { icon: Clock, tone: 'bg-sky-50 text-sky-600', title: 'Your documents are being prepared' },
  SIGNED_AWAITING_HR: { icon: FileCheck2, tone: 'bg-emerald-50 text-emerald-600', title: "You're done — thank you" },
  COMPLETE: { icon: ShieldCheck, tone: 'bg-emerald-50 text-emerald-600', title: 'All documents are signed' },
  BLOCKED_SOFT: { icon: XCircle, tone: 'bg-amber-50 text-amber-600', title: 'This signing request is no longer active' },
  BLOCKED_HARD: { icon: XCircle, tone: 'bg-red-50 text-red-600', title: 'We could not complete your signing request' },
};

function stageMessage(stage, envelope, count) {
  switch (stage) {
    case 'NO_ENVELOPE':
      return 'Open your documents to review and sign them: your appointment letter, then your NDA with the company policies and declaration.';
    case 'PREPARING':
      return 'This usually takes a few seconds. The page updates automatically.';
    case 'SIGNABLE':
      return `Click "Start signing" for your ${envelope?.envelope_label || 'documents'} (${count || ''} document(s)). A secure Zoho Sign window opens on this page — follow the 4 steps shown beside it. Keep your Aadhaar-linked mobile nearby: one OTP signs this envelope.`;
    case 'PENDING_SERVICE':
      return `HR is finalising your ${envelope?.envelope_label || 'documents'}. Nothing is needed from you right now — you will be able to sign as soon as it is ready, and your onboarding is not held up by this.`;
    case 'SIGNED_AWAITING_HR':
      return "You have signed. Your documents are now with the company's authorised signatory for counter-signature.";
    case 'COMPLETE':
      return 'Both envelopes have been signed by you and the company, and securely archived.';
    case 'BLOCKED_SOFT':
      return envelope?.message || 'Please contact HR so a new signing request can be issued.';
    case 'BLOCKED_HARD':
      return `Please contact HR quoting reference #${envelope?.signature_request_id}.`;
    default:
      return '';
  }
}

/* ----------------------------------------------------------- Panel ------ */
export function EmployeeSigningPanel({ employeeId, employeeName, hasDeclaration: initialHasDeclaration, onFinish, finishLabel = 'Finish onboarding' }) {
  const queryClient = useQueryClient();
  const [hasDeclaration, setHasDeclaration] = useState(Boolean(initialHasDeclaration));
  const [booting, setBooting] = useState(true);
  // `envelope` is the one needing attention; `envelopes` is both, for the tracker.
  const [envelope, setEnvelope] = useState(null);
  const [envelopes, setEnvelopes] = useState([]);
  const [embedUrl, setEmbedUrl] = useState(null);
  const [starting, setStarting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [actionError, setActionError] = useState(null);
  const startedRef = useRef(false);
  const toast = useToast();
  const [readyOpen, setReadyOpen] = useState(false);
  const [signedOpen, setSignedOpen] = useState(false);
  const readyShownRef = useRef(false);
  const prevStageRef = useRef(null);
  const frameRef = useRef(null);
  const prevEnvelopeIdRef = useRef(null);

  useEffect(() => setHasDeclaration(Boolean(initialHasDeclaration)), [initialHasDeclaration]);

  // Takes a /status (or /start) response: both envelopes plus the one to act on.
  const applyStatus = (res) => {
    setEnvelope(res?.envelope || null);
    setEnvelopes(res?.envelopes || []);
  };

  useEffect(() => {
    let cancelled = false;
    signingApi
      .status()
      .then((res) => !cancelled && applyStatus(res))
      .catch(() => {})
      .finally(() => !cancelled && setBooting(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const applySession = (result) => {
    setEmbedUrl(result.embed_url || null);
    const merge = (prev) => ({
      ...(prev || {}),
      exists: true,
      signature_request_id: result.signature_request_id,
      envelope_type: result.envelope_type,
      envelope_label: result.envelope_label,
      status: result.status,
      status_label: result.status_label,
      documents: result.documents,
      document_count: result.document_count,
      can_sign_now: result.can_sign_now,
      message: result.message,
    });
    setEnvelope(merge);
    setEnvelopes((list) => list.map((env) => (env.envelope_type === result.envelope_type ? merge(env) : env)));
  };

  const startSigning = useCallback(async () => {
    setStarting(true);
    setActionError(null);
    try {
      // Mark step 6 first so progress is right even if Zoho parks the envelopes.
      await onboardingApi.updateProgress(6, true).catch(() => {});
      applyStatus(await signingApi.start());
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'progress'] });
    } catch (err) {
      setActionError(err);
    } finally {
      setStarting(false);
    }
  }, [queryClient]);

  const refreshSession = useCallback(async () => {
    setRefreshing(true);
    setActionError(null);
    try {
      applySession(await signingApi.session(envelope?.envelope_type));
    } catch (err) {
      setActionError(err);
    } finally {
      setRefreshing(false);
    }
  }, [envelope?.envelope_type]);

  // Auto-open exactly once when a declaration exists and no envelope does.
  useEffect(() => {
    if (booting || !hasDeclaration || startedRef.current || envelope?.exists) return;
    startedRef.current = true;
    startSigning();
  }, [booting, hasDeclaration, envelope, startSigning]);

  const stage = deriveStage(envelope);

  usePolling(
    async () => {
      try {
        const res = await signingApi.status();
        if (res?.envelope) applyStatus(res);
      } catch {
        /* next tick retries */
      }
    },
    stage === 'PREPARING'
      ? POLL_PREPARING
      : stage === 'SIGNABLE'
        ? POLL_ACTIVE
        : stage === 'SIGNED_AWAITING_HR'
          ? POLL_PASSIVE
          : null,
  );

  // Drop a single-use URL as soon as signing is no longer possible.
  useEffect(() => {
    if (stage !== 'SIGNABLE' && embedUrl) setEmbedUrl(null);
  }, [stage, embedUrl]);

  // The first envelope was signed and the screen moved on to the second: its
  // URL belongs to the first, so drop it and offer the next one.
  const envelopeId = envelope?.signature_request_id ?? null;
  useEffect(() => {
    const prev = prevEnvelopeIdRef.current;
    prevEnvelopeIdRef.current = envelopeId;
    if (prev == null || envelopeId == null || prev === envelopeId) return;
    setEmbedUrl(null);
    const previous = envelopes.find((env) => env.signature_request_id === prev);
    const previousSigned = ['employee_signed', 'completed'].includes(previous?.status);
    if (previousSigned && envelope?.can_sign_now) {
      toast.success(`Signed. Next: your ${envelope.envelope_label}.`, 'One down, one to go');
      setReadyOpen(true);
    }
  }, [envelopeId, envelope, envelopes, toast]);

  // Envelopes the employee still has to sign, for the "signed" pop-up.
  const remaining = envelopes.filter((env) => !['employee_signed', 'completed'].includes(env.status)).length;
  const totalCount = envelopes.reduce((sum, env) => sum + (env.document_count || 0), 0);

  // Pop-ups and toasts when the stage changes, so the employee is told what
  // happened instead of having to notice a badge changing colour.
  useEffect(() => {
    if (booting || !hasDeclaration) return;
    const prev = prevStageRef.current;
    prevStageRef.current = stage;
    if (prev === stage) return;

    if (stage === 'SIGNABLE') {
      if (prev) toast.success('Your documents are ready. Click "Start signing" to begin.', 'Ready to sign');
      if (!readyShownRef.current) {
        readyShownRef.current = true;
        setReadyOpen(true);
      }
      return;
    }
    if (!prev) return; // first look at the page: no "change" to announce

    if (prev === 'SIGNABLE' && (stage === 'SIGNED_AWAITING_HR' || stage === 'COMPLETE')) {
      setReadyOpen(false);
      setSignedOpen(true);
      toast.success('Your signature has been recorded.', 'Signed');
    } else if (stage === 'PENDING_SERVICE') {
      toast.info('HR is still preparing your appointment letter and NDA. You can sign as soon as they are ready.', 'Not ready yet');
    } else if (stage === 'BLOCKED_SOFT' || stage === 'BLOCKED_HARD') {
      toast.error('This signing request is no longer active. Please contact HR.', 'Signing stopped');
    }
  }, [booting, hasDeclaration, stage, toast]);

  // Bring the signing window into view as soon as it opens.
  useEffect(() => {
    if (embedUrl) frameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [embedUrl]);

  const beginSigning = async () => {
    if (!embedUrl) await refreshSession();
    setReadyOpen(false);
    // The frame may already be open; scroll to it either way.
    frameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const finish = async () => {
    setFinishing(true);
    setActionError(null);
    try {
      await onboardingApi.complete().catch((err) => {
        if (err instanceof ApiError && err.status === 400) throw err;
      });
      await queryClient.invalidateQueries({ queryKey: ['onboarding', 'progress'] });
      onFinish?.();
    } catch (err) {
      setActionError(err);
    } finally {
      setFinishing(false);
    }
  };

  if (booting) return <PageLoader label="Checking your signing status…" />;

  if (!hasDeclaration) {
    return (
      <div className="space-y-5">
        <SigningProgress stage={stage} hasDeclaration={false} />
        <Alert tone="info" icon={Fingerprint} title="Two envelopes, one Aadhaar OTP each">
          After you confirm your declaration, two secure Zoho Sign envelopes are prepared: your appointment letter, and
          your NDA with the company policies and this declaration. Keep your Aadhaar-registered mobile nearby.
        </Alert>
        <DeclarationForm
          employeeId={employeeId}
          defaultName={employeeName}
          onDone={() => {
            setHasDeclaration(true);
            startedRef.current = true;
            startSigning();
          }}
        />
      </div>
    );
  }

  const ui = STAGE_UI[stage];
  const documents = envelope?.documents || [];
  const count = envelope?.document_count || documents.length;

  return (
    <div className="space-y-5">
      <SigningProgress stage={stage} hasDeclaration />

      <EnvelopeTracker envelopes={envelopes} activeId={envelope?.signature_request_id} />

      <div className="card-raised p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className={clsx('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-black/5', ui.tone)}>
            {starting ? <Spinner /> : <ui.icon size={24} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-display-sm text-slate-900">
                {starting
                  ? 'Opening your documents…'
                  : stage === 'SIGNABLE' && envelope?.envelope_label
                    ? `Sign your ${envelope.envelope_label}`
                    : ui.title}
              </h3>
              {envelope?.status && <SignatureStatusBadge status={envelope.status} />}
            </div>
            <p className="mt-2 max-w-3xl text-body leading-relaxed text-slate-600">{stageMessage(stage, envelope, count)}</p>
            {envelope?.completed_at && (
              <p className="mt-2 text-xs text-slate-500">Completed {formatDateTime(envelope.completed_at)}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {stage === 'NO_ENVELOPE' && (
                <Button icon={ExternalLink} loading={starting} onClick={startSigning}>
                  Open my documents
                </Button>
              )}
              {stage === 'SIGNABLE' && !embedUrl && (
                <Button className="px-6 py-3 text-base" icon={Fingerprint} loading={refreshing} onClick={beginSigning}>
                  Start signing
                </Button>
              )}
              {stage === 'SIGNABLE' && (
                <Button variant="secondary" className={embedUrl ? undefined : 'px-5 py-3 text-base'} icon={HelpCircle} onClick={() => setReadyOpen(true)}>
                  How to sign
                </Button>
              )}
              {stage === 'PENDING_SERVICE' && (
                <Button variant="secondary" icon={RefreshCw} loading={refreshing} onClick={refreshSession}>
                  Check again
                </Button>
              )}
              {onFinish && ['PENDING_SERVICE', 'SIGNED_AWAITING_HR', 'COMPLETE', 'BLOCKED_SOFT', 'BLOCKED_HARD'].includes(stage) && (
                <Button icon={CheckCircle2} loading={finishing} onClick={finish}>
                  {finishLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
        {actionError && (
          <Alert tone="danger" className="mt-5" title="Something went wrong">
            {actionError.message}
          </Alert>
        )}
      </div>

      {/* The signing window sits right under the status card, with the steps
          and help beside it, so nobody has to scroll to find it. */}
      {stage === 'SIGNABLE' && embedUrl && (
        <div ref={frameRef} className="grid scroll-mt-6 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <SigningFrame embedUrl={embedUrl} onRefresh={refreshSession} refreshing={refreshing} />
          <div className="space-y-5">
            <div className="card p-5">
              <p className="mb-3 text-sm font-semibold text-slate-800">How to sign</p>
              <HowToSignSteps compact />
            </div>
            <SigningHelp />
          </div>
        </div>
      )}

      {/* Folded while the signing window is open; Zoho shows every page anyway. */}
      <DocumentList key={embedUrl ? 'signing' : 'idle'} documents={documents} count={count} defaultOpen={!embedUrl} />

      {(stage === 'SIGNABLE' || stage === 'PREPARING') && (
        <p className="text-center text-xs text-slate-500">This page updates automatically once you have signed.</p>
      )}

      <ReadyToSignModal
        open={readyOpen && stage === 'SIGNABLE'}
        count={count}
        label={envelope?.envelope_label}
        employeeName={employeeName}
        starting={refreshing}
        onStart={beginSigning}
        onClose={() => setReadyOpen(false)}
      />
      <SignedModal
        open={signedOpen}
        count={totalCount || count}
        remaining={remaining}
        completed={stage === 'COMPLETE'}
        onClose={() => setSignedOpen(false)}
        onFinish={onFinish ? finish : undefined}
        finishLabel={finishLabel}
        finishing={finishing}
      />
    </div>
  );
}
