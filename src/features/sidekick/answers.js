/**
 * The sidekick's answers - pure functions of the dashboard overview payload.
 *
 * No AI and no extra requests: every sentence is built from numbers the
 * dashboard already loaded, so an answer can never claim more than the data
 * says. Each answer carries the actions that resolve it, so the sidekick moves
 * HR to the fix instead of only describing the problem.
 *
 * Answer shape:
 *   { lines: string[], actions: Action[], tone?: 'ok' | 'attention' }
 * Action:
 *   { label, to }            - navigate within the portal
 *   { label, wish: item }    - open the "send wishes" dialog for a celebration
 */
import { pluralize } from '@/lib/format';
import { QUIPS } from './quips';

const countersignOf = (d) => d?.signature_status?.awaiting_countersign_total ?? 0;
const stuckOf = (d) => d?.stuck_employees?.total_stuck ?? 0;
const emailFailuresOf = (d) => d?.document_metrics?.delivery_health?.emails_failed ?? 0;

function celebrationsOf(d) {
  const c = d?.celebrations || {};
  return [
    ...(c.upcoming_birthdays || []).map((b) => ({ ...b, kind: 'birthday' })),
    ...(c.upcoming_anniversaries || []).map((a) => ({ ...a, kind: 'anniversary' })),
  ].sort((a, b) => a.days_until - b.days_until);
}

const occasion = (item) =>
  item.kind === 'birthday' ? 'birthday' : `${pluralize(item.years_completed, 'year')} at ISCS`;

/** Counts the unread badge and the greeting both lean on. */
export function attentionCounts(d) {
  return {
    countersign: countersignOf(d),
    stuck: stuckOf(d),
    emailFailures: emailFailuresOf(d),
    celebrationsToday: celebrationsOf(d).filter((c) => c.is_today).length,
  };
}

/* ------------------------------------------------------------- Topics */

function today(d) {
  const { countersign, stuck: stalled, emailFailures } = attentionCounts(d);
  const lines = [];
  const actions = [];

  if (countersign) {
    lines.push(`${pluralize(countersign, 'employee')} ${countersign === 1 ? 'is' : 'are'} waiting on your countersign.`);
    actions.push({ label: 'Countersign now', to: '/signatures' });
  }
  if (stalled) {
    lines.push(`${pluralize(stalled, 'person', 'people')} ${stalled === 1 ? 'is' : 'are'} paused in onboarding.`);
    actions.push({ label: 'Open onboarding tracker', to: '/onboarding-tracker' });
  }
  if (emailFailures) {
    lines.push(`${pluralize(emailFailures, 'email')} failed to deliver.`);
    actions.push({ label: 'Review failed emails', to: '/documents/history?email_status=failed' });
  }
  const todays = celebrationsOf(d).filter((c) => c.is_today);
  todays.forEach((c) => {
    lines.push(`It's ${c.name}'s ${occasion(c)} today.`);
    actions.push({ label: `Wish ${c.name.split(' ')[0]}`, wish: c });
  });

  const other = (d?.action_required?.items || []).filter(
    (i) => !/stuck|countersign|email/i.test(`${i.type} ${i.message}`),
  );
  other.forEach((i) => lines.push(i.message));

  if (!lines.length) {
    return { tone: 'ok', lines: ['Nothing needs you right now. Signatures, onboarding and email delivery are all clear.'], actions: [] };
  }
  return { tone: 'attention', lines, actions };
}

function stuck(d) {
  const s = d?.stuck_employees || {};
  const rows = s.top_stuck || [];
  if (!s.total_stuck) {
    return { tone: 'ok', lines: ['Nobody is stuck. Every active onboarding is moving.'], actions: [] };
  }
  const summary = Object.entries(s.urgency_summary || {})
    .filter(([, n]) => n)
    .map(([level, n]) => `${n} ${level.toLowerCase()}`)
    .join(', ');
  const lines = [`${pluralize(s.total_stuck, 'person', 'people')} paused${summary ? ` (${summary} urgency)` : ''}. Longest idle first:`];
  const shown = rows.slice(0, 4);
  shown.forEach((r) => {
    const idle = r.days_inactive > 0 ? `${r.days_inactive}d idle` : `${r.hours_inactive}h idle`;
    lines.push(`• ${r.name || 'Unnamed'}: ${r.current_step_name} · ${idle}`);
  });
  if (s.total_stuck > shown.length) lines.push(`…and ${s.total_stuck - shown.length} more.`);
  return { tone: 'attention', lines, actions: [{ label: 'Open onboarding tracker', to: '/onboarding-tracker' }] };
}

