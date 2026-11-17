/**
 * The dashboard worklist - the queue, not the count.
 *
 * The cards above this one report numbers and hand you off to another page.
 * This one lists the actual rows behind those numbers and puts the action on
 * the row, so the common case - countersign four packages, chase two people,
 * retry one failure - never leaves the dashboard.
 *
 * Every action here is an existing endpoint that HR can already run from the
 * signature hub (countersign / remind / retry) or the dispatch history
 * (download). Nothing new is reachable from here; it is reachable in fewer
 * clicks.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  BellRing,
  CheckCircle2,
  Download,
  Inbox,
  MailWarning,
  PenLine,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react';

import { documentHistoryApi, signatureAdminApi } from '@/api';
import { openExternal } from '@/lib/api';
import { RESTARTABLE_STATUSES } from '@/lib/constants';
import { formatDate, pluralize } from '@/lib/format';
import { Avatar, Badge, Button, Card, EmptyState, Skeleton, Tabs, useToast } from '@/components/ui';
import { CountersignModal, useInvalidateSignatures } from '@/features/signatures/components';
import { SavingOverlay, SEND_PACKAGE_WAIT } from '@/features/onboarding/SavingOverlay';

/* The dedicated countersign call is authoritative; this wider page is what the
 * chase and fix buckets are drawn from. Envelopes older than this fall off the
 * worklist but stay on the signature hub - the footer says so. */
const SCAN_SIZE = 60;
const BUCKET_LIMIT = 8;

/**
 * Whole days between `iso` and now.
 *
 * Signature timestamps are IST and this runs in the browser's zone, so the two
 * clocks can differ by hours. Whole days is the coarsest useful unit and
 * absorbs that: a package "3 days" old reads the same either way. Never
 * refine this to hours without resolving the timezone first.
 */
export function daysSince(iso) {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - then.getTime()) / 86_400_000));
}

/* Oldest first in every bucket: an inbox is worked from the back of the queue
 * forwards, not from whatever happened most recently. A missing timestamp
 * sorts to the top, which is the safe direction - it gets looked at. */
const byAge = (key) => (a, b) => String(a[key] || '').localeCompare(String(b[key] || ''));

/**
 * Sort the three sources into the four buckets the worklist shows.
 *
 * `awaiting` is the authoritative countersign page from the API. `scanned` is
 * a wider page of recent envelopes that the chase and fix buckets are filtered
 * out of - so `employee_signed` must be excluded from it, or every countersign
 * row would appear twice.
 */
export function buildBuckets({ awaiting = [], scanned = [], emailFailures = [], limit = BUCKET_LIMIT }) {
  const rest = scanned.filter((r) => r.status !== 'employee_signed');
  return {
    countersign: [...awaiting].sort(byAge('employee_signed_at')).slice(0, limit),
    chase: rest.filter((r) => r.status === 'sent' || r.status === 'viewed').sort(byAge('sent_at')).slice(0, limit),
    fix: rest.filter((r) => RESTARTABLE_STATUSES.includes(r.status)).sort(byAge('created_at')).slice(0, limit),
    email: emailFailures.slice(0, limit),
  };
}

/** Older is more urgent, so the chip earns its colour by age alone. */
function AgeChip({ days, noun = 'waiting' }) {
  if (days === null) return null;
  const tone =
    days >= 7 ? 'bg-red-50 text-red-700 ring-red-100'
      : days >= 3 ? 'bg-amber-50 text-amber-700 ring-amber-100'
        : 'bg-slate-100 text-slate-600 ring-slate-200';
  return (
    <span className={clsx('tabular shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset', tone)}>
      {days === 0 ? `today · ${noun}` : `${pluralize(days, 'day')} ${noun}`}
    </span>
  );
}

