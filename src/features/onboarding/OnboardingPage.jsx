import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Check, LifeBuoy, Lock, LogOut } from 'lucide-react';

import { employeesApi, onboardingApi } from '@/api';
import { useAuth } from '@/lib/auth';
import { ONBOARDING_STEPS } from '@/lib/constants';
import { Button, ErrorState, PageLoader, ProgressBar } from '@/components/ui';
import { BrandLogo } from '@/components/BrandLogo';
import { EmployeeSigningPanel } from '@/features/signing/EmployeeSigningPanel';
import { HelpDeskModal } from '@/features/help/HelpDeskForm';
import { Step1Basic } from './steps/Step1Basic';
import { Step2Personal } from './steps/Step2Personal';
import { Step3Background } from './steps/Step3Background';
import { Step4Experience } from './steps/Step4Experience';
import { Step5References } from './steps/Step5References';

function Stepper({ active, progress, onSelect }) {
  const unlocked = new Set(progress?.unlocked_steps || [1]);
  const lastCompleted = progress?.last_completed_step || 0;

  return (
    <ol className="relative space-y-0.5">
      {ONBOARDING_STEPS.map(({ step, title, description }, index) => {
        const done = step <= lastCompleted;
        const isActive = step === active;
        const reachable = unlocked.has(step) || step <= lastCompleted + 1;
        const isLast = index === ONBOARDING_STEPS.length - 1;
        return (
          <li key={step} className="relative">
            {/* Connector runs between the markers, coloured up to the last
                completed step so progress is legible without reading text. */}
            {!isLast && (
              <span
                aria-hidden="true"
                className={clsx(
                  'absolute left-[27px] top-[42px] h-[calc(100%-26px)] w-0.5 rounded-full transition-colors',
                  done ? 'bg-emerald-400' : 'bg-slate-200',
                )}
              />
            )}
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onSelect(step)}
              className={clsx(
                'relative flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left transition-all',
                isActive ? 'bg-brand-50 ring-1 ring-inset ring-brand-100' : reachable ? 'hover:bg-slate-100' : 'cursor-not-allowed opacity-55',
              )}
            >
              <span
                className={clsx(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-all',
                  done && !isActive && 'bg-emerald-500 text-white',
                  isActive && 'bg-brand-600 text-white ring-4 ring-brand-100',
                  !done && !isActive && 'bg-white text-slate-400 ring-1 ring-slate-300',
                )}
              >
                {done && !isActive ? <Check size={15} strokeWidth={3} /> : !reachable ? <Lock size={12} /> : step}
              </span>
              <span className="min-w-0">
                <span className={clsx('block text-caption font-semibold', isActive ? 'text-brand-700' : 'text-slate-800')}>
                  {title}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">{description}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, displayName, logout } = useAuth();
  const employeeId = user?.employee_id;

  const progressQuery = useQuery({ queryKey: ['onboarding', 'progress'], queryFn: onboardingApi.progress });
  const recordQuery = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeesApi.get(employeeId),
    enabled: Boolean(employeeId),
  });

  const [active, setActive] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  // Step we just advanced to while the saved data reloads in the background;
  // null once the reload has landed.
  const [advancedTo, setAdvancedTo] = useState(null);
  const refreshRun = useRef(0);

  useEffect(() => {
    if (active === null && progressQuery.data) {
      const p = progressQuery.data;
      setActive(p.is_completed ? 6 : Math.min(Math.max(p.last_completed_step + 1, 1), 6));
    }
  }, [active, progressQuery.data]);

  const goTo = (step) => {
    setActive(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSaved = async (step) => {
    await onboardingApi.updateProgress(step, true);
    const next = Math.min(step + 1, 6);

    // Move on straight away and reload in the background. The next step only
    // needs its own data, which the save just now did not change.
    const run = ++refreshRun.current;
    setAdvancedTo(next);
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'progress'] }),
      queryClient.invalidateQueries({ queryKey: ['employee'] }),
      queryClient.invalidateQueries({ queryKey: ['employee-documents'] }),
    ]).finally(() => {
      if (refreshRun.current === run) setAdvancedTo(null);
    });
    goTo(next);
  };

  const progress = progressQuery.data;
  const record = recordQuery.data;
  // Going to any OTHER step (e.g. Back) before the reload lands would open it
  // with the old record, so wait for the fresh one in that case only.
  const awaitingFreshRecord = advancedTo !== null && active !== advancedTo;
  const loading =
    progressQuery.isLoading || (employeeId && recordQuery.isLoading) || active === null || awaitingFreshRecord;

  const stepProps = {
    employeeId,
    record,
    onSaved,
    onBack: active > 1 ? () => goTo(active - 1) : undefined,
  };

  const needsRecord = active > 1 && !employeeId;
  const pct = progress?.completion_percentage ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-8">
          <BrandLogo className="h-10" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-caption font-semibold text-slate-800">
              Welcome to ISCS, {displayName.split(' ')[0] || 'there'}
            </p>
            <p className="text-xs text-slate-500">Complete your onboarding</p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button variant="secondary" size="sm" icon={LifeBuoy} onClick={() => setHelpOpen(true)}>
              Help
            </Button>
            {progress?.is_completed && (
              <Button variant="secondary" size="sm" onClick={() => navigate('/home')}>
                Go to home
              </Button>
            )}
            <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
        {/* Hairline progress across the whole header - always visible, costs no space. */}
        <div className="h-0.5 w-full bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 sm:px-8 sm:py-8 lg:grid-cols-[300px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-4">
            <div className="px-3 pb-4 pt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-caption font-semibold text-slate-800">Your progress</span>
                <span className="tabular text-xl font-bold text-brand-600">{pct}%</span>
              </div>
              <ProgressBar value={pct} className="mt-2.5" />
            </div>
            <Stepper active={active} progress={progress} onSelect={goTo} />
          </div>
        </aside>

        <main className="min-w-0">
          {progressQuery.error ? (
            <div className="card">
              <ErrorState error={progressQuery.error} onRetry={progressQuery.refetch} />
            </div>
          ) : loading ? (
            <PageLoader />
          ) : needsRecord ? (
            <div className="card">
              <ErrorState
                title="Complete Step 1 first"
                error={{ message: 'Your basic details are needed before continuing.' }}
                onRetry={() => goTo(1)}
              />
            </div>
          ) : (
            <>
              {active === 1 && <Step1Basic key={`s1-${employeeId}`} {...stepProps} />}
              {active === 2 && <Step2Personal key={`s2-${employeeId}`} {...stepProps} />}
              {active === 3 && <Step3Background key={`s3-${employeeId}`} {...stepProps} />}
              {active === 4 && <Step4Experience key={`s4-${employeeId}`} {...stepProps} />}
              {active === 5 && <Step5References key={`s5-${employeeId}`} {...stepProps} />}
              {active === 6 && (
                <div className="space-y-5">
                  <div>
                    <p className="text-micro font-semibold uppercase text-brand-600">Step 6 of 6</p>
                    <h2 className="mt-1.5 text-display-sm text-slate-900">Declaration &amp; document signing</h2>
                    <p className="mt-1.5 text-body text-slate-500">
                      Sign your employment documents securely with Aadhaar eSign via Zoho Sign.
                    </p>
                  </div>
                  <EmployeeSigningPanel
                    employeeId={employeeId}
                    employeeName={record?.name}
                    hasDeclaration={Boolean(record?.declaration)}
                    onFinish={() => navigate('/home', { replace: true })}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <HelpDeskModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        context={active ? `Onboarding Step ${active} — ${ONBOARDING_STEPS.find((s) => s.step === active)?.title || ''}` : 'Onboarding'}
        defaultCategory={active === 6 ? 'Document signing' : 'Onboarding'}
      />
    </div>
  );
}
