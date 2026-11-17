import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';

import { employeesApi } from '@/api';
import { useClickOutside } from '@/lib/hooks';
import { Avatar, Field } from '@/components/ui';

export function photoOf(employee) {
  const profile = Array.isArray(employee?.personal_profile)
    ? employee.personal_profile[0]
    : employee?.personal_profile;
  return profile?.profile_photo_url || null;
}

const EMPTY_LIST = [];

// Module-level so React Query can memoise the result: an inline select returns
// a new array every render, which re-fires any effect depending on it.
const selectEmployees = (data) => (Array.isArray(data) ? data : data?.applications || EMPTY_LIST);

/** Every employee, cached for 5 minutes. HR / Superadmin only on the backend. */
export function useEmployees(enabled = true) {
  return useQuery({
    queryKey: ['employees', 'all'],
    queryFn: () => employeesApi.list(),
    staleTime: 5 * 60 * 1000,
    enabled,
    select: selectEmployees,
  });
}

export function EmployeePicker({
  value,
  onChange,
  label,
  required,
  error,
  hint,
  placeholder = 'Search employee by name or ID',
  disabled,
  exclude = [],
}) {
  const { data: employees = [], isLoading } = useEmployees();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  const selected = employees.find((e) => e.employee_id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees
      .filter((e) => !exclude.includes(e.employee_id))
      .filter(
        (e) =>
          !q ||
          e.name?.toLowerCase().includes(q) ||
          e.employee_id?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [employees, query, exclude]);

  return (
    <Field label={label} required={required} error={error} hint={hint}>
      <div className="relative" ref={ref}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={clsx('input flex items-center gap-2 text-left', error && 'input-error')}
        >
          {selected ? (
            <>
              <Avatar name={selected.name} src={photoOf(selected)} size="xs" />
              <span className="truncate font-medium text-slate-800">{selected.name}</span>
              <span className="truncate text-xs text-slate-500">{selected.employee_id}</span>
            </>
          ) : (
            <span className="text-slate-400">{isLoading ? 'Loading employees…' : placeholder}</span>
          )}
          <span className="ml-auto flex items-center gap-1 text-slate-400">
            {selected && !disabled && (
              <X
                size={14}
                className="hover:text-slate-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null, null);
                }}
              />
            )}
            <ChevronsUpDown size={14} />
          </span>
        </button>

        {open && (
          <div className="absolute z-40 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-pop animate-fade-in">
            <div className="flex items-center gap-2 border-b border-slate-100 px-3">
              <Search size={14} className="text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search…"
                className="w-full border-0 py-2.5 text-sm focus:outline-none focus:ring-0"
              />
            </div>
            <ul className="max-h-64 overflow-y-auto py-1 scrollbar-thin">
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-slate-500">No employees found</li>
              )}
              {filtered.map((emp) => (
                <li key={emp.employee_id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(emp.employee_id, emp);
                      setOpen(false);
                      setQuery('');
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <Avatar name={emp.name} src={photoOf(emp)} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">{emp.name}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {emp.employee_id} · {emp.position || 'No position'}
                      </span>
                    </span>
                    {emp.employee_id === value && <Check size={16} className="text-brand-600" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Field>
  );
}
