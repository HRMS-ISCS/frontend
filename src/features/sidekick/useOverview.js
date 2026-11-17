/**
 * The dashboard overview, shared by the dashboard page and the sidekick.
 *
 * One query key and one set of parameters, so both read the same cache entry:
 * opening the sidekick on another page reuses what the dashboard already
 * fetched, and a dashboard refresh updates the sidekick too.
 */
import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from '@/api';

export const OVERVIEW_QUERY = {
  queryKey: ['dashboard', 'overview'],
  queryFn: () => dashboardApi.overview({ stuck_limit: 8, celebration_window_days: 30 }),
};

export function useOverview({ enabled = true } = {}) {
  return useQuery({ ...OVERVIEW_QUERY, enabled, staleTime: 60_000 });
}
