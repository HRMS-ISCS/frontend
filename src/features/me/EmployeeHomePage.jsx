import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowRight, CalendarDays, FileSignature, FileStack, FolderOpen, PartyPopper, UserCircle2 } from 'lucide-react';

import { calendarApi, dashboardApi, onboardingApi, payslipsApi, signingApi } from '@/api';
import { useAuth } from '@/lib/auth';
import { formatDate, greeting, MONTHS } from '@/lib/format';
import { Button, Card, EmptyState, ProgressBar, Skeleton } from '@/components/ui';
import { SignatureStatusBadge } from '@/components/StatusBadges';

function QuickLink({ to, icon: Icon, label, description, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 ring-brand-100',
    violet: 'bg-accent-50 text-accent-600 ring-accent-100',
    success: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    warning: 'bg-amber-50 text-amber-600 ring-amber-100',
  };
  return (
    <Link to={to} className="card card-interactive group flex items-center gap-3.5 p-4">
      <span className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', tones[tone])}>
        <Icon size={19} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-caption font-semibold text-slate-800">{label}</span>
        <span className="mt-0.5 block truncate text-xs text-slate-500">{description}</span>
      </span>
      <ArrowRight size={16} className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
    </Link>
  );
}

export function EmployeeHomePage() {
  const { user, displayName } = useAuth();
  const employeeId = user?.employee_id;
  const year = new Date().getFullYear();

  const progress = useQuery({ queryKey: ['onboarding', 'progress'], queryFn: onboardingApi.progress });
  const me = useQuery({ queryKey: ['celebrations', 'me', 30], queryFn: () => dashboardApi.celebrations({ scope: 'me', window_days: 30 }) });
  const signing = useQuery({ queryKey: ['signing', 'status'], queryFn: signingApi.status, enabled: Boolean(employeeId), retry: false });
  const holidays = useQuery({ queryKey: ['holidays', year], queryFn: () => calendarApi.list(year) });
  const payslips = useQuery({ queryKey: ['payslips', employeeId, ''], queryFn: () => payslipsApi.list(employeeId), enabled: Boolean(employeeId) });

  const today = new Date().toISOString().slice(0, 10);
  const upcomingHolidays = (holidays.data || []).filter((h) => h.date >= today).slice(0, 5);
  const latestPayslip = payslips.data?.payslips?.[0];
  const envelope = signing.data?.envelope;
  const p = progress.data;

  return (
    <div className="space-y-6">
      {/* Greeting hero. Carries the celebration line when there is one - that is
          the single most personal thing this screen can say today. */}
      <div className="relative overflow-hidden rounded-panel bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 px-6 py-7 text-white shadow-raised sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-28 h-44 w-44 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-caption text-brand-100">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="mt-1.5 text-display-lg text-white">
            {greeting()}, {displayName.split(' ')[0]}
          </h1>
          {me.data?.greeting ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-caption font-medium text-white ring-1 ring-inset ring-white/20 backdrop-blur">
              <PartyPopper size={15} /> {me.data.greeting}
            </p>
          ) : (
            <p className="mt-2 text-body text-brand-100/90">Here is what is happening at ISCS today.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {p && !p.is_completed && (
            <Card title="Complete your onboarding" subtitle="A few steps left before your profile is active" elevation="raised">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <span className="text-caption text-slate-600">
                      <span className="tabular font-semibold text-slate-800">{p.last_completed_step}</span> of{' '}
                      <span className="tabular">{p.total_steps}</span> steps done
                    </span>
                    <span className="tabular text-xl font-bold text-brand-600">{p.completion_percentage}%</span>
                  </div>
                  <ProgressBar value={p.completion_percentage} />
                </div>
                <Link to="/onboarding" className="shrink-0">
                  <Button iconRight={ArrowRight}>Continue</Button>
                </Link>
              </div>
            </Card>
          )}

          <Card
            title="Document signing"
            icon={FileSignature}
            actions={envelope?.status && <SignatureStatusBadge status={envelope.status} />}
          >
            {signing.isLoading ? (
              <Skeleton className="h-14" />
            ) : envelope?.exists ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-caption font-semibold text-slate-800">{envelope.envelope_label}</p>
                  <p className="mt-1 text-caption leading-relaxed text-slate-500">{envelope.message}</p>
                </div>
                <Link to="/me/signing" className="shrink-0">
                  <Button variant={envelope.can_sign_now ? 'primary' : 'secondary'} size="sm">
                    {envelope.can_sign_now ? 'Sign now' : 'View status'}
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-body text-slate-500">
                {signing.data?.message || 'Your employment documents will appear here for Aadhaar eSign after onboarding.'}
              </p>
            )}
          </Card>

          <div>
            <p className="eyebrow mb-3">Your workspace</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <QuickLink to="/me/profile" icon={UserCircle2} label="My profile" description="Personal, bank & career details" />
              <QuickLink to="/me/documents" icon={FolderOpen} label="My documents" description="IDs, certificates & contracts" tone="violet" />
              <QuickLink
                to="/me/payslips"
                icon={FileStack}
                label="Payslips"
                description={latestPayslip ? `Latest: ${MONTHS[latestPayslip.month - 1]} ${latestPayslip.year}` : 'View and download'}
                tone="success"
              />
              <QuickLink
                to="/holidays"
                icon={CalendarDays}
                label="Holiday calendar"
                description={`${(holidays.data || []).length} holidays in ${year}`}
                tone="warning"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card title="Upcoming holidays" icon={CalendarDays} flush>
            {holidays.isLoading ? (
              <div className="space-y-2 p-5">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : upcomingHolidays.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No upcoming holidays" className="py-10" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcomingHolidays.map((h) => {
                  const d = new Date(`${h.date}T00:00:00`);
                  return (
                    <li key={h.id} className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-slate-50">
                      <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-b from-orange-50 to-amber-50 text-orange-600 ring-1 ring-inset ring-orange-100">
                        <span className="text-[9.5px] font-bold uppercase tracking-wide">
                          {d.toLocaleDateString('en-IN', { month: 'short' })}
                        </span>
                        <span className="tabular text-[17px] font-bold leading-none">{d.getDate()}</span>
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-caption font-semibold text-slate-800">{h.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {d.toLocaleDateString('en-IN', { weekday: 'long' })} · {formatDate(h.date)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
