/**
 * Everything that has happened to one employee, on one spine.
 *
 * Built entirely from endpoints the 360 page already calls - document dispatch
 * history, signing envelopes and payslips - merged and sorted client side.
 * Read-only, and no new backend route.
 *
 * The events come from three sources with different shapes and, more
 * awkwardly, different clocks: document history and signature timestamps are
 * IST, payslip `uploaded_at` is UTC (see the backend dashboard router). They
 * are only ever compared against each other for ordering, never rendered as a
 * duration, so the skew costs nothing here - but do not compute elapsed time
 * across two sources without fixing that first.
 */
import clsx from 'clsx';
import {
  CheckCircle2,
  FileSignature,
  FileText,
  History,
  PenLine,
  Receipt,
  Send,
  XCircle,
} from 'lucide-react';

import { DOCUMENT_TYPES } from '@/lib/constants';
import { formatDateTime, MONTHS } from '@/lib/format';
import { Badge, EmptyState, Skeleton } from '@/components/ui';

const KIND = {
  document: { icon: FileText, tone: 'bg-brand-50 text-brand-600 ring-brand-100' },
  payslip: { icon: Receipt, tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
  sent: { icon: Send, tone: 'bg-sky-50 text-sky-600 ring-sky-100' },
  signed: { icon: PenLine, tone: 'bg-accent-50 text-accent-600 ring-accent-100' },
  completed: { icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
  failed: { icon: XCircle, tone: 'bg-red-50 text-red-600 ring-red-100' },
  envelope: { icon: FileSignature, tone: 'bg-slate-100 text-slate-500 ring-slate-200' },
};

/** Merge the three sources into one list, newest first. */
export function buildTimeline({ documents = [], signatures = [], payslips = [] }) {
  const events = [];

  documents.forEach((d) => {
    events.push({
      at: d.generated_at,
      kind: 'document',
      title: DOCUMENT_TYPES[d.document_type] || d.document_type_label || d.document_type,
      detail: d.key_details || null,
      by: d.generated_by,
      badge:
        d.email_status === 'sent'
          ? { tone: 'success', label: 'Emailed' }
          : d.email_status === 'failed'
            ? { tone: 'danger', label: 'Email failed' }
            : { tone: 'neutral', label: 'Download only' },
    });
  });

  payslips.forEach((p) => {
    events.push({
      at: p.uploaded_at,
      kind: 'payslip',
      title: `Payslip · ${MONTHS[p.month - 1]} ${p.year}`,
      detail: null,
      by: p.uploaded_by,
      badge: null,
    });
  });

  // One envelope yields up to three events - it is a process, not a moment.
  signatures.forEach((s) => {
    if (s.sent_at) {
      events.push({
        at: s.sent_at,
        kind: 'sent',
        title: 'Signing package sent',
        detail: `${s.document_count} document(s) · ${s.envelope_label}`,
        by: null,
        badge: null,
      });
    }
    if (s.employee_signed_at) {
      events.push({
        at: s.employee_signed_at,
        kind: 'signed',
        title: 'Employee signed with Aadhaar eSign',
        detail: s.envelope_label,
        by: null,
        badge: s.aadhaar_confirmed ? { tone: 'success', label: 'Aadhaar verified' } : { tone: 'neutral', label: 'Not confirmed' },
      });
    }
    if (s.completed_at) {
      events.push({
        at: s.completed_at,
        kind: 'completed',
        title: 'Countersigned and archived',
        detail: s.countersigned_by ? `by ${s.countersigned_by}` : s.envelope_label,
        by: null,
        badge: { tone: 'success', label: 'Complete' },
      });
    }
    if (!s.sent_at && !s.employee_signed_at && !s.completed_at) {
      events.push({
        at: s.created_at,
        kind: s.status === 'failed' ? 'failed' : 'envelope',
        title: s.status === 'failed' ? 'Signing envelope failed' : 'Signing envelope created',
        detail: s.last_error || s.envelope_label,
        by: null,
        badge: null,
      });
    }
  });

  return events
    .filter((e) => e.at)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function ActivityTimeline({ events, loading, limit = 12 }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  if (!events.length) {
    return (
      <EmptyState
        icon={History}
        title="Nothing has happened yet"
        description="Letters, payslips and signing events for this employee will appear here as they happen."
        className="py-10"
      />
    );
  }

  const shown = events.slice(0, limit);

  return (
    <ol className="relative space-y-1">
      {shown.map((e, i) => {
        const cfg = KIND[e.kind] || KIND.envelope;
        const isLast = i === shown.length - 1;
        return (
          <li key={`${e.at}-${e.title}-${i}`} className="relative flex gap-3.5 pb-1">
            {/* Spine, drawn between markers rather than behind them. */}
            {!isLast && (
              <span aria-hidden="true" className="absolute left-[17px] top-9 h-[calc(100%-22px)] w-px bg-slate-200" />
            )}
            <span
              className={clsx(
                'relative z-10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
                cfg.tone,
              )}
            >
              <cfg.icon size={16} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1 pb-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-caption font-semibold text-slate-800">{e.title}</p>
                {e.badge && <Badge tone={e.badge.tone}>{e.badge.label}</Badge>}
              </div>
              {e.detail && <p className="mt-0.5 truncate text-xs text-slate-500">{e.detail}</p>}
              <p className="tabular mt-1 text-xs text-slate-400">
                {formatDateTime(e.at)}
                {e.by ? ` · by ${e.by}` : ''}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
