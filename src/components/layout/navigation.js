import {
  BadgeIndianRupee,
  CalendarDays,
  FileSignature,
  FileStack,
  FileText,
  FolderOpen,
  History,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  Receipt,
  Settings2,
  ShieldCheck,
  UploadCloud,
  UserCircle2,
  UserPlus,
  Users,
  Workflow,
} from 'lucide-react';

import { ROLES } from '@/lib/constants';

const HR_NAV = [
  {
    section: null,
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    section: 'People',
    items: [
      { to: '/employees', label: 'Employees', icon: Users },
      { to: '/onboarding-tracker', label: 'Onboarding Tracker', icon: Workflow },
    ],
  },
  {
    section: 'Documents',
    items: [
      { to: '/letters', label: 'Letter Generation', icon: FileText },
      { to: '/signatures', label: 'E-Signatures', icon: FileSignature, end: true },
      { to: '/documents/history', label: 'Document Dispatch History', icon: History },
    ],
  },
  {
    section: 'Payroll',
    items: [
      { to: '/payroll/salary', label: 'Salary Structures', icon: BadgeIndianRupee },
      { to: '/payroll/run', label: 'Payslip Generator', icon: Receipt },
      { to: '/payroll/uploads', label: 'Payslip Uploads', icon: UploadCloud },
    ],
  },
  {
    section: 'Organisation',
    items: [
      { to: '/admin/users', label: 'Users & Access', icon: UserPlus },
      { to: '/holidays', label: 'Holiday Calendar', icon: CalendarDays },
      { to: '/admin/positions', label: 'Positions', icon: Settings2 },
      { to: '/admin/email-directory', label: 'Email Directory', icon: Mail },
      { to: '/signatures/health', label: 'Zoho Sign Setup', icon: ShieldCheck },
    ],
  },
];

const EMPLOYEE_NAV = [
  {
    section: null,
    items: [
      { to: '/home', label: 'Home', icon: Home },
      { to: '/me/profile', label: 'My Profile', icon: UserCircle2 },
    ],
  },
  {
    section: 'My Workspace',
    items: [
      { to: '/me/signing', label: 'Document Signing', icon: FileSignature },
      { to: '/me/documents', label: 'My Documents', icon: FolderOpen },
      { to: '/me/payslips', label: 'Payslips', icon: FileStack },
      { to: '/holidays', label: 'Holiday Calendar', icon: CalendarDays },
    ],
  },
  {
    section: 'Support',
    items: [{ to: '/me/help', label: 'Help Desk', icon: LifeBuoy }],
  },
];

const ADMIN_NAV = [
  {
    section: null,
    items: [
      { to: '/holidays', label: 'Holiday Calendar', icon: CalendarDays },
      { to: '/payroll/uploads', label: 'Payslip Uploads', icon: UploadCloud },
      { to: '/admin/users', label: 'Users', icon: Users },
    ],
  },
];

export function navigationFor(role) {
  if (role === ROLES.HR || role === ROLES.SUPERADMIN) return HR_NAV;
  if (role === ROLES.ADMIN) return ADMIN_NAV;
  return EMPLOYEE_NAV;
}

/** Caption under the logo in the sidebar - names the portal the role is in. */
export function portalLabelFor(role) {
  if (role === ROLES.HR || role === ROLES.SUPERADMIN) return 'HRMS Portal';
  if (role === ROLES.ADMIN) return 'Admin Portal';
  return 'Employee Screen';
}

export function homePathFor(role) {
  if (role === ROLES.HR || role === ROLES.SUPERADMIN) return '/dashboard';
  if (role === ROLES.ADMIN) return '/holidays';
  return '/home';
}

/* Routes a role may open that are not in its sidebar. */
const UNLISTED_ROUTES = {
  [ROLES.EMPLOYEE]: ['/onboarding'],
};

/**
 * Whether `role` may open `path`.
 *
 * Derived from the role's own sidebar, so it cannot drift from the guards in
 * App.jsx the way a hand-maintained route table would.
 *
 * This exists for one job: vetting the URL that bounced someone to /login
 * before the NEXT person to sign in is sent back to it. Two people with
 * different roles share a browser far more often than you would think - HR
 * signs out on /dashboard, an employee signs in, and without this check the
 * employee is dropped on an HR page and meets the "no access" screen before
 * they have clicked anything.
 *
 * Matching is on segment boundaries, never bare prefixes: '/onboarding-tracker'
 * must not be admitted by '/onboarding'.
 */
export function canAccess(role, path) {
  if (!path) return false;
  const target = path.split('?')[0];
  const allowed = [
    ...navigationFor(role).flatMap((group) => group.items.map((item) => item.to)),
    ...(UNLISTED_ROUTES[role] || []),
  ];
  return allowed.some((to) => target === to || target.startsWith(`${to}/`));
}
