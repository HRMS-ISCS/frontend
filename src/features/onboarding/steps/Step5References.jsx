import { useState } from 'react';
import { Contact } from 'lucide-react';

import { employeesApi, onboardingApi } from '@/api';
import { PATTERNS } from '@/lib/constants';
import { Checkbox, FormGrid, FormSection, Input, Textarea } from '@/components/ui';
import { RepeatableList, StepCard, useRowErrors, validateRows } from '../shared';
import { generalIssue, rowIssues, serverIssues } from '../StepErrors';

// On-screen labels, for the error pop-up.
const REFERENCE_FIELDS = { name: 'Name', tel_no: 'Phone', email: 'Email' };

const newReference = () => ({
  name: '',
  designation: '',
  company: '',
  tel_no: '',
  email: '',
  period_known: '',
  capacity_known: '',
  referred_by_employee_ISCS: false,
});

export function Step5References({ employeeId, record, onSaved, onBack }) {
  const about = record?.about_self || {};
  const [references, setReferences] = useState(
    (record?.professional_reference || []).map((r, i) => ({
      _key: `r${i}`,
      name: r.name || '',
      designation: r.designation || '',
      company: r.company || '',
      tel_no: r.tel_no || '',
      email: r.email || '',
      period_known: r.period_known || '',
      capacity_known: r.capacity_known || '',
      referred_by_employee_ISCS: Boolean(r.referred_by_employee_ISCS),
    })),
  );
  const [aboutSelf, setAboutSelf] = useState({
    career_ambition: about.career_ambition || '',
    significant_achievements: about.significant_achievements || '',
    professional_failures: about.professional_failures || '',
    strength1: about.strength1 || '',
    strength2: about.strength2 || '',
    strength3: about.strength3 || '',
    weakness1: about.weakness1 || '',
    weakness2: about.weakness2 || '',
    weakness3: about.weakness3 || '',
  });
  const refErrors = useRowErrors();
  const [listError, setListError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [issues, setIssues] = useState(null);

  const setAbout = (key, value) => setAboutSelf((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (references.length === 0) {
      setListError('Add at least one professional reference.');
      setIssues([generalIssue('Add at least one professional reference.', 'Professional references', 'Professional references')]);
      return;
    }
    setListError('');
    const errors = validateRows(references, (r) => ({
      ...(!r.name.trim() && { name: 'Required' }),
      ...(r.tel_no && !PATTERNS.phone.test(r.tel_no) && { tel_no: 'Must be 10 digits' }),
      ...(r.email && !PATTERNS.email.test(r.email) && { email: 'Invalid email' }),
    }));
    refErrors.setRowErrors(errors);
    if (Object.keys(errors).length) {
      setIssues(rowIssues(errors, { section: 'Professional references', item: 'Reference', fields: REFERENCE_FIELDS }));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const nullIfEmpty = (v) => (v && String(v).trim() ? String(v).trim() : null);
      const aboutBody = Object.fromEntries(Object.entries(aboutSelf).map(([k, v]) => [k, nullIfEmpty(v)]));
      // References and "about you" are separate tables: save both at once.
      await Promise.all([
        employeesApi.update(employeeId, {
          professional_reference: references.map((r) => ({
            name: r.name.trim(),
            designation: nullIfEmpty(r.designation),
            company: nullIfEmpty(r.company),
            tel_no: nullIfEmpty(r.tel_no),
            email: nullIfEmpty(r.email)?.toLowerCase() ?? null,
            period_known: nullIfEmpty(r.period_known),
            capacity_known: nullIfEmpty(r.capacity_known),
            referred_by_employee_ISCS: r.referred_by_employee_ISCS,
          })),
        }),
        record?.about_self
          ? onboardingApi.updateAboutSelf(employeeId, aboutBody)
          : onboardingApi.createAboutSelf(employeeId, aboutBody),
      ]);
      await onSaved(5);
    } catch (err) {
      setError(err);
      setIssues(serverIssues(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StepCard
      step={5}
      title="References & about you"
      description="References may be contacted as part of background verification."
      onSubmit={submit}
      onBack={onBack}
      saving={saving}
      error={error}
      issues={issues}
      onIssuesClose={() => setIssues(null)}
    >
      <FormSection title="Professional references">
        <RepeatableList
          items={references}
          onChange={(list) => {
            setReferences(list);
            setListError('');
          }}
          newItem={newReference}
          addLabel="Add reference"
          emptyTitle="No references added"
          emptyIcon={Contact}
          itemTitle={(r, i) => r.name || `Reference ${i + 1}`}
          renderItem={(r, i, update) => (
            <div className="space-y-4">
              <FormGrid cols={3}>
                <Input label="Name" required value={r.name} onChange={(e) => update({ name: e.target.value })} error={refErrors.errorFor(i, 'name')} />
                <Input label="Designation" value={r.designation} onChange={(e) => update({ designation: e.target.value })} />
                <Input label="Company" value={r.company} onChange={(e) => update({ company: e.target.value })} />
                <Input label="Phone" inputMode="numeric" maxLength={10} value={r.tel_no} onChange={(e) => update({ tel_no: e.target.value.replace(/\D/g, '') })} error={refErrors.errorFor(i, 'tel_no')} />
                <Input label="Email" type="email" value={r.email} onChange={(e) => update({ email: e.target.value })} error={refErrors.errorFor(i, 'email')} />
                <Input label="Known for" value={r.period_known} onChange={(e) => update({ period_known: e.target.value })} placeholder="e.g. 3 years" />
                <Input label="Capacity" fieldClassName="sm:col-span-2" value={r.capacity_known} onChange={(e) => update({ capacity_known: e.target.value })} placeholder="e.g. Reporting manager at ABC Corp" />
              </FormGrid>
              <Checkbox label="This person is a current ISCS employee who referred me" checked={r.referred_by_employee_ISCS} onChange={(v) => update({ referred_by_employee_ISCS: v })} />
            </div>
          )}
        />
        {listError && <p className="error-text mt-3">{listError}</p>}
      </FormSection>

      <FormSection title="About you" description="Helps us understand how you like to grow. Optional.">
        <div className="space-y-4">
          <Textarea label="Career ambition" rows={3} maxLength={1000} value={aboutSelf.career_ambition} onChange={(e) => setAbout('career_ambition', e.target.value)} />
          <FormGrid>
            <Textarea label="Significant achievements" rows={3} maxLength={1000} value={aboutSelf.significant_achievements} onChange={(e) => setAbout('significant_achievements', e.target.value)} />
            <Textarea label="Lessons from setbacks" rows={3} maxLength={1000} value={aboutSelf.professional_failures} onChange={(e) => setAbout('professional_failures', e.target.value)} />
          </FormGrid>
          <FormGrid cols={3}>
            {[1, 2, 3].map((n) => (
              <Input key={`s${n}`} label={`Strength ${n}`} maxLength={100} value={aboutSelf[`strength${n}`]} onChange={(e) => setAbout(`strength${n}`, e.target.value)} />
            ))}
            {[1, 2, 3].map((n) => (
              <Input key={`w${n}`} label={`Area to improve ${n}`} maxLength={100} value={aboutSelf[`weakness${n}`]} onChange={(e) => setAbout(`weakness${n}`, e.target.value)} />
            ))}
          </FormGrid>
        </div>
      </FormSection>
    </StepCard>
  );
}
