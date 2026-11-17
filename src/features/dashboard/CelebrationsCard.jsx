import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cake, CheckCircle2, Mail, PartyPopper, Trophy } from 'lucide-react';

import { dashboardApi } from '@/api';
import { ApiError } from '@/lib/api';
import { Alert, Avatar, Badge, Button, Card, EmptyState, Modal, Skeleton, Textarea, useToast } from '@/components/ui';
import { EmailChips } from '@/components/EmailRecipients';

const keyOf = (item) => `${item.kind}-${item.employee_id}-${item.date}`;

export function WishModal({ item, onClose, onSent }) {
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [cc, setCc] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [alreadySent, setAlreadySent] = useState(false);

  const isBirthday = item.kind === 'birthday';
  const years = item.years_completed;

  const send = async (force) => {
    setSending(true);
    setError(null);
    try {
      const res = await dashboardApi.sendWish({
        employee_id: item.employee_id,
        occasion: item.kind,
        personal_message: message.trim() || undefined,
        cc_emails: cc,
        force,
      });
      toast.success(res.message, 'Wishes sent');
      onSent(item);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setAlreadySent(true);
      setError(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open
      onClose={sending ? undefined : onClose}
      title={isBirthday ? 'Send birthday wishes' : 'Send work anniversary wishes'}
      description={`${item.name} · ${isBirthday ? 'Birthday' : `${years} year${years === 1 ? '' : 's'} at ISCS`} ${item.is_today ? 'today' : `on ${item.day_and_month}`}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button icon={Mail} loading={sending} onClick={() => send(alreadySent)}>
            {alreadySent ? 'Send again' : 'Send wishes'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="info" icon={Mail}>
          A formal {isBirthday ? 'birthday' : 'work anniversary'} email is sent to {item.name} from HR &amp; Operations,
          signed with your name.
          {!item.is_today && ' Since the date is still upcoming, it is worded as an advance wish.'}
        </Alert>
        {error && (
          <Alert tone={alreadySent ? 'warning' : 'danger'} title={alreadySent ? 'Already sent' : 'Could not send'}>
            {error.message}
          </Alert>
        )}
        <Textarea
          label="Personal note (optional)"
          rows={4}
          maxLength={1000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isBirthday ? 'e.g. Have a wonderful day with your family!' : 'e.g. Thank you for everything you brought to the team this year.'}
          hint="Added as its own paragraph in the email."
        />
        <EmailChips label="CC (optional)" value={cc} onChange={setCc} placeholder="manager@iscstech.co.in" />
      </div>
    </Modal>
  );
}

/**
 * Birthdays & work anniversaries.
 *   data          - pre-fetched payload (e.g. from /dashboard/overview)
 *   scope         - 'all' | 'me' when fetching itself
 *   canSendWishes - show "Send wishes" (HR / Superadmin)
 */
export function CelebrationsCard({ data: provided, scope = 'all', windowDays = 30, canSendWishes = false, limit = 8 }) {
  const [target, setTarget] = useState(null);
  const [sent, setSent] = useState(() => new Set());

  const { data: fetched, isLoading } = useQuery({
    queryKey: ['celebrations', scope, windowDays],
    queryFn: () => dashboardApi.celebrations({ scope, window_days: windowDays }),
    enabled: !provided,
  });
  const data = provided || fetched;

  const items = data
    ? [
        ...(data.upcoming_birthdays || []).map((b) => ({ ...b, kind: 'birthday' })),
        ...(data.upcoming_anniversaries || []).map((a) => ({ ...a, kind: 'anniversary' })),
      ].sort((a, b) => a.days_until - b.days_until)
    : [];

  return (
    <Card title="Celebrations" subtitle={`Birthdays & work anniversaries · next ${windowDays} days`} icon={PartyPopper} flush>
      {isLoading && !provided ? (
        <div className="space-y-3 p-5">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Cake} title="Nothing coming up" description={`No birthdays or work anniversaries in the next ${windowDays} days.`} />
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.slice(0, limit).map((item) => {
            const isBirthday = item.kind === 'birthday';
            const done = sent.has(keyOf(item));
            return (
              <li key={keyOf(item)} className="flex items-center gap-3 px-5 py-3">
                <span className="relative">
                  <Avatar name={item.name} size="md" />
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-white">
                    {isBirthday ? <Cake size={13} className="text-rose-500" /> : <Trophy size={13} className="text-amber-500" />}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {isBirthday ? 'Birthday' : `${item.years_completed} year${item.years_completed === 1 ? '' : 's'} at ISCS`} ·{' '}
                    {item.day_and_month}
                  </p>
                </div>
                {item.is_today ? <Badge tone="success">Today</Badge> : <span className="text-xs text-slate-500">in {item.days_until}d</span>}
                {canSendWishes &&
                  (done ? (
                    <Badge tone="success" icon={CheckCircle2}>
                      Sent
                    </Badge>
                  ) : (
                    <Button variant="secondary" size="sm" icon={Mail} onClick={() => setTarget(item)}>
                      Wish
                    </Button>
                  ))}
              </li>
            );
          })}
        </ul>
      )}
      {target && (
        <WishModal
          item={target}
          onClose={() => setTarget(null)}
          onSent={(item) => {
            setSent((prev) => new Set(prev).add(keyOf(item)));
            setTarget(null);
          }}
        />
      )}
    </Card>
  );
}
