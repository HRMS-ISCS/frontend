import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Briefcase } from 'lucide-react';

import { employeesApi, onboardingApi } from '@/api';
import { PATTERNS } from '@/lib/constants';
import { Alert, FormGrid, FormSection, Input, Select, Textarea } from '@/components/ui';
import { FileUpload } from '@/components/FileUpload';
import { RepeatableList, StepCard, YesNo, useRowErrors, validateRows } from '../shared';
import { generalIssue, rowIssues, serverIssues } from '../StepErrors';

const EXPERIENCE_DOCS = [
  { key: 'experience_letter', label: 'Experience letter' },
  { key: 'relieving_letter', label: 'Relieving letter' },
  { key: 'last_payslip', label: 'Last payslip' },
  { key: 'offer_letter', label: 'Offer letter' },
  { key: 'form_16', label: 'Form 16' },
];

// On-screen labels, for the error pop-up (questions are matched by their text).
const TRAINING_Q = 'Have you completed any professional training?';
const EXPERIENCE_Q = 'Do you have previous work experience?';
const TRAINING_FIELDS = { institute_name: 'Institute', area_of_training: 'Area of training', duration: 'Duration' };
const JOB_FIELDS = {
  company_name: 'Company',
  designation: 'Designation',
  period_from: 'From',
  period_to: 'To',
  hr_email: 'HR email',
  uan_number: 'UAN',
};

const newTraining = () => ({ institute_name: '', duration: '', area_of_training: '' });
const newJob = () => ({
  company_name: '',
  designation: '',
  employer_location: '',
  employer_id: '',
  rm_contact_no: '',
  hr_email: '',
  period_from: '',
  period_to: '',
  ctc: '',
  reason_for_leaving: '',
  uan_number: '',
});

