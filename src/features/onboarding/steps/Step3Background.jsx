import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Users } from 'lucide-react';

import { employeesApi, onboardingApi } from '@/api';
import { ACCOUNT_TYPES, GENDERS, MARITAL_STATUSES, PATTERNS, QUALIFICATIONS, RELATIONSHIPS } from '@/lib/constants';
import { useForm, validate } from '@/lib/hooks';
import { FormGrid, FormSection, Input, Select } from '@/components/ui';
import { FileUpload } from '@/components/FileUpload';
import { RepeatableList, StepCard, ageFrom, useRowErrors, validateRows } from '../shared';
import { fieldIssues, rowIssues, serverIssues } from '../StepErrors';

const CERTIFICATES = [
  { key: 'ssc', file: 'ssc_certificate', label: 'SSC / 10th' },
  { key: 'inter', file: 'inter_certificate', label: 'Intermediate / 12th' },
  { key: 'grad', file: 'grad_certificate', label: 'Graduation' },
  { key: 'postgrad', file: 'postgrad_certificate', label: 'Post graduation' },
  { key: 'diploma', file: 'diploma_certificate', label: 'Diploma' },
  { key: 'other', file: 'other_certificate', label: 'Other certification' },
];

// On-screen label and section of each field, for the error pop-up.
const FIELDS = {
  bank_name: { label: 'Bank name', section: 'Bank account' },
  account_type: { label: 'Account type', section: 'Bank account' },
  account_number: { label: 'Account number', section: 'Bank account' },
  ifsc_code: { label: 'IFSC code', section: 'Bank account' },
  marital_status: { label: 'Marital status', section: 'Marital status' },
};
const FAMILY_FIELDS = { relationship_status: 'Relationship', name: 'Name', gender: 'Gender', date_of_birth: 'Date of birth' };
const EDUCATION_FIELDS = { qualification: 'Qualification', institute_name: 'Institute', year_of_passing: 'Year of passing' };

const newMember = () => ({ relationship_status: '', name: '', gender: '', date_of_birth: '', age: '' });
const newQualification = () => ({
  qualification: '',
  specification: '',
  institute_name: '',
  year_of_passing: '',
  duration_from: '',
  duration_to: '',
  rank_or_grade: '',
});

