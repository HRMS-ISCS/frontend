/**
 * The HR / Super Admin dashboard.
 *
 * Read top to bottom it answers three questions in order:
 *   1. What needs me?        header summary, KPI tiles, Needs attention, Worklist
 *   2. How is it going?      onboarding funnel, signing pipeline, dispatch
 *   3. Who should I think of? celebrations, stalled joiners, workforce (right side)
 *
 * One request (GET /dashboard/overview) feeds everything except the worklist
 * and celebrations' wish flow, which keep their own existing calls.
 */
import { useQuery } from '@tanstack/react-query';

import { OVERVIEW_QUERY } from '@/features/sidekick/useOverview';
import { useAuth } from '@/lib/auth';
import { Card, ErrorState, Skeleton } from '@/components/ui';
import { useDisplayFont } from '@/features/landing/site/primitives';
import { CelebrationsCard } from '../CelebrationsCard';
import { SidekickCard } from '@/features/sidekick/SidekickCard';
import { DashboardWorklist } from '../Worklist';
import { Attention } from './Attention';
import { DashboardHeader } from './Header';
import { DispatchPanel, FunnelPanel, SignaturePanel, StalledPanel, WorkforcePanel } from './Insights';
import { KpiTiles } from './KpiTiles';

/** A main panel column and a 380px side column that always end level. */
function Row({ main, side }) {
  const column = 'flex min-w-0 flex-col gap-6 [&>:last-child]:flex-1';
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className={column}>{main}</div>
      <div className={column}>{side}</div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[172px]" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Skeleton className="h-44" />
          <Skeleton className="h-72" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-56" />
          <Skeleton className="h-72" />
        </div>
      </div>
    </div>
  );
}

export function OverviewPage() {
  useDisplayFont();
  const { displayName, isSuperadmin } = useAuth();
  // Shared with the sidekick, so both read one cache entry.
  const { data, isLoading, error, refetch, isFetching } = useQuery(OVERVIEW_QUERY);

  if (isLoading) return <OverviewSkeleton />;
  if (error) return <Card><ErrorState error={error} onRetry={refetch} /></Card>;

  const firstName = displayName.split(' ')[0] || 'there';
  const sig = data.signature_status;

  return (
    <div className="space-y-6">
      <DashboardHeader
        firstName={firstName}
        isSuperadmin={isSuperadmin}
        data={data}
        onRefresh={() => refetch()}
        refreshing={isFetching}
      />

      <KpiTiles data={data} />

      {/* Laid out as rows of paired panels rather than two long columns: how
          tall each panel is depends on the data, so two independent columns
          always leave a gap under whichever runs out first. Within a row the
          last panel on each side stretches, so both sides end on one line. */}
      <Row
        main={
          <>
            <Attention block={data.action_required} />
            {/* Needs attention names the categories; the worklist is the rows
                behind them, with the action on each one. */}
            <DashboardWorklist summary={sig} />
          </>
        }
        side={
          <>
            <SidekickCard firstName={firstName} data={data} />
            <CelebrationsCard data={data.celebrations} canSendWishes limit={6} />
          </>
        }
      />

      <Row main={<FunnelPanel funnel={data.onboarding_funnel} />} side={<StalledPanel stuck={data.stuck_employees} />} />

      <Row main={<SignaturePanel signatures={sig} />} side={<WorkforcePanel headcount={data.headcount} gender={data.gender_ratio} />} />

      <DispatchPanel documents={data.document_metrics} />
    </div>
  );
}
