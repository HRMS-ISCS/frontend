import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { BadgeIndianRupee, Search } from 'lucide-react';

import { employeesApi } from '@/api';
import { Avatar, Card, EmptyState, Input, PageHeader, Skeleton } from '@/components/ui';
import { photoOf, useEmployees } from '@/components/EmployeePicker';
import { SalaryStructureCard } from './SalaryStructureCard';

export function SalaryStructuresPage() {
  const [params, setParams] = useSearchParams();
  const selected = params.get('employee');
  const [search, setSearch] = useState('');
  const { data: employees = [], isLoading } = useEmployees();

  const record = useQuery({
    queryKey: ['employee', selected],
    queryFn: () => employeesApi.get(selected),
    enabled: Boolean(selected),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees
      .filter((e) => !q || e.name?.toLowerCase().includes(q) || e.employee_id.toLowerCase().includes(q))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [employees, search]);

  const p = record.data?.personal_profile;

  return (
    <div className="space-y-6">
      <PageHeader title="Salary structures" subtitle="Versioned CTC breakups used by payroll. Revisions never change past payslips." />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card flush className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-b border-slate-100 p-3">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find employee" prefix={<Search size={15} />} />
          </div>
          <ul className="max-h-[65vh] divide-y divide-slate-100 overflow-y-auto scrollbar-thin">
            {isLoading
              ? [1, 2, 3, 4].map((i) => <li key={i} className="p-3"><Skeleton className="h-12" /></li>)
              : filtered.map((emp) => (
                  <li key={emp.employee_id}>
                    <button
                      type="button"
                      onClick={() => setParams({ employee: emp.employee_id }, { replace: true })}
                      className={clsx('flex w-full items-center gap-3 px-4 py-2.5 text-left transition', selected === emp.employee_id ? 'bg-brand-50' : 'hover:bg-slate-50')}
                    >
                      <Avatar name={emp.name} src={photoOf(emp)} size="sm" />
                      <span className="min-w-0">
                        <span className={clsx('block truncate text-sm font-medium', selected === emp.employee_id ? 'text-brand-700' : 'text-slate-800')}>{emp.name}</span>
                        <span className="block truncate text-xs text-slate-500">{emp.employee_id} · {emp.position}</span>
                      </span>
                    </button>
                  </li>
                ))}
          </ul>
        </Card>
        <div>
          {!selected ? (
            <Card>
              <EmptyState icon={BadgeIndianRupee} title="Select an employee" description="Choose someone from the list to view, create or revise their salary structure." />
            </Card>
          ) : (
            <div className="space-y-4">
              {record.data && (
                <div className="flex items-center gap-3">
                  <Avatar name={record.data.name} size="md" />
                  <div>
                    <p className="font-semibold text-slate-900">{record.data.name}</p>
                    <p className="text-sm text-slate-500">{record.data.employee_id} · {record.data.position}</p>
                  </div>
                </div>
              )}
              <SalaryStructureCard key={selected} employeeId={selected} defaults={{ pan: p?.pan_card_no, uan: p?.uan_number, esi: p?.esi_no }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