function Row({ name, id, to, reason, chip, children }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3.5 transition-colors hover:bg-slate-50">
      <Avatar name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {to ? (
            <Link to={to} className="truncate text-caption font-semibold text-slate-800 transition-colors hover:text-brand-600">
              {name}
            </Link>
          ) : (
            <span className="truncate text-caption font-semibold text-slate-800">{name}</span>
          )}
          {chip}
        </div>
        <p className="truncate text-xs text-slate-500">
          {id ? <span className="tabular">{id}</span> : null}
          {id && reason ? ' · ' : null}
          {reason}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </li>
  );
}

export function DashboardWorklist({ summary }) {
  const toast = useToast();
  const invalidate = useInvalidateSignatures();
  const [tab, setTab] = useState('all');
  const [countersigning, setCountersigning] = useState(null);
  const [busy, setBusy] = useState(null);

  /* Keys are prefixed to match the invalidators the rest of the app already
   * fires - `useInvalidateSignatures` drops everything under ['signatures'].
   * Key these anywhere else and a row you just countersigned sits there until
   * the page is reloaded. */
  const awaiting = useQuery({
    queryKey: ['signatures', 'worklist', 'countersign'],
    queryFn: () => signatureAdminApi.list({ awaiting_countersign: 'true', page_size: BUCKET_LIMIT }),
    retry: false,
  });
  const envelopes = useQuery({
    queryKey: ['signatures', 'worklist', 'envelopes'],
    queryFn: () => signatureAdminApi.list({ page_size: SCAN_SIZE }),
    retry: false,
  });
  const emailFailures = useQuery({
    queryKey: ['document-history', 'worklist', 'email-failures'],
    queryFn: () => documentHistoryApi.list({ email_status: 'failed', page_size: BUCKET_LIMIT }),
    retry: false,
  });

  const loading = awaiting.isLoading || envelopes.isLoading || emailFailures.isLoading;

  const buckets = useMemo(
    () =>
      buildBuckets({
        awaiting: awaiting.data?.requests || [],
        scanned: envelopes.data?.requests || [],
        emailFailures: emailFailures.data?.documents || [],
      }),
    [awaiting.data, envelopes.data, emailFailures.data],
  );

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
    }
  };

  const download = async (row) => {
    setBusy(`dl:${row.id}`);
    try {
      openExternal((await documentHistoryApi.download(row.id)).download_url);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(null);
    }
  };

  const total = Object.values(buckets).reduce((n, list) => n + list.length, 0);

  if (loading) {
    return (
      <Card title="Worklist" icon={Inbox}>
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
        </div>
      </Card>
    );
  }

  if (!total) {
    return (
      <Card title="Worklist" icon={Inbox}>
        <EmptyState
          icon={CheckCircle2}
          title="Your queue is empty"
          description="No packages waiting on your countersign, nobody overdue to sign, no failed sends. Nothing here needs you right now."
          className="py-8"
        />
      </Card>
    );
  }

  const tabs = [
    { id: 'all', label: 'All', count: total },
    { id: 'countersign', label: 'Countersign', count: buckets.countersign.length },
    { id: 'chase', label: 'Chase', count: buckets.chase.length },
    { id: 'fix', label: 'Fix', count: buckets.fix.length },
    { id: 'email', label: 'Email failed', count: buckets.email.length },
  ].filter((t) => t.count > 0);

  /* Clearing the last row in a bucket removes its tab. Fall back to All rather
   * than leaving the user staring at a filter that no longer exists. */
  const active = tabs.some((t) => t.id === tab) ? tab : 'all';
  const show = (key) => active === 'all' || active === key;
  const s = summary?.envelope || {};

  return (
    <>
      <Card
        title="Worklist"
        subtitle="The rows behind the numbers — act without leaving this page"
        icon={Inbox}
        elevation="raised"
        flush
        actions={<Tabs variant="pill" tabs={tabs} value={active} onChange={setTab} />}
      >
        <ul className="divide-y divide-slate-100">
          {show('countersign') &&
            buckets.countersign.map((r) => (
              <Row
                key={`cs:${r.id}`}
                name={r.employee_name || r.employee_id}
                id={r.employee_id}
                to={`/employees/${r.employee_id}`}
                reason={`Signed by employee · ${pluralize(r.document_count || 0, 'document')}`}
                chip={<AgeChip days={daysSince(r.employee_signed_at)} noun="on you" />}
              >
                <Button size="sm" icon={PenLine} onClick={() => setCountersigning(r)}>
                  Countersign
                </Button>
              </Row>
            ))}

          {show('chase') &&
            buckets.chase.map((r) => (
              <Row
                key={`ch:${r.id}`}
                name={r.employee_name || r.employee_id}
                id={r.employee_id}
                to={`/employees/${r.employee_id}`}
                reason={r.status === 'viewed' ? 'Opened the package but has not signed' : `Sent ${formatDate(r.sent_at)} · not opened yet`}
                chip={<AgeChip days={daysSince(r.sent_at)} />}
              >
                <Button
                  size="sm"
                  variant="secondary"
                  icon={BellRing}
                  loading={busy === `remind:${r.id}`}
                  onClick={() => run(`remind:${r.id}`, () => signatureAdminApi.remind(r.id), 'Reminder sent')}
                >
                  Remind
                </Button>
              </Row>
            ))}

          {show('fix') &&
            buckets.fix.map((r) => (
              <Row
                key={`fx:${r.id}`}
                name={r.employee_name || r.employee_id}
                id={r.employee_id}
                to={`/employees/${r.employee_id}`}
                reason={r.last_error || `Envelope ${r.status.replace('_', ' ')}`}
                chip={<Badge tone={r.status === 'failed' ? 'danger' : 'warning'}>{r.status.replace('_', ' ')}</Badge>}
              >
                <Button
                  size="sm"
                  variant="secondary"
                  icon={RotateCcw}
                  loading={busy === `retry:${r.id}`}
                  onClick={() => run(`retry:${r.id}`, () => signatureAdminApi.retry(r.id), 'Retry started')}
                >
                  {r.status === 'pending_service' ? 'Send' : 'Retry'}
                </Button>
              </Row>
            ))}

          {show('email') &&
            buckets.email.map((d) => (
              <Row
                key={`em:${d.id}`}
                name={d.recipient_name || d.employee_id || 'Candidate'}
                id={d.employee_id}
                to={d.employee_id ? `/employees/${d.employee_id}` : null}
                reason={`${d.document_type_label} · delivery to ${d.to_emails || 'recipient'} failed`}
                chip={<Badge tone="danger">Email failed</Badge>}
              >
                {/* There is no resend endpoint. Handing over the archived PDF
                    is the real recovery: send it manually and move on. */}
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Download}
                  disabled={!d.has_archive}
                  loading={busy === `dl:${d.id}`}
                  onClick={() => download(d)}
                  title={d.has_archive ? 'Download the archived copy to send manually' : d.archive_error || 'No archived copy'}
                >
                  Download
                </Button>
              </Row>
            ))}
        </ul>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <Link to="/signatures" className="font-semibold text-brand-600 transition-colors hover:text-brand-700">
            Signature hub
          </Link>
          <Link to="/documents/history?email_status=failed" className="font-semibold text-brand-600 transition-colors hover:text-brand-700">
            Document dispatch history
          </Link>
          {/* The buckets are capped, and the fix/chase ones are drawn from a
              scan of recent envelopes - so say when there is more behind. */}
          {(s.retryable > buckets.fix.length || s.pending_candidate_otp > buckets.chase.length) && (
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <TriangleAlert size={12} />
              Showing the oldest few — the hub has the full list
            </span>
          )}
          {emailFailures.isError && (
            <span className="inline-flex items-center gap-1.5 text-amber-600">
              <MailWarning size={12} /> Could not load email failures
            </span>
          )}
        </div>
      </Card>

      {countersigning && <CountersignModal request={countersigning} onClose={() => setCountersigning(null)} />}
      {/* Send / Retry builds and uploads the whole package before replying. */}
      <SavingOverlay show={Boolean(busy?.startsWith('retry:'))} {...SEND_PACKAGE_WAIT} />
    </>
  );
}
