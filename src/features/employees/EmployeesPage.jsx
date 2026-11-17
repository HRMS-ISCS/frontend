import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Briefcase, LayoutGrid, List, Mail, Phone, Search, UserPlus, Users } from 'lucide-react';

import { employeeType, formatDate } from '@/lib/format';
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, Input, PageHeader, Pagination, Segmented, Select, Skeleton, StatCard } from '@/components/ui';
import { photoOf, useEmployees } from '@/components/EmployeePicker';
import { ResponsiveTable } from '@/components/ResponsiveTable';

const PAGE_SIZE = 12;

/* Declared once; the table and the phone cards are both generated from it. */
function employeeColumns() {
  return [
    {
      key: 'employee',
      header: 'Employee',
      role: 'primary',
      cell: (emp) => (
        <div className="flex items-center gap-3">
          <Avatar name={emp.name} src={photoOf(emp)} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">{emp.name}</p>
            <p className="tabular text-xs text-slate-500">
              {emp.employee_id} · {employeeType(emp.employee_id)}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'position', header: 'Position', className: 'font-medium text-slate-700', cell: (emp) => emp.position || '—' },
    { key: 'client', header: 'Client', cell: (emp) => emp.client || '—' },
    {
      key: 'joined',
      header: 'Joined',
      className: 'tabular whitespace-nowrap',
      cell: (emp) => <span className="tabular">{formatDate(emp.date_of_joining)}</span>,
    },
    {
      key: 'contact',
      header: 'Contact',
      className: 'text-slate-500',
      cell: (emp) => (
        <>
          <span className="block max-w-[200px] truncate">{emp.email}</span>
          <span className="tabular block text-xs">{emp.phone}</span>
        </>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      role: 'badge',
      cell: (emp) => {
        const status = profileStatus(emp);
        return (
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
        );
      },
    },
  ];
}

function profileStatus(emp) {
  if (emp.declaration) return { label: 'Onboarded', tone: 'success' };
  if (Array.isArray(emp.personal_profile) ? emp.personal_profile.length : emp.personal_profile) return { label: 'In progress', tone: 'info' };
  return { label: 'Basic details only', tone: 'neutral' };
}

export function EmployeesPage() {
  const navigate = useNavigate();
  const { data: employees = [], isLoading, error, refetch } = useEmployees();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('name');
  const [view, setView] = useState('table');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = employees
      .filter((e) => !type || employeeType(e.employee_id) === type)
      .filter(
        (e) =>
          !q ||
          [e.name, e.employee_id, e.email, e.position, e.client, e.skill_set].some((v) => v?.toLowerCase().includes(q)),
      );
    const sorters = {
      name: (a, b) => (a.name || '').localeCompare(b.name || ''),
      id: (a, b) => a.employee_id.localeCompare(b.employee_id, undefined, { numeric: true }),
      joined: (a, b) => (b.date_of_joining || '').localeCompare(a.date_of_joining || ''),
    };
    return [...list].sort(sorters[sort]);
  }, [employees, search, type, sort]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const internal = employees.filter((e) => employeeType(e.employee_id) === 'Internal').length;
  const onboarded = employees.filter((e) => e.declaration).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        subtitle="Your people directory — open anyone for their full 360° record."
        actions={
          <Button icon={UserPlus} onClick={() => navigate('/admin/users?create=1')}>
            Create new employee
          </Button>
        }
      />

      <div className="stagger grid gap-4 sm:grid-cols-3">
        <StatCard label="Total employees" value={employees.length} icon={Users} />
        <StatCard label="Internal / External" value={`${internal} / ${employees.length - internal}`} icon={Briefcase} tone="violet" />
        <StatCard
          label="Onboarding complete"
          value={onboarded}
          sub={`${employees.length - onboarded} still pending`}
          icon={Users}
          tone="success"
        />
      </div>

      <Card flush>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, ID, email, position, skills"
            prefix={<Search size={15} />}
            fieldClassName="lg:w-96"
          />
          <Select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            placeholder="All types"
            options={['Internal', 'External']}
            fieldClassName="lg:w-40"
          />
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            placeholder={null}
            options={[
              { value: 'name', label: 'Sort: Name' },
              { value: 'id', label: 'Sort: Employee ID' },
              { value: 'joined', label: 'Sort: Recently joined' },
            ]}
            fieldClassName="lg:w-48"
          />
          <div className="lg:ml-auto">
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'table', label: <List size={15} /> },
                { value: 'grid', label: <LayoutGrid size={15} /> },
              ]}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees found"
            description={search || type ? 'Try a different search or clear the filters.' : 'Add your first employee to get started.'}
          />
        ) : view === 'table' ? (
          <ResponsiveTable
            rows={pageItems}
            columns={employeeColumns()}
            rowKey={(emp) => emp.employee_id}
            onRowClick={(emp) => navigate(`/employees/${emp.employee_id}`)}
          />
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((emp) => {
              const status = profileStatus(emp);
              return (
                <Link
                  key={emp.employee_id}
                  to={`/employees/${emp.employee_id}`}
                  className="group rounded-card border border-slate-200/80 p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float"
                >
                  <Avatar name={emp.name} src={photoOf(emp)} size="lg" className="mx-auto" />
                  <p className="mt-3.5 truncate font-semibold text-slate-800 transition-colors group-hover:text-brand-700">
                    {emp.name}
                  </p>
                  <p className="mt-0.5 truncate text-caption text-slate-500">{emp.position || '—'}</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    <Badge tone="brand">{emp.employee_id}</Badge>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3.5 text-left text-xs text-slate-500">
                    <p className="flex items-center gap-2 truncate">
                      <Mail size={12} className="shrink-0 text-slate-400" /> {emp.email}
                    </p>
                    <p className="tabular flex items-center gap-2">
                      <Phone size={12} className="shrink-0 text-slate-400" /> {emp.phone}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <Pagination page={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </Card>
    </div>
  );
}
