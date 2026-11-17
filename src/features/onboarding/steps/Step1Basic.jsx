import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lock } from 'lucide-react';

import { employeeIdsApi, onboardingApi, positionsApi } from '@/api';
import { useAuth } from '@/lib/auth';
import { PATTERNS } from '@/lib/constants';
import { useForm, validate } from '@/lib/hooks';
import { Combobox, FormGrid, FormSection, Input, Select, Textarea } from '@/components/ui';
import { StepCard, dateOnly } from '../shared';
import { fieldIssues, serverIssues } from '../StepErrors';

// On-screen label and section of each field, for the error pop-up.
const FIELDS = {
  name: { label: 'Full name', section: 'Identity & contact' },
  email: { label: 'Work email', section: 'Identity & contact' },
  phone: { label: 'Mobile number', section: 'Identity & contact' },
  position: { label: 'Position', section: 'Role' },
  date_of_joining: { label: 'Date of joining', section: 'Role' },
  client: { label: 'Client (if deployed)', section: 'Role' },
  skill_set: { label: 'Key skills', section: 'Role' },
};

export function Step1Basic({ employeeId, record, onSaved }) {
  const { user, refreshProfile } = useAuth();
  const { data: positionData } = useQuery({ queryKey: ['positions', 'names'], queryFn: positionsApi.names });
  const positions = positionData?.positions || [];
  // Before the record exists: the ID HR reserved (shown locked), or previews
  // of the next automatic IDs. The server applies the reservation regardless.
  const { data: idInfo } = useQuery({
    queryKey: ['employee-ids', 'mine'],
    queryFn: employeeIdsApi.mine,
    enabled: !employeeId,
    retry: false,
  });
  const reservedId = !employeeId ? idInfo?.reserved_id : null;

  const { values, set, errors, setErrors } = useForm({
    name: record?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' '),
    prefix: 'ISCSI',
    email: record?.email || user?.email || '',
    phone: record?.phone || user?.mobile_number || '',
    position: record?.position || '',
    date_of_joining: dateOnly(record?.date_of_joining),
    client: record?.client || '',
    skill_set: record?.skill_set || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [issues, setIssues] = useState(null);

  const submit = async () => {
    const found = validate(values, {
      name: (v) => (!v?.trim() ? 'Full name is required' : undefined),
      email: (v) => (!v ? 'Email is required' : !PATTERNS.email.test(v) ? 'Enter a valid email' : undefined),
      phone: (v) => (!PATTERNS.phone.test(v || '') ? 'Enter a 10 digit mobile number' : undefined),
      position: (v) => (!v?.trim() ? 'Enter or choose your position' : undefined),
    });
    setErrors(found);
    if (Object.keys(found).length) {
      setIssues(fieldIssues(found, FIELDS));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const position = values.position.trim();
      // A position typed by hand is added to the shared list for next time.
      if (!positions.some((p) => p.toLowerCase() === position.toLowerCase())) {
        await positionsApi.create(position).catch(() => {});
      }
      const body = {
        name: values.name.trim(),
        employee_id: employeeId || reservedId || values.prefix,
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        position,
        date_of_joining: values.date_of_joining ? `${values.date_of_joining}T00:00:00` : null,
        // `client` and `skill_set` are typed `str` on the backend - omit rather than send null.
        client: values.client.trim() || undefined,
        skill_set: values.skill_set.trim() || undefined,
      };
      if (employeeId) await onboardingApi.updateBasic(employeeId, body);
      else await onboardingApi.createBasic(body);
      await refreshProfile();
      await onSaved(1);
    } catch (err) {
      setError(err);
      setIssues(serverIssues(err, FIELDS));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StepCard
      step={1}
      title="Basic details"
      description="Tell us about your role at ISCS. You can edit these details until you submit your declaration."
      onSubmit={submit}
      saving={saving}
      error={error}
      issues={issues}
      onIssuesClose={() => setIssues(null)}
    >
      <FormSection title="Identity & contact">
        <FormGrid>
          <Input label="Full name" required value={values.name} onChange={(e) => set('name', e.target.value)} error={errors.name} placeholder="As per Aadhaar" />
          {employeeId ? (
            <Input label="Employee ID" value={employeeId} disabled hint="Assigned by the system" />
          ) : reservedId ? (
            <Input
              label="Employee ID"
              value={reservedId}
              disabled
              prefix={<Lock size={14} />}
              hint="Assigned by HR. It cannot be changed here."
            />
          ) : (
            <Select
              label="Employment type"
              required
              value={values.prefix}
              onChange={(e) => set('prefix', e.target.value)}
              placeholder={null}
              options={[
                { value: 'ISCSI', label: 'Internal employee (ISCSI)' },
                { value: 'ISCSE', label: 'External / client-deployed (ISCSE)' },
              ]}
              hint={
                idInfo?.next?.[values.prefix]
                  ? `Your Employee ID will be ${idInfo.next[values.prefix]} (confirmed when you save).`
                  : 'Your employee ID is generated from this.'
              }
            />
          )}
          <Input label="Work email" type="email" required value={values.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
          <Input
            label="Mobile number"
            required
            inputMode="numeric"
            maxLength={10}
            value={values.phone}
            onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))}
            error={errors.phone}
            prefix={<span className="text-xs font-medium">+91</span>}
          />
        </FormGrid>
      </FormSection>

      <FormSection title="Role">
        <FormGrid>
          <Combobox
            label="Position"
            required
            value={values.position}
            onChange={(v) => set('position', v)}
            options={positions}
            error={errors.position}
            placeholder="Type or choose your position"
            hint="Pick from the list or type your own title."
          />
          <Input label="Date of joining" type="date" value={values.date_of_joining} onChange={(e) => set('date_of_joining', e.target.value)} />
          <Input label="Client (if deployed)" value={values.client} onChange={(e) => set('client', e.target.value)} placeholder="e.g. HCL Technologies" />
          <Textarea
            label="Key skills"
            fieldClassName="sm:col-span-2"
            rows={2}
            value={values.skill_set}
            onChange={(e) => set('skill_set', e.target.value)}
            placeholder="e.g. Python, SQL, Azure, Power BI"
            hint="Separate skills with commas."
          />
        </FormGrid>
      </FormSection>
    </StepCard>
  );
}