function celebrations(d) {
  const soon = celebrationsOf(d).filter((c) => c.days_until <= 7);
  if (!soon.length) {
    return { tone: 'ok', lines: ['No birthdays or work anniversaries in the next 7 days.'], actions: [] };
  }
  const lines = soon.slice(0, 5).map((c) =>
    `• ${c.name}: ${occasion(c)}, ${c.is_today ? 'today' : `in ${pluralize(c.days_until, 'day')} (${c.day_and_month})`}`,
  );
  const actions = soon
    .filter((c) => c.is_today)
    .slice(0, 3)
    .map((c) => ({ label: `Wish ${c.name.split(' ')[0]}`, wish: c }));
  return { tone: 'ok', lines: ['Coming up this week:', ...lines], actions };
}

function email(d) {
  const docs = d?.document_metrics;
  const h = docs?.delivery_health || {};
  if (!docs?.available) {
    return { tone: 'ok', lines: ['Document delivery data is not available right now.'], actions: [] };
  }
  if (!h.emails_failed) {
    return {
      tone: 'ok',
      lines: [
        `No failed emails. ${h.success_rate_percentage ?? 100}% of ${pluralize(h.emails_attempted ?? 0, 'email')} delivered.`,
        `${pluralize(docs.total_this_month ?? 0, 'document')} issued this month.`,
      ],
      actions: [{ label: 'Open dispatch history', to: '/documents/history' }],
    };
  }
  return {
    tone: 'attention',
    lines: [
      `${pluralize(h.emails_failed, 'email')} failed to deliver.`,
      'The archived PDF is kept, so you can download it and send it yourself.',
    ],
    actions: [{ label: 'Review failed emails', to: '/documents/history?email_status=failed' }],
  };
}

function signing(d) {
  const s = d?.signature_status;
  if (!s?.available) {
    return { tone: 'ok', lines: [s?.message || 'Signing status is not available right now.'], actions: [] };
  }
  const e = s.envelope || {};
  const inFlight = (e.pending_candidate_otp ?? 0) + (e.awaiting_hr_countersign ?? 0) + (e.completed ?? 0) + (e.failed ?? 0) + (e.retryable ?? 0);
  if (!inFlight) {
    return { tone: 'ok', lines: ['No signing packages yet.'], actions: [{ label: 'Open signature hub', to: '/signatures' }] };
  }
  const lines = [
    `• With employees (waiting for Aadhaar OTP): ${e.pending_candidate_otp ?? 0}`,
    `• Waiting on your countersign: ${e.awaiting_hr_countersign ?? 0}`,
    `• Completed: ${e.completed ?? 0}`,
  ];
  if (e.failed || e.retryable) lines.push(`• Needs a retry: ${(e.failed ?? 0) + (e.retryable ?? 0)}`);
  const actions = [
    e.awaiting_hr_countersign ? { label: 'Countersign now', to: '/signatures' } : { label: 'Open signature hub', to: '/signatures' },
  ];
  return {
    tone: e.awaiting_hr_countersign || e.failed ? 'attention' : 'ok',
    lines: [`Completion rate ${e.completion_rate_percentage ?? 0}%.`, ...lines],
    actions,
  };
}

function onboarding(d) {
  const f = d?.onboarding_funnel;
  if (!f) return { tone: 'ok', lines: ['Onboarding data is not available right now.'], actions: [] };
  const lines = [
    `${Math.round(f.completion_rate_percentage ?? 0)}% complete: ${f.completed_count ?? 0} done, ${f.in_progress_count ?? 0} in progress, ${f.not_started_count ?? 0} not started.`,
  ];
  const worst = f.biggest_drop_off_step;
  if (worst?.active_count) lines.push(`Most joiners are waiting at ${worst.step_label} (${worst.active_count}).`);
  return { tone: 'ok', lines, actions: [{ label: 'Open onboarding tracker', to: '/onboarding-tracker' }] };
}

