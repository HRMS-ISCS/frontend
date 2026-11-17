import { useState } from 'react';

import { onboardingApi } from '@/api';
import { BLOOD_GROUPS, GENDERS, INDIAN_STATES, PATTERNS } from '@/lib/constants';
import { useForm, validate } from '@/lib/hooks';
import { Checkbox, FormGrid, FormSection, Input, Select } from '@/components/ui';
import { FileUpload } from '@/components/FileUpload';
import { StepCard, clean } from '../shared';
import { fieldIssues, serverIssues } from '../StepErrors';

const OPTIONAL = [
  'middle_name',
  'blood_group',
  'current_address_district',
  'current_address_city',
  'current_address_state',
  'current_address_pin_code',
  'permanent_address_district',
  'permanent_address_city',
  'permanent_address_state',
  'permanent_address_pin_code',
  'emergency_contact_name',
  'emergency_contact_relation',
  'emergency_contact_mobile',
  'emergency_contact_mail_id',
  'passport_no',
  'uan_number',
  'esi_no',
];

// On-screen label and section of each field, for the error pop-up.
const FIELDS = {
  first_name: { label: 'First name', section: 'Personal information' },
  last_name: { label: 'Last name', section: 'Personal information' },
  date_of_birth: { label: 'Date of birth', section: 'Personal information' },
  gender: { label: 'Gender', section: 'Personal information' },
  nationality: { label: 'Nationality', section: 'Personal information' },
  current_address_pin_code: { label: 'Current address PIN code', target: 'PIN code', section: 'Current address' },
  permanent_address_pin_code: { label: 'Permanent address PIN code', target: 'PIN code', section: 'Permanent address' },
  emergency_contact_mobile: { label: 'Emergency contact mobile', target: 'Mobile', section: 'Emergency contact' },
  emergency_contact_mail_id: { label: 'Emergency contact email', target: 'Email', section: 'Emergency contact' },
  // The server reports an invalid mobile on this step as "mobile".
  phone: { label: 'Emergency contact mobile', target: 'Mobile', section: 'Emergency contact' },
  aadhar_no: { label: 'Aadhaar number', section: 'Government IDs' },
  pan_card_no: { label: 'PAN', section: 'Government IDs' },
  passport_no: { label: 'Passport number', section: 'Government IDs' },
  uan_number: { label: 'UAN', section: 'Government IDs' },
  esi_no: { label: 'ESI number', section: 'Government IDs' },
  aadhar_card: { label: 'Aadhaar card', section: 'Documents' },
  pan_card: { label: 'PAN card', section: 'Documents' },
  profile_photo: { label: 'Profile photo', section: 'Documents' },
  resume: { label: 'Resume', section: 'Documents' },
};

const upper = (v) => v.toUpperCase().replace(/\s/g, '');
const digits = (v) => v.replace(/\D/g, '');

