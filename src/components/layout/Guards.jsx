import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldOff } from 'lucide-react';

import { onboardingApi } from '@/api';
import { useAuth } from '@/lib/auth';
import { EmptyState, PageLoader } from '@/components/ui';
import { homePathFor } from './navigation';

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <PageLoader label="Loading your workspace…" />;
  if (status !== 'authenticated') {
    // The bare address is the front door: a signed-out visitor sees the landing
    // page and signs in from there. Any deeper link still goes straight to
    // sign-in and remembers where it was headed.
    if (location.pathname === '/') return <Navigate to="/welcome" replace />;
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

export function PublicOnly({ children }) {
  const { status, role } = useAuth();
  if (status === 'loading') return <PageLoader />;
  if (status === 'authenticated') return <Navigate to={homePathFor(role)} replace />;
  return children;
}

export function RequireRole({ roles, children }) {
  const { role, status } = useAuth();
  // Every RequireRole currently sits inside RequireAuth, which already holds
  // the tree on a loader while the profile resolves - so this branch should
  // not be reachable today. It is here so the guard stands on its own: without
  // it, `roles.includes(undefined)` is false and a user who DOES have access
  // gets the denial screen the moment one is ever mounted outside RequireAuth.
  if (status === 'loading') return <PageLoader />;
  if (!roles.includes(role)) {
    return (
      <EmptyState
        icon={ShieldOff}
        title="You do not have access to this page"
        description="This area is restricted to a different role. Use the menu to find the pages available to you."
        className="min-h-[50vh]"
      />
    );
  }
  return children;
}

/** "/" - send each role to its natural landing page. */
export function HomeRedirect() {
  const { role, isEmployee } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['onboarding', 'progress'],
    queryFn: onboardingApi.progress,
    enabled: isEmployee,
  });
  if (isEmployee) {
    if (isLoading) return <PageLoader />;
    return <Navigate to={data && !data.is_completed ? '/onboarding' : '/home'} replace />;
  }
  return <Navigate to={homePathFor(role)} replace />;
}