function onboardingSteps(d) {
  const steps = d?.onboarding_funnel?.step_breakdown || [];
  const waiting = steps.filter((s) => s.active_count);
  if (!waiting.length) {
    return { tone: 'ok', lines: ['Nobody is part-way through onboarding right now.'], actions: [] };
  }
  return {
    tone: 'ok',
    lines: ['People currently at each step:', ...waiting.map((s) => `• Step ${s.step}, ${s.step_name}: ${s.active_count}`)],
    actions: [{ label: 'Open onboarding tracker', to: '/onboarding-tracker' }],
  };
}

function headcount(d) {
  const h = d?.headcount;
  if (!h) return { tone: 'ok', lines: ['Headcount is not available right now.'], actions: [] };
  const lines = [
    `${pluralize(h.total_employees ?? 0, 'employee')} in total.`,
    `• Internal (ISCSI): ${h.internal_employees ?? 0} (${h.internal_percentage ?? 0}%)`,
    `• External (ISCSE): ${h.external_employees ?? 0} (${h.external_percentage ?? 0}%)`,
  ];
  const g = d?.gender_ratio;
  if (g?.total_profiles) lines.push(`Gender, from ${pluralize(g.total_profiles, 'profile')}: male ${g.male_percentage}%, female ${g.female_percentage}%.`);
  if (h.unclassified_employees) {
    lines.push(`${pluralize(h.unclassified_employees, 'employee')} ${h.unclassified_employees === 1 ? 'has' : 'have'} an ID outside the ISCSI/ISCSE pattern.`);
  }
  return { tone: h.unclassified_employees ? 'attention' : 'ok', lines, actions: [{ label: 'Open employees', to: '/employees' }] };
}

function aadhaar(d) {
  const a = d?.signature_status?.aadhaar;
  if (!a?.available || !a.signed_total) {
    return { tone: 'ok', lines: ['No signed packages to check for Aadhaar yet.'], actions: [] };
  }
  return {
    tone: a.compliant ? 'ok' : 'attention',
    lines: [`${a.compliance_rate_percentage}% of ${pluralize(a.signed_total, 'signed package')} verified with Aadhaar.`, a.message].filter(Boolean),
    actions: [{ label: 'Open signature hub', to: '/signatures' }],
  };
}

function documents(d) {
  const docs = d?.document_metrics;
  if (!docs?.available) return { tone: 'ok', lines: ['Document data is not available right now.'], actions: [] };
  const types = (docs.by_type || []).filter((t) => t.this_month);
  return {
    tone: 'ok',
    lines: [
      `${pluralize(docs.total_this_month ?? 0, 'document')} issued this month${docs.total_all_time != null ? `, ${docs.total_all_time} all time` : ''}.`,
      ...types.map((t) => `• ${t.label}: ${t.this_month}`),
    ],
    actions: [
      { label: 'Generate a letter', to: '/letters/proposed-offer' },
      { label: 'Open dispatch history', to: '/documents/history' },
    ],
  };
}

function celebrationsMonth(d) {
  const all = celebrationsOf(d);
  if (!all.length) {
    return { tone: 'ok', lines: ['No birthdays or work anniversaries in the next 30 days.'], actions: [] };
  }
  return {
    tone: 'ok',
    lines: [
      `${pluralize(all.length, 'celebration')} in the next 30 days:`,
      ...all.slice(0, 8).map((c) => `• ${c.name}: ${occasion(c)}, ${c.is_today ? 'today' : c.day_and_month}`),
      ...(all.length > 8 ? [`…and ${all.length - 8} more.`] : []),
    ],
    actions: all.filter((c) => c.is_today).slice(0, 3).map((c) => ({ label: `Wish ${c.name.split(' ')[0]}`, wish: c })),
  };
}

/* ------------------------------------------------------------ Guides
 * How-to answers. They describe what the portal's pages do today; keep them
 * in step with those pages. */

const guide = (lines, actions) => () => ({ tone: 'ok', lines, actions });

