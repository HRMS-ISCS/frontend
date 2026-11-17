import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, Upload } from 'lucide-react';

import { calendarApi } from '@/api';
import { useAuth } from '@/lib/auth';
import { formatDate, MONTHS } from '@/lib/format';
import { Alert, Button, Card, ConfirmDialog, EmptyState, ErrorState, Input, Modal, PageHeader, Segmented, Select, Skeleton, useToast } from '@/components/ui';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { FileUpload } from '@/components/FileUpload';

const COLORS = {
  orange: 'bg-orange-100 text-orange-700 ring-orange-200',
  red: 'bg-red-100 text-red-700 ring-red-200',
  green: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  blue: 'bg-sky-100 text-sky-700 ring-sky-200',
  purple: 'bg-violet-100 text-violet-700 ring-violet-200',
};
const colorClass = (c) => COLORS[c] || COLORS.orange;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function AddHolidayModal({ onClose }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('orange');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await calendarApi.add({ date, name: name.trim(), color });
      toast.success(`${name} added`);
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Add holiday"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={!date || !name.trim()}>Add</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error.message}</Alert>}
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label="Holiday name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Diwali" />
        <Select label="Colour" value={color} onChange={(e) => setColor(e.target.value)} placeholder={null} options={Object.keys(COLORS).map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }))} />
      </div>
    </Modal>
  );
}

function UploadModal({ onClose }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const upload = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await calendarApi.upload(file);
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Upload holiday calendar"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button icon={Upload} onClick={upload} loading={saving} disabled={!file}>Upload & replace</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="warning">Uploading replaces the entire existing calendar.</Alert>
        <p className="text-sm text-slate-600">
          CSV or Excel with columns <code className="rounded bg-slate-100 px-1 font-mono text-xs">date, name, color</code> (colour optional). Dates as YYYY-MM-DD,
          DD/MM/YYYY or DD-MM-YYYY.
        </p>
        <FileUpload label="Calendar file" accept=".csv,.xlsx,.xls" file={file} onChange={setFile} />
        {error && <Alert tone="danger">{error.message}</Alert>}
      </div>
    </Modal>
  );
}