export function Step3Background({ employeeId, record, onSaved, onBack }) {
  const bank = record?.bank_account || {};
  const marital = record?.marital_status?.[0] || {};

  const { values, set, errors, setErrors } = useForm({
    bank_name: bank.bank_name || '',
    branch_name: bank.branch_name || '',
    account_number: bank.account_number || '',
    ifsc_code: bank.ifsc_code || '',
    account_type: bank.account_type || '',
    marital_status: marital.marital_status || '',
    marriage_date: marital.marriage_date || '',
  });

  const [family, setFamily] = useState(
    (record?.family_background || []).map((f, i) => ({
      _key: `f${i}`,
      relationship_status: f.relationship_status || '',
      name: f.name || '',
      gender: f.gender || '',
      date_of_birth: f.date_of_birth || '',
      age: f.age != null ? String(f.age) : '',
    })),
  );
  const [education, setEducation] = useState(
    (record?.academic_background || []).map((a, i) => ({
      _key: `a${i}`,
      qualification: a.qualification || '',
      specification: a.specification || '',
      institute_name: a.institute_name || '',
      year_of_passing: a.year_of_passing ? String(a.year_of_passing) : '',
      duration_from: a.duration_from || '',
      duration_to: a.duration_to || '',
      rank_or_grade: a.rank_or_grade || '',
    })),
  );
  const [certificates, setCertificates] = useState({});
  const familyErrors = useRowErrors();
  const educationErrors = useRowErrors();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [issues, setIssues] = useState(null);

  const { data: docs } = useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: () => employeesApi.documents(employeeId),
    enabled: Boolean(employeeId),
    retry: false,
  });

  const submit = async () => {
    const found = validate(values, {
      bank_name: (v) => (!v?.trim() ? 'Bank name is required' : undefined),
      account_number: (v) => (!/^\d{10,20}$/.test(v || '') ? 'Account number must be 10-20 digits' : undefined),
      ifsc_code: (v) => (!PATTERNS.ifsc.test(v || '') ? 'IFSC format: SBIN0001234' : undefined),
      account_type: (v) => (!v ? 'Select account type' : undefined),
      marital_status: (v) => (!v ? 'Select marital status' : undefined),
    });
    const fErrors = validateRows(family, (m) => ({
      ...(!m.relationship_status && { relationship_status: 'Required' }),
      ...(!m.name?.trim() && { name: 'Required' }),
    }));
    const eErrors = validateRows(education, (q) => ({
      ...(!q.qualification && { qualification: 'Required' }),
      ...(!q.institute_name?.trim() && { institute_name: 'Required' }),
      ...(!/^\d{4}$/.test(q.year_of_passing) && { year_of_passing: 'Enter a 4 digit year' }),
    }));
    setErrors(found);
    familyErrors.setRowErrors(fErrors);
    educationErrors.setRowErrors(eErrors);
    if (Object.keys(found).length || Object.keys(fErrors).length || Object.keys(eErrors).length) {
      setIssues([
        ...fieldIssues(found, FIELDS),
        ...rowIssues(fErrors, { section: 'Family members', item: 'Family member', fields: FAMILY_FIELDS }),
        ...rowIssues(eErrors, { section: 'Education', item: 'Qualification', fields: EDUCATION_FIELDS }),
      ]);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const bankBody = {
        bank_name: values.bank_name.trim(),
        branch_name: values.branch_name.trim() || null,
        account_number: values.account_number.trim(),
        ifsc_code: values.ifsc_code.trim(),
        account_type: values.account_type,
      };
      const maritalBody = {
        marital_status: values.marital_status,
        marriage_date: values.marital_status === 'Single' ? null : values.marriage_date || null,
      };

      // Bank, marital status and the lists live in separate tables, so they
      // are saved at the same time rather than one after another.
      await Promise.all([
        record?.bank_account
          ? onboardingApi.updateBank(employeeId, bankBody)
          : onboardingApi.createBank(employeeId, bankBody),
        record?.marital_status?.length
          ? onboardingApi.updateMarital(employeeId, maritalBody)
          : onboardingApi.createMarital(employeeId, maritalBody),
        // Lists are replaced as a whole through the unified profile update.
        employeesApi.update(employeeId, {
          family_background: family.map((m) => ({
            relationship_status: m.relationship_status,
            name: m.name.trim(),
            gender: m.gender || null,
            date_of_birth: m.date_of_birth || null,
            age: m.age ? Number(m.age) : null,
          })),
          academic_background: education.map((q) => ({
            qualification: q.qualification,
            specification: q.specification.trim() || null,
            institute_name: q.institute_name.trim(),
            year_of_passing: Number(q.year_of_passing),
            duration_from: q.duration_from || null,
            duration_to: q.duration_to || null,
            rank_or_grade: q.rank_or_grade ? String(q.rank_or_grade) : null,
          })),
        }),
      ]);

      // Certificates link to the education rows saved above, so they go after.
      const certFiles = Object.fromEntries(Object.entries(certificates).filter(([, f]) => f));
      if (Object.keys(certFiles).length) await onboardingApi.uploadCertificates(employeeId, certFiles);

      await onSaved(3);
    } catch (err) {
      setError(err);
      setIssues(serverIssues(err, FIELDS));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StepCard
      step={3}
      title="Bank, family & education"
      description="Your salary is credited to this bank account."
      onSubmit={submit}
      onBack={onBack}
      saving={saving}
      error={error}
      issues={issues}
      onIssuesClose={() => setIssues(null)}
    >
      <FormSection title="Bank account">
        <FormGrid cols={3}>
          <Input label="Bank name" required value={values.bank_name} onChange={(e) => set('bank_name', e.target.value)} error={errors.bank_name} placeholder="e.g. Axis Bank" />
          <Input label="Branch" value={values.branch_name} onChange={(e) => set('branch_name', e.target.value)} />
          <Select label="Account type" required value={values.account_type} onChange={(e) => set('account_type', e.target.value)} options={ACCOUNT_TYPES} error={errors.account_type} />
          <Input label="Account number" required inputMode="numeric" maxLength={20} value={values.account_number} onChange={(e) => set('account_number', e.target.value.replace(/\D/g, ''))} error={errors.account_number} />
          <Input label="IFSC code" required maxLength={11} value={values.ifsc_code} onChange={(e) => set('ifsc_code', e.target.value.toUpperCase().replace(/\s/g, ''))} error={errors.ifsc_code} />
        </FormGrid>
      </FormSection>

      <FormSection title="Marital status">
        <FormGrid cols={3}>
          <Select label="Marital status" required value={values.marital_status} onChange={(e) => set('marital_status', e.target.value)} options={MARITAL_STATUSES} error={errors.marital_status} />
          {values.marital_status && values.marital_status !== 'Single' && (
            <Input label="Date of marriage" type="date" value={values.marriage_date} onChange={(e) => set('marriage_date', e.target.value)} />
          )}
        </FormGrid>
      </FormSection>

      <FormSection title="Family members" description="Parents, spouse and children.">
        <RepeatableList
          items={family}
          onChange={setFamily}
          newItem={newMember}
          addLabel="Add family member"
          emptyTitle="No family members added"
          emptyIcon={Users}
          itemTitle={(m, i) => m.name || `Family member ${i + 1}`}
          renderItem={(m, i, update) => (
            <FormGrid cols={4}>
              <Select label="Relationship" required value={m.relationship_status} onChange={(e) => update({ relationship_status: e.target.value })} options={RELATIONSHIPS} error={familyErrors.errorFor(i, 'relationship_status')} />
              <Input label="Name" required value={m.name} onChange={(e) => update({ name: e.target.value })} error={familyErrors.errorFor(i, 'name')} />
              <Select label="Gender" value={m.gender} onChange={(e) => update({ gender: e.target.value })} options={GENDERS} />
              <Input label="Date of birth" type="date" value={m.date_of_birth} onChange={(e) => update({ date_of_birth: e.target.value, age: ageFrom(e.target.value) })} />
            </FormGrid>
          )}
        />
      </FormSection>

      <FormSection title="Education" description="Add your qualifications, highest first.">
        <RepeatableList
          items={education}
          onChange={setEducation}
          newItem={newQualification}
          addLabel="Add qualification"
          emptyTitle="No qualifications added"
          emptyIcon={GraduationCap}
          itemTitle={(q, i) => q.qualification || `Qualification ${i + 1}`}
          renderItem={(q, i, update) => (
            <FormGrid cols={3}>
              <Select label="Qualification" required value={q.qualification} onChange={(e) => update({ qualification: e.target.value })} options={QUALIFICATIONS} error={educationErrors.errorFor(i, 'qualification')} />
              <Input label="Specialisation" value={q.specification} onChange={(e) => update({ specification: e.target.value })} placeholder="e.g. Computer Science" />
              <Input label="Institute" required value={q.institute_name} onChange={(e) => update({ institute_name: e.target.value })} error={educationErrors.errorFor(i, 'institute_name')} />
              <Input label="Year of passing" required inputMode="numeric" maxLength={4} value={q.year_of_passing} onChange={(e) => update({ year_of_passing: e.target.value.replace(/\D/g, '') })} error={educationErrors.errorFor(i, 'year_of_passing')} />
              <Input label="From" type="date" value={q.duration_from} onChange={(e) => update({ duration_from: e.target.value })} />
              <Input label="To" type="date" value={q.duration_to} onChange={(e) => update({ duration_to: e.target.value })} />
              <Input label="Grade / percentage" value={q.rank_or_grade} onChange={(e) => update({ rank_or_grade: e.target.value })} placeholder="e.g. 8.2 CGPA or 76%" />
            </FormGrid>
          )}
        />
      </FormSection>

      <FormSection title="Certificates" description="Optional. PDF, JPG or PNG up to 5 MB each.">
        <FormGrid cols={3}>
          {CERTIFICATES.map((c) => (
            <FileUpload
              key={c.key}
              label={c.label}
              compact
              accept=".pdf,.jpg,.jpeg,.png"
              maxMB={5}
              existing={docs?.education_certificates?.[c.file]?.sas_url}
              file={certificates[c.key]}
              onChange={(f) => setCertificates((prev) => ({ ...prev, [c.key]: f }))}
            />
          ))}
        </FormGrid>
      </FormSection>
    </StepCard>
  );
}