const letterGuide = guide(
  [
    'Letter Generation has four official templates. Pick one below.',
    'Autofill from the employee record, or type the details for a candidate. For offer and appointment letters the salary annexure is calculated from the CTC as you type.',
    'Send with To, CC and BCC. Every letter is archived in Document Dispatch History.',
  ],
  [
    { label: 'Proposed offer', to: '/letters/proposed-offer' },
    { label: 'Appointment', to: '/letters/appointment' },
    { label: 'NDA', to: '/letters/nda' },
    { label: 'Relieving & experience', to: '/letters/relieving' },
  ],
);

const payrollGuide = guide(
  [
    '1. Salary Structures: set each employee\'s annual CTC. Revisions are versioned and never change past payslips.',
    '2. Payslip Generator: pick the month and run one employee or the whole company. Earnings are prorated by paid days; deductions (PF, PT, TDS) are not. Payslips can be emailed to employees as they are generated.',
    '3. Already have PDFs? Publish them in Payslip Uploads, one at a time or as a ZIP named by employee ID and month.',
  ],
  [
    { label: 'Salary structures', to: '/payroll/salary' },
    { label: 'Payslip generator', to: '/payroll/run' },
    { label: 'Payslip uploads', to: '/payroll/uploads' },
  ],
);

const userGuide = guide(
  [
    'Users & Access creates login accounts and sets each person\'s role.',
    'Leave "Email a password setup link" on (recommended): they get a one-time link, valid for 24 hours, to set their own password. Turn it off to set a password yourself (at least 8 characters).',
  ],
  [{ label: 'Open users & access', to: '/admin/users' }],
);

const signingGuide = guide(
  [
    'The joining pack goes out as two Zoho Sign envelopes: the appointment letter on its own, and the NDA with the policies and declaration.',
    'The employee signs each envelope with its own Aadhaar OTP. You then countersign each from the signature hub or the dashboard worklist, and the sealed copies are filed automatically. Signing is complete when both are.',
  ],
  [{ label: 'Open signature hub', to: '/signatures' }],
);

const joke = () => ({ tone: 'ok', lines: [QUIPS[Math.floor(Math.random() * QUIPS.length)]], actions: [] });

/* The topics HR can tap, in two groups. `fun` topics only appear with Fun mode on. */
export const TOPIC_GROUPS = [
  { id: 'status', label: 'Today' },
  { id: 'guide', label: 'How do I…' },
];

export const TOPICS = [
  { id: 'today', group: 'status', label: 'What needs me today?', answer: today },
  { id: 'stuck', group: 'status', label: "Who's stuck in onboarding?", answer: stuck },
  { id: 'steps', group: 'status', label: 'Where are joiners waiting?', answer: onboardingSteps },
  { id: 'onboarding', group: 'status', label: 'Onboarding progress', answer: onboarding },
  { id: 'signing', group: 'status', label: 'Signing status', answer: signing },
  { id: 'aadhaar', group: 'status', label: 'Aadhaar compliance', answer: aadhaar },
  { id: 'celebrations', group: 'status', label: 'Birthdays this week', answer: celebrations },
  { id: 'month', group: 'status', label: 'Celebrations this month', answer: celebrationsMonth },
  { id: 'headcount', group: 'status', label: 'Headcount', answer: headcount },
  { id: 'documents', group: 'status', label: 'Documents this month', answer: documents },
  { id: 'email', group: 'status', label: 'Email failures', answer: email },
  { id: 'joke', group: 'status', label: 'Tell me a joke', fun: true, answer: joke },
  { id: 'how-letter', group: 'guide', label: 'Issue a letter', answer: letterGuide },
  { id: 'how-payroll', group: 'guide', label: 'Run payroll', answer: payrollGuide },
  { id: 'how-signing', group: 'guide', label: 'Send documents for signature', answer: signingGuide },
  { id: 'how-user', group: 'guide', label: 'Add a user', answer: userGuide },
];

export function answerFor(topicId, data) {
  const topic = TOPICS.find((t) => t.id === topicId);
  return topic ? topic.answer(data) : null;
}

/** The opening message: a greeting plus today's answer, so the first thing HR sees is useful. */
export function openingFor(data) {
  return today(data);
}