export function Step2Personal({ employeeId, record, onSaved, onBack }) {
  const p = record?.personal_profile || {};
  const nameParts = (record?.name || '').split(' ');
  const { values, set, errors, setErrors } = useForm({
    first_name: p.first_name || nameParts[0] || '',
    middle_name: p.middle_name || (nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : ''),
    last_name: p.last_name || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''),
    date_of_birth: p.date_of_birth || '',
    gender: p.gender || '',
    blood_group: p.blood_group || '',
    nationality: p.nationality || 'Indian',
    current_address_city: p.current_address_city || '',
    current_address_district: p.current_address_district || '',
    current_address_state: p.current_address_state || '',
    current_address_pin_code: p.current_address_pin_code || '',
    permanent_address_city: p.permanent_address_city || '',
    permanent_address_district: p.permanent_address_district || '',
    permanent_address_state: p.permanent_address_state || '',
    permanent_address_pin_code: p.permanent_address_pin_code || '',
    emergency_contact_name: p.emergency_contact_name || '',
    emergency_contact_relation: p.emergency_contact_relation || '',
    emergency_contact_mobile: p.emergency_contact_mobile || '',
    emergency_contact_mail_id: p.emergency_contact_mail_id || '',
    aadhar_no: p.aadhar_no || '',
    pan_card_no: p.pan_card_no || '',
    passport_no: p.passport_no || '',
    uan_number: p.uan_number || '',
    esi_no: p.esi_no || '',
  });
  const [sameAddress, setSameAddress] = useState(false);
  const [files, setFiles] = useState({ aadhar_card: null, pan_card: null, resume: null, profile_photo: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [issues, setIssues] = useState(null);

  const pin = (v) => (v && !PATTERNS.pin.test(v) ? 'PIN code must be 6 digits' : undefined);

  const submit = async () => {
    const found = validate(values, {
      first_name: (v) => (!v?.trim() ? 'First name is required' : undefined),
      last_name: (v) => (!v?.trim() ? 'Last name is required' : undefined),
      date_of_birth: (v) => (!v ? 'Date of birth is required' : undefined),
      gender: (v) => (!v ? 'Select gender' : undefined),
      nationality: (v) => (!v?.trim() ? 'Nationality is required' : undefined),
      aadhar_no: (v) => (!PATTERNS.aadhaar.test(v || '') ? 'Aadhaar must be 12 digits' : undefined),
      pan_card_no: (v) => (!PATTERNS.pan.test(v || '') ? 'PAN format: ABCDE1234F' : undefined),
      passport_no: (v) => (v && !PATTERNS.passport.test(v) ? 'Passport format: A1234567' : undefined),
      uan_number: (v) => (v && !PATTERNS.uan.test(v) ? 'UAN must be 12 digits' : undefined),
      esi_no: (v) => (v && !PATTERNS.esi.test(v) ? 'ESI number must be 17 digits' : undefined),
      current_address_pin_code: pin,
      permanent_address_pin_code: (v, all) => (sameAddress ? pin(all.current_address_pin_code) : pin(v)),
      emergency_contact_mobile: (v) => (v && !/^\d{10,15}$/.test(v) ? 'Enter 10-15 digits' : undefined),
      emergency_contact_mail_id: (v) => (v && !PATTERNS.email.test(v) ? 'Enter a valid email' : undefined),
    });
    const docErrors = {};
    if (!p.aadhar_doc_url && !files.aadhar_card) docErrors.aadhar_card = 'Upload your Aadhaar card';
    if (!p.pan_doc_url && !files.pan_card) docErrors.pan_card = 'Upload your PAN card';
    if (!p.profile_photo_url && !files.profile_photo) docErrors.profile_photo = 'Upload a profile photo';
    setErrors({ ...found, ...docErrors });
    if (Object.keys(found).length || Object.keys(docErrors).length) {
      // The pop-up lists every problem and takes them to the first one.
      setIssues(fieldIssues({ ...found, ...docErrors }, FIELDS));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const data = { ...values };
      if (sameAddress) {
        ['city', 'district', 'state', 'pin_code'].forEach((k) => {
          data[`permanent_address_${k}`] = data[`current_address_${k}`];
        });
      }
      const body = clean(data, OPTIONAL);
      if (record?.personal_profile) await onboardingApi.updatePersonal(employeeId, body);
      else await onboardingApi.createPersonal(employeeId, body);

      if (Object.values(files).some(Boolean)) {
        await onboardingApi.uploadPersonalDocuments(employeeId, files);
      }
      await onSaved(2);
    } catch (err) {
      setError(err);
      setIssues(serverIssues(err, FIELDS));
    } finally {
      setSaving(false);
    }
  };

  const address = (prefix, disabled) => (
    <FormGrid cols={4}>
      <Input label="City" value={values[`${prefix}_city`]} onChange={(e) => set(`${prefix}_city`, e.target.value)} disabled={disabled} />
      <Input label="District" value={values[`${prefix}_district`]} onChange={(e) => set(`${prefix}_district`, e.target.value)} disabled={disabled} />
      <Select label="State" value={values[`${prefix}_state`]} onChange={(e) => set(`${prefix}_state`, e.target.value)} options={INDIAN_STATES} disabled={disabled} />
      <Input
        label="PIN code"
        inputMode="numeric"
        maxLength={6}
        value={values[`${prefix}_pin_code`]}
        onChange={(e) => set(`${prefix}_pin_code`, digits(e.target.value))}
        error={errors[`${prefix}_pin_code`]}
        disabled={disabled}
      />
    </FormGrid>
  );

  return (
    <StepCard
      step={2}
      title="Personal profile"
      description="Your identity details must match your government documents exactly."
      onSubmit={submit}
      onBack={onBack}
      saving={saving}
      savingMessage="Saving your details and uploading your documents. This can take up to 10 seconds."
      error={error}
      issues={issues}
      onIssuesClose={() => setIssues(null)}
    >
      <FormSection title="Personal information">
        <FormGrid cols={3}>
          <Input label="First name" required value={values.first_name} onChange={(e) => set('first_name', e.target.value)} error={errors.first_name} />
          <Input label="Middle name" value={values.middle_name} onChange={(e) => set('middle_name', e.target.value)} />
          <Input label="Last name" required value={values.last_name} onChange={(e) => set('last_name', e.target.value)} error={errors.last_name} />
          <Input label="Date of birth" type="date" required value={values.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} error={errors.date_of_birth} max={new Date().toISOString().slice(0, 10)} />
          <Select label="Gender" required value={values.gender} onChange={(e) => set('gender', e.target.value)} options={GENDERS} error={errors.gender} />
          <Select label="Blood group" value={values.blood_group} onChange={(e) => set('blood_group', e.target.value)} options={BLOOD_GROUPS} />
          <Input label="Nationality" required value={values.nationality} onChange={(e) => set('nationality', e.target.value)} error={errors.nationality} />
        </FormGrid>
      </FormSection>

      <FormSection title="Current address">{address('current_address', false)}</FormSection>

      <FormSection
        title="Permanent address"
        actions={<Checkbox label="Same as current" checked={sameAddress} onChange={setSameAddress} />}
      >
        {sameAddress ? (
          <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">Your permanent address will be saved as your current address.</p>
        ) : (
          address('permanent_address', false)
        )}
      </FormSection>

      <FormSection title="Emergency contact">
        <FormGrid cols={4}>
          <Input label="Name" value={values.emergency_contact_name} onChange={(e) => set('emergency_contact_name', e.target.value)} />
          <Input label="Relationship" value={values.emergency_contact_relation} onChange={(e) => set('emergency_contact_relation', e.target.value)} placeholder="e.g. Father" />
          <Input label="Mobile" inputMode="numeric" maxLength={15} value={values.emergency_contact_mobile} onChange={(e) => set('emergency_contact_mobile', digits(e.target.value))} error={errors.emergency_contact_mobile} />
          <Input label="Email" type="email" value={values.emergency_contact_mail_id} onChange={(e) => set('emergency_contact_mail_id', e.target.value)} error={errors.emergency_contact_mail_id} />
        </FormGrid>
      </FormSection>

      <FormSection title="Government IDs" description="Stored securely and visible only to HR.">
        <FormGrid cols={3}>
          <Input label="Aadhaar number" required inputMode="numeric" maxLength={12} value={values.aadhar_no} onChange={(e) => set('aadhar_no', digits(e.target.value))} error={errors.aadhar_no} />
          <Input label="PAN" required maxLength={10} value={values.pan_card_no} onChange={(e) => set('pan_card_no', upper(e.target.value))} error={errors.pan_card_no} placeholder="ABCDE1234F" />
          <Input label="Passport number" maxLength={8} value={values.passport_no} onChange={(e) => set('passport_no', upper(e.target.value))} error={errors.passport_no} />
          <Input label="UAN" inputMode="numeric" maxLength={12} value={values.uan_number} onChange={(e) => set('uan_number', digits(e.target.value))} error={errors.uan_number} hint="From your previous employer's PF" />
          <Input label="ESI number" inputMode="numeric" maxLength={17} value={values.esi_no} onChange={(e) => set('esi_no', digits(e.target.value))} error={errors.esi_no} />
        </FormGrid>
      </FormSection>

      <FormSection title="Documents" description="PDF or JPG for ID proofs. Images are compressed automatically.">
        <FormGrid>
          {[
            { key: 'aadhar_card', label: 'Aadhaar card', accept: '.pdf,.jpg,.jpeg', maxMB: 3, existing: p.aadhar_doc_url, required: true },
            { key: 'pan_card', label: 'PAN card', accept: '.pdf,.jpg,.jpeg', maxMB: 3, existing: p.pan_doc_url, required: true },
            { key: 'profile_photo', label: 'Profile photo', accept: '.jpg,.jpeg,.png', maxMB: 5, existing: p.profile_photo_url, required: true },
            { key: 'resume', label: 'Resume', accept: '.pdf,.doc,.docx', maxMB: 10, existing: p.resume_doc_url },
          ].map((doc) => (
            <div key={doc.key}>
              <FileUpload
                label={doc.label}
                required={doc.required}
                accept={doc.accept}
                maxMB={doc.maxMB}
                existing={doc.existing}
                file={files[doc.key]}
                onChange={(f) => {
                  setFiles((prev) => ({ ...prev, [doc.key]: f }));
                  setErrors((e) => ({ ...e, [doc.key]: undefined }));
                }}
              />
              {errors[doc.key] && <p className="error-text">{errors[doc.key]}</p>}
            </div>
          ))}
        </FormGrid>
      </FormSection>
    </StepCard>
  );
}
