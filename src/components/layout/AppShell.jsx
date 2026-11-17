import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowRight, KeyRound, LogOut, Menu as MenuIcon, X } from 'lucide-react';

import { onboardingApi } from '@/api';
import { useAuth } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/constants';
import { Avatar, Menu, ProgressBar } from '@/components/ui';
import { BrandLogo } from '@/components/BrandLogo';
import { BRAND_TRANSITION } from '@/lib/pageTransition';
import { CommandPalette, CommandPaletteTrigger, useCommandPalette } from '@/components/CommandPalette';
import { PageTransition } from '@/components/PageTransition';
import { ChangePasswordModal } from '@/features/auth/ChangePasswordModal';
import { SidekickLauncher } from '@/features/sidekick/SidekickLauncher';
import { navigationFor, portalLabelFor } from './navigation';

/* `glide` names the logo for the view transition that closes the welcome
 * screen, so it lands here. Only the desktop sidebar opts in, and only once the
 * splash (which carries the same name) is gone - two live elements with one
 * name would cancel the transition. */
function Brand({ role, glide }) {
  return (
    <div className="px-5 pb-5 pt-6">
      <span className="inline-flex" style={glide ? BRAND_TRANSITION : undefined}>
        <BrandLogo className="h-16" onDark />
      </span>
      <p className="mt-3 text-micro font-semibold uppercase text-sidebar-muted">{portalLabelFor(role)}</p>
    </div>
  );
}

function SidebarNav({ role, onNavigate }) {
  const groups = navigationFor(role);
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6 scrollbar-dark">
      {groups.map((group) => (
        <div key={group.section || 'root'}>
          {group.section && (
            <p className="mb-2 px-3 text-micro font-semibold uppercase text-sidebar-muted/80">{group.section}</p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    clsx(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-all duration-150',
                      isActive
                        ? 'bg-brand-600 text-white shadow-brand-glow'
                        : 'text-slate-300 hover:bg-sidebar-hover hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        size={17}
                        strokeWidth={isActive ? 2.2 : 1.9}
                        className={clsx('shrink-0 transition-transform', !isActive && 'group-hover:scale-105')}
                      />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function OnboardingBanner() {
  const { isEmployee } = useAuth();
  const location = useLocation();
  const { data } = useQuery({
    queryKey: ['onboarding', 'progress'],
    queryFn: onboardingApi.progress,
    enabled: isEmployee,
    staleTime: 60 * 1000,
  });
  if (!isEmployee || !data || data.is_completed) return null;
  return (
    <div className="border-b border-amber-200/70 bg-gradient-to-r from-amber-50 to-amber-50/40 px-4 py-3 sm:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="tabular shrink-0 rounded-lg bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
            {data.completion_percentage}%
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-caption font-semibold text-amber-900">
              Finish your onboarding to activate your profile
            </p>
            <ProgressBar value={data.completion_percentage} tone="warning" size="sm" className="mt-1.5 max-w-xs" />
          </div>
        </div>
        {!location.pathname.startsWith('/onboarding') && (
          <Link
            to="/onboarding"
            className="btn btn-sm shrink-0 bg-amber-500 text-white shadow-none hover:bg-amber-600"
          >
            Continue <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}

export function AppShell() {
  const { user, role, displayName, logout, welcome, isHr } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const palette = useCommandPalette();

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Brand role={role} glide={!welcome} />
        <SidebarNav role={role} />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-[280px] flex-col bg-sidebar animate-slide-up">
            <button
              type="button"
              className="absolute right-4 top-6 rounded-lg p-1 text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-white"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={19} />
            </button>
            <Brand role={role} />
            <SidebarNav role={role} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md sm:px-8">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon size={20} />
          </button>
          <CommandPaletteTrigger onOpen={() => palette.setOpen(true)} />
          <div className="ml-auto flex items-center gap-3">
            <Menu
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-xl py-1.5 pl-1.5 pr-2 transition-colors hover:bg-slate-100"
                >
                  <Avatar name={displayName} src={user?.profile_photo_url} size="sm" />
                  <span className="hidden text-left leading-tight sm:block">
                    <span className="block text-[13.5px] font-semibold text-slate-800">{displayName}</span>
                    <span className="block text-xs text-slate-500">
                      {ROLE_LABELS[role] || role}
                      {user?.employee_id ? ` · ${user.employee_id}` : ''}
                    </span>
                  </span>
                </button>
              }
              items={[
                { label: 'Change password', icon: KeyRound, onClick: () => setChangePassword(true) },
                { divider: true, key: 'd1' },
                { label: 'Sign out', icon: LogOut, danger: true, onClick: logout },
              ]}
            />
          </div>
        </header>

        <OnboardingBanner />

        {/* HR pages carry the chatbot's floating button bottom-right; the extra
            bottom padding lets the last row (pagination, a Save button) scroll
            clear of it instead of sitting underneath. */}
        <main className={clsx('flex-1 px-4 py-6 sm:px-8 sm:py-8', isHr && 'pb-24 sm:pb-24')}>
          <div className="mx-auto max-w-[1400px]">
            {/* One entrance animation per navigation, for every page in the
                shell. Nothing else in the app needs to opt in. */}
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>

      <CommandPalette open={palette.open} onClose={() => palette.setOpen(false)} />
      <ChangePasswordModal open={changePassword} onClose={() => setChangePassword(false)} />
      {/* HR and Super Admin only; renders nothing for other roles. */}
      <SidekickLauncher />
    </div>
  );
}
