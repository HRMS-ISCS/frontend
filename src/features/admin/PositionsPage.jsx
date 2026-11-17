import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Plus, Trash2 } from 'lucide-react';

import { positionsApi } from '@/api';
import { formatDate } from '@/lib/format';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Input, PageHeader, Skeleton, Switch, useToast } from '@/components/ui';

export function PositionsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['positions', 'all'], queryFn: positionsApi.all });
  const positions = data?.positions || [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['positions'] });

  const add = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await positionsApi.create(name.trim(), description.trim() || null);
      toast[res.position.is_new ? 'success' : 'info'](res.message);
      setName('');
      setDescription('');
      invalidate();
    } catch (err) {
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (p) => {
    setBusy(p.id);
    try {
      const res = await positionsApi.toggle(p.id);
      toast.success(res.message);
      invalidate();
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy('delete');
    try {
      const res = await positionsApi.remove(toDelete.id);
      toast.success(res.message);
      setToDelete(null);
      invalidate();
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Positions" subtitle="Job titles offered in the onboarding form and HR tools. Inactive positions are hidden from dropdowns." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card flush title="All positions" actions={<Badge>{positions.length}</Badge>}>
          {isLoading ? (
            <div className="space-y-2 p-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : positions.length === 0 ? (
            <EmptyState icon={Briefcase} title="No positions yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {positions.map((p) => (
                <li key={p.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800">{p.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {p.description || 'No description'} · added {formatDate(p.created_at)}
                      {p.created_by ? ` by ${p.created_by}` : ''}
                    </p>
                  </div>
                  <Switch checked={p.is_active} onChange={() => toggle(p)} disabled={busy === p.id} />
                  <Button variant="ghost" size="sm" icon={Trash2} className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(p)} aria-label="Delete" />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Add position" className="lg:self-start">
          <form onSubmit={add} className="space-y-4">
            <Input label="Position name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. DevOps Engineer" />
            <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Button type="submit" icon={Plus} loading={saving} disabled={!name.trim()} className="w-full">Add position</Button>
          </form>
        </Card>
      </div>
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={busy === 'delete'}
        title={`Delete "${toDelete?.name}"?`}
        message="Existing employees keep their position text. Consider deactivating instead if it may be used again."
        confirmLabel="Delete"
      />
    </div>
  );
}