function MonthGrid({ year, month, holidaysByDate }) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const todayKey = new Date().toISOString().slice(0, 10);
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
      {WEEKDAYS.map((d) => (
        <div key={d} className="bg-slate-50 py-2 text-center text-xs font-semibold uppercase text-slate-500">{d}</div>
      ))}
      {cells.map((day, i) => {
        const key = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
        const holiday = key && holidaysByDate[key];
        const weekend = i % 7 === 0;
        return (
          <div key={i} className={clsx('min-h-[88px] p-2', day ? 'bg-white' : 'bg-slate-50', weekend && day && 'bg-slate-50/70')}>
            {day && (
              <>
                <span className={clsx('inline-flex h-6 w-6 items-center justify-center rounded-full text-xs', key === todayKey ? 'bg-brand-600 font-semibold text-white' : 'text-slate-600')}>
                  {day}
                </span>
                {holiday && (
                  <p className={clsx('mt-1 truncate rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset', colorClass(holiday.color))} title={holiday.name}>
                    {holiday.name}
                  </p>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function HolidaysPage() {
  const { isHr, isAdmin } = useAuth();
  const canManage = isHr || isAdmin;
  const toast = useToast();
  const queryClient = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState('calendar');
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['holidays', year], queryFn: () => calendarApi.list(year) });
  const byDate = useMemo(() => Object.fromEntries(data.map((h) => [h.date, h])), [data]);

  const shiftMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  };

  const remove = async () => {
    setBusy(true);
    try {
      const res = confirm === 'all' ? await calendarApi.removeAll() : await calendarApi.remove(confirm.id);
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      setConfirm(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  const today = now.toISOString().slice(0, 10);
  const upcoming = data.filter((h) => h.date >= today);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holiday calendar"
        subtitle={`${data.length} holidays in ${year} · ${upcoming.length} still to come`}
        actions={
          <>
            <Segmented value={view} onChange={setView} options={[{ value: 'calendar', label: 'Calendar' }, { value: 'list', label: 'List' }]} />
            {canManage && (
              <>
                <Button variant="secondary" icon={Upload} onClick={() => setUploading(true)}>Upload</Button>
                <Button icon={Plus} onClick={() => setAdding(true)}>Add holiday</Button>
              </>
            )}
          </>
        }
      />

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : error ? (
        <Card><ErrorState error={error} onRetry={refetch} /></Card>
      ) : view === 'calendar' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <Card
            title={`${MONTHS[month]} ${year}`}
            icon={CalendarDays}
            actions={
              <>
                <Button variant="secondary" size="sm" icon={ChevronLeft} onClick={() => shiftMonth(-1)} aria-label="Previous month" />
                <Button variant="secondary" size="sm" onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()); }}>Today</Button>
                <Button variant="secondary" size="sm" icon={ChevronRight} onClick={() => shiftMonth(1)} aria-label="Next month" />
              </>
            }
          >
            <MonthGrid year={year} month={month} holidaysByDate={byDate} />
          </Card>
          <Card title="Upcoming" flush>
            {upcoming.length === 0 ? (
              <EmptyState title="No upcoming holidays" className="py-8" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcoming.slice(0, 10).map((h) => (
                  <li key={h.id} className="flex items-center gap-3 px-5 py-3">
                    <span className={clsx('h-2.5 w-2.5 rounded-full ring-4', colorClass(h.color))} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{h.name}</p>
                      <p className="text-xs text-slate-500">{formatDate(h.date)} · {new Date(`${h.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : (
        <Card
          flush
          actions={canManage && data.length > 0 && <Button variant="ghost" size="sm" className="text-red-600" icon={Trash2} onClick={() => setConfirm('all')}>Clear all</Button>}
          title={`All holidays · ${year}`}
        >
          {data.length === 0 ? (
            <EmptyState icon={CalendarDays} title={`No holidays for ${year}`} description={canManage ? 'Upload a calendar file or add holidays one by one.' : 'HR has not published the calendar yet.'} />
          ) : (
            <ResponsiveTable
              rows={data}
              rowKey={(h) => h.id}
              breakpoint="sm"
              rowClassName={(h) => (h.date < today ? 'opacity-60' : undefined)}
              /* Column order is the desktop table's, unchanged. `role` only
                 decides where each one lands on the phone card - so the card
                 can lead with the holiday name while the table still leads
                 with the date. */
              columns={[
                {
                  key: 'date',
                  header: 'Date',
                  className: 'whitespace-nowrap font-medium',
                  cell: (h) => <span className="tabular">{formatDate(h.date)}</span>,
                },
                {
                  key: 'day',
                  header: 'Day',
                  cell: (h) => new Date(`${h.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long' }),
                },
                {
                  key: 'holiday',
                  header: 'Holiday',
                  role: 'primary',
                  cell: (h) => (
                    <span className={clsx('rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset', colorClass(h.color))}>{h.name}</span>
                  ),
                },
                ...(canManage
                  ? [{
                      key: 'actions',
                      header: 'Actions',
                      role: 'actions',
                      align: 'right',
                      cell: (h) => (
                        <Button variant="ghost" size="sm" icon={Trash2} className="text-red-600 hover:bg-red-50" onClick={() => setConfirm(h)} aria-label="Delete" />
                      ),
                    }]
                  : []),
              ]}
            />
          )}
        </Card>
      )}

      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => setYear((y) => y - 1)}>{year - 1}</Button>
        <span className="text-sm font-semibold">{year}</span>
        <Button variant="ghost" size="sm" iconRight={ChevronRight} onClick={() => setYear((y) => y + 1)}>{year + 1}</Button>
      </div>

      {adding && <AddHolidayModal onClose={() => setAdding(false)} />}
      {uploading && <UploadModal onClose={() => setUploading(false)} />}
      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        loading={busy}
        title={confirm === 'all' ? 'Clear the whole calendar?' : `Delete ${confirm?.name}?`}
        message={confirm === 'all' ? 'Every holiday is removed for all years.' : 'This holiday is removed from the calendar.'}
        confirmLabel="Delete"
      />
    </div>
  );
}