export function Step4Experience({ employeeId, record, onSaved, onBack }) {
  const existingTraining = record?.professional_training || [];
  const existingJobs = record?.professional_experience || [];

  const [hasTraining, setHasTraining] = useState(existingTraining.length ? true : null);
  const [hasExperience, setHasExperience] = useState(existingJobs.length ? true : null);
  const [training, setTraining] = useState(
    existingTraining.map((t, i) => ({
      _key: `t${i}`,
      institute_name: t.institute_name || '',
      duration: t.duration || '',
      area_of_training: t.area_of_training || '',
    })),
  );
  const [jobs, setJobs] = useState(
    existingJobs.map((j, i) => ({
      _key: `j${i}`,
      company_name: j.company_name || '',
      designation: j.designation || '',
      employer_location: j.employer_location || '',
      employer_id: j.employer_id || '',
      rm_contact_no: j.rm_contact_no || '',
      hr_email: j.hr_email || '',
      period_from: j.period_from || '',
      period_to: j.period_to || '',
      ctc: j.ctc ? String(j.ctc) : '',
      reason_for_leaving: j.reason_for_leaving || '',
      uan_number: '',
    })),
  );
  const [docFiles, setDocFiles] = useState({});
  const [docCompany, setDocCompany] = useState(existingJobs[0]?.company_name || '');
  const trainingErrors = useRowErrors();
  const jobErrors = useRowErrors();
  const [choiceError, setChoiceError] = useState('');
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
    if (hasTraining === null || hasExperience === null) {
      setChoiceError('Please answer both questions before continuing.');
      setIssues([
        ...(hasTraining === null
          ? [{ section: 'Professional training', label: 'Professional training', target: TRAINING_Q, message: 'Answer Yes or No.' }]
          : []),
        ...(hasExperience === null
          ? [{ section: 'Work experience', label: 'Work experience', target: EXPERIENCE_Q, message: 'Answer Yes or No.' }]
          : []),
      ]);
      return;
    }
    setChoiceError('');

    const tErrors = hasTraining
      ? validateRows(training, (t) => ({
          ...(!t.institute_name.trim() && { institute_name: 'Required' }),
          ...(!t.duration.trim() && { duration: 'Required' }),
          ...(!t.area_of_training.trim() && { area_of_training: 'Required' }),
        }))
      : {};
    const jErrors = hasExperience
      ? validateRows(jobs, (j) => ({
          ...(!j.company_name.trim() && { company_name: 'Required' }),
          ...(!j.designation.trim() && { designation: 'Required' }),
          ...(!j.period_from && { period_from: 'Required' }),
          ...(j.period_from && j.period_to && j.period_to < j.period_from && { period_to: 'Must be after start date' }),
          ...(j.hr_email && !PATTERNS.email.test(j.hr_email) && { hr_email: 'Invalid email' }),
          ...(j.uan_number && !PATTERNS.uan.test(j.uan_number) && { uan_number: '12 digits' }),
        }))
      : {};
    trainingErrors.setRowErrors(tErrors);
    jobErrors.setRowErrors(jErrors);
    const empty = [
      ...(hasTraining && training.length === 0
        ? [generalIssue('Add at least one training programme, or select "No".', 'Professional training', 'Professional training')]
        : []),
      ...(hasExperience && jobs.length === 0
        ? [generalIssue('Add at least one previous employer, or select "No".', 'Work experience', 'Work experience')]
        : []),
    ];
    if (empty.length) {
      setChoiceError(empty[0].message);
      setIssues(empty);
      return;
    }
    if (Object.keys(tErrors).length || Object.keys(jErrors).length) {
      setIssues([
        ...rowIssues(tErrors, { section: 'Professional training', item: 'Training', fields: TRAINING_FIELDS }),
        ...rowIssues(jErrors, { section: 'Work experience', item: 'Employer', fields: JOB_FIELDS }),
      ]);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await employeesApi.update(employeeId, {
        professional_training: hasTraining
          ? training.map((t) => ({
              institute_name: t.institute_name.trim(),
              duration: t.duration.trim(),
              area_of_training: t.area_of_training.trim(),
            }))
          : [],
        professional_experience: hasExperience
          ? jobs.map((j) => ({
              company_name: j.company_name.trim(),
              designation: j.designation.trim(),
              employer_location: j.employer_location.trim() || null,
              employer_id: j.employer_id.trim() || null,
              rm_contact_no: j.rm_contact_no.trim() || null,
              hr_email: j.hr_email.trim().toLowerCase() || null,
              period_from: j.period_from || null,
              period_to: j.period_to || null,
              ctc: j.ctc ? Number(j.ctc) : null,
              reason_for_leaving: j.reason_for_leaving.trim() || null,
              uan_number: j.uan_number || null,
            }))
          : [],
      });

      // These all depend on the rows saved above, but not on each other, so
      // they run together. Record an explicit "none" so freshers can complete
      // this step.
      const files = Object.fromEntries(Object.entries(docFiles).filter(([, f]) => f));
      await Promise.all([
        !hasTraining && onboardingApi.setTraining(employeeId, { has_training: false }),
        !hasExperience && onboardingApi.setExperience(employeeId, { has_experience: false }),
        hasExperience &&
          Object.keys(files).length > 0 &&
          onboardingApi.uploadExperienceDocuments(employeeId, docCompany || jobs[0]?.company_name, files),
      ]);

      await onSaved(4);
    } catch (err) {
      setError(err);
      setIssues(serverIssues(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StepCard
      step={4}
      title="Training & experience"
      description="Freshers can simply answer “No” to both questions."
      onSubmit={submit}
      onBack={onBack}
      saving={saving}
      error={error}
      issues={issues}
      onIssuesClose={() => setIssues(null)}
    >
      <FormSection title="Professional training" description="Certifications or training programmes you have completed.">
        <div className="space-y-5">
          <YesNo label={TRAINING_Q} value={hasTraining} onChange={setHasTraining} />
          {hasTraining && (
            <RepeatableList
              items={training}
              onChange={setTraining}
              newItem={newTraining}
              addLabel="Add training"
              emptyTitle="No training added"
              emptyIcon={Award}
              itemTitle={(t, i) => t.area_of_training || `Training ${i + 1}`}
              renderItem={(t, i, update) => (
                <FormGrid cols={3}>
                  <Input label="Institute" required value={t.institute_name} onChange={(e) => update({ institute_name: e.target.value })} error={trainingErrors.errorFor(i, 'institute_name')} />
                  <Input label="Area of training" required value={t.area_of_training} onChange={(e) => update({ area_of_training: e.target.value })} error={trainingErrors.errorFor(i, 'area_of_training')} placeholder="e.g. Docker & Kubernetes" />
                  <Input label="Duration" required value={t.duration} onChange={(e) => update({ duration: e.target.value })} error={trainingErrors.errorFor(i, 'duration')} placeholder="e.g. 6 months" />
                </FormGrid>
              )}
            />
          )}
        </div>
      </FormSection>

      <FormSection title="Work experience" description="Previous employers, most recent first.">
        <div className="space-y-5">
          <YesNo label={EXPERIENCE_Q} value={hasExperience} onChange={setHasExperience} />
          {hasExperience && (
            <RepeatableList
              items={jobs}
              onChange={setJobs}
              newItem={newJob}
              addLabel="Add employer"
              emptyTitle="No employers added"
              emptyIcon={Briefcase}
              itemTitle={(j, i) => j.company_name || `Employer ${i + 1}`}
              renderItem={(j, i, update) => (
                <FormGrid cols={3}>
                  <Input label="Company" required value={j.company_name} onChange={(e) => update({ company_name: e.target.value })} error={jobErrors.errorFor(i, 'company_name')} />
                  <Input label="Designation" required value={j.designation} onChange={(e) => update({ designation: e.target.value })} error={jobErrors.errorFor(i, 'designation')} />
                  <Input label="Location" value={j.employer_location} onChange={(e) => update({ employer_location: e.target.value })} />
                  <Input label="From" type="date" required value={j.period_from} onChange={(e) => update({ period_from: e.target.value })} error={jobErrors.errorFor(i, 'period_from')} />
                  <Input label="To" type="date" value={j.period_to} onChange={(e) => update({ period_to: e.target.value })} error={jobErrors.errorFor(i, 'period_to')} />
                  <Input label="Annual CTC (₹)" inputMode="numeric" value={j.ctc} onChange={(e) => update({ ctc: e.target.value.replace(/[^\d.]/g, '') })} />
                  <Input label="Employee ID at company" value={j.employer_id} onChange={(e) => update({ employer_id: e.target.value })} />
                  <Input label="Manager contact" value={j.rm_contact_no} onChange={(e) => update({ rm_contact_no: e.target.value })} />
                  <Input label="HR email" type="email" value={j.hr_email} onChange={(e) => update({ hr_email: e.target.value })} error={jobErrors.errorFor(i, 'hr_email')} />
                  <Textarea label="Reason for leaving" rows={2} fieldClassName="sm:col-span-2 lg:col-span-3" value={j.reason_for_leaving} onChange={(e) => update({ reason_for_leaving: e.target.value })} />
                </FormGrid>
              )}
            />
          )}
        </div>
      </FormSection>

      {hasExperience && jobs.length > 0 && (
        <FormSection title="Previous employment documents" description="Optional. PDF, JPG or PNG up to 5 MB each.">
          <div className="space-y-4">
            {jobs.length > 1 && (
              <Select
                label="Link documents to"
                value={docCompany}
                onChange={(e) => setDocCompany(e.target.value)}
                placeholder={null}
                options={jobs.filter((j) => j.company_name).map((j) => j.company_name)}
                fieldClassName="max-w-sm"
              />
            )}
            <FormGrid cols={3}>
              {EXPERIENCE_DOCS.map((d) => (
                <FileUpload
                  key={d.key}
                  label={d.label}
                  compact
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxMB={5}
                  existing={docs?.experience_documents?.[d.key]?.sas_url}
                  file={docFiles[d.key]}
                  onChange={(f) => setDocFiles((prev) => ({ ...prev, [d.key]: f }))}
                />
              ))}
            </FormGrid>
          </div>
        </FormSection>
      )}

      {choiceError && (
        <div className="pt-6">
          <Alert tone="warning">{choiceError}</Alert>
        </div>
      )}
    </StepCard>
  );
}
