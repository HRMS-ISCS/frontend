import { Award, Briefcase, Contact, GraduationCap, HeartHandshake, Landmark, User, Users } from 'lucide-react';

import { formatDate, formatINR } from '@/lib/format';
import { Badge, Card, DefinitionList, EmptyState } from '@/components/ui';
import { ResponsiveTable } from '@/components/ResponsiveTable';

const mask = (value, visible = 4) => {
  if (!value) return null;
  const s = String(value);
  return s.length <= visible ? s : `${'•'.repeat(Math.max(s.length - visible, 0))}${s.slice(-visible)}`;
};

const address = (p, prefix) =>
  [p?.[`${prefix}_city`], p?.[`${prefix}_district`], p?.[`${prefix}_state`], p?.[`${prefix}_pin_code`]]
    .filter(Boolean)
    .join(', ');

export function PersonalSection({ record, revealIds = false }) {
  const p = record?.personal_profile;
  if (!p) {
    return (
      <Card title="Personal profile" icon={User}>
        <EmptyState title="Personal profile not submitted yet" />
      </Card>
    );
  }
  const show = (v) => (revealIds ? v : mask(v));
  return (
    <div className="space-y-5">
      <Card title="Personal information" icon={User}>
        <DefinitionList
          cols={3}
          items={[
            { label: 'Full name', value: [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ') },
            { label: 'Date of birth', value: formatDate(p.date_of_birth) },
            { label: 'Gender', value: p.gender },
            { label: 'Blood group', value: p.blood_group },
            { label: 'Nationality', value: p.nationality },
            { label: 'Current address', value: address(p, 'current_address'), full: false },
            { label: 'Permanent address', value: address(p, 'permanent_address') },
          ]}
        />
      </Card>
      <Card title="Government IDs" icon={Contact} subtitle={revealIds ? undefined : 'Partially hidden for your privacy'}>
        <DefinitionList
          cols={3}
          items={[
            { label: 'Aadhaar', value: show(p.aadhar_no) },
            { label: 'PAN', value: show(p.pan_card_no) },
            { label: 'Passport', value: show(p.passport_no) },
            { label: 'UAN', value: show(p.uan_number) },
            { label: 'ESI number', value: show(p.esi_no) },
          ]}
        />
      </Card>
      <Card title="Emergency contact" icon={HeartHandshake}>
        <DefinitionList
          cols={3}
          items={[
            { label: 'Name', value: p.emergency_contact_name },
            { label: 'Relationship', value: p.emergency_contact_relation },
            { label: 'Mobile', value: p.emergency_contact_mobile },
            { label: 'Email', value: p.emergency_contact_mail_id },
          ]}
        />
      </Card>
    </div>
  );
}

export function BankFamilySection({ record, revealIds = false }) {
  const bank = record?.bank_account;
  const marital = record?.marital_status?.[0];
  const family = record?.family_background || [];
  return (
    <div className="space-y-5">
      <Card title="Bank account" icon={Landmark}>
        {bank ? (
          <DefinitionList
            cols={3}
            items={[
              { label: 'Bank', value: bank.bank_name },
              { label: 'Branch', value: bank.branch_name },
              { label: 'Account type', value: bank.account_type },
              { label: 'Account number', value: revealIds ? bank.account_number : mask(bank.account_number) },
              { label: 'IFSC', value: bank.ifsc_code },
            ]}
          />
        ) : (
          <EmptyState title="Bank details not submitted" className="py-6" />
        )}
      </Card>
      <Card title="Family" icon={Users} actions={marital?.marital_status && <Badge>{marital.marital_status}</Badge>}>
        {family.length ? (
          <div className="-mx-5 -my-5">
            <ResponsiveTable
              rows={family}
              rowKey={(f, i) => i}
              breakpoint="sm"
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  role: 'primary',
                  className: 'font-semibold text-slate-800',
                  cell: (f) => <span className="font-semibold text-slate-800">{f.name || '—'}</span>,
                },
                { key: 'relationship', header: 'Relationship', cell: (f) => f.relationship_status },
                { key: 'gender', header: 'Gender', cell: (f) => f.gender || '—' },
                { key: 'dob', header: 'Date of birth', cell: (f) => <span className="tabular">{formatDate(f.date_of_birth)}</span> },
              ]}
            />
          </div>
        ) : (
          <EmptyState title="No family members added" className="py-6" />
        )}
      </Card>
    </div>
  );
}

function Timeline({ items, empty }) {
  if (!items.length) return <EmptyState title={empty} className="py-6" />;
  return (
    <ol className="relative space-y-6 border-l border-slate-200 pl-6">
      {items.map((item, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500 ring-2 ring-brand-100" />
          {item}
        </li>
      ))}
    </ol>
  );
}

export function CareerSection({ record }) {
  const education = record?.academic_background || [];
  const jobs = record?.professional_experience || [];
  const training = record?.professional_training || [];
  return (
    <div className="space-y-5">
      <Card title="Work experience" icon={Briefcase}>
        <Timeline
          empty="No previous experience"
          items={jobs.map((j, i) => (
            <div key={i}>
              <p className="font-semibold text-slate-800">{j.designation || 'Role'}</p>
              <p className="text-sm text-slate-600">
                {j.company_name}
                {j.employer_location ? ` · ${j.employer_location}` : ''}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatDate(j.period_from)} – {j.period_to ? formatDate(j.period_to) : 'Present'}
                {j.ctc ? ` · CTC ${formatINR(j.ctc)}` : ''}
              </p>
              {j.reason_for_leaving && <p className="mt-1 text-sm text-slate-500">{j.reason_for_leaving}</p>}
            </div>
          ))}
        />
      </Card>
      <Card title="Education" icon={GraduationCap}>
        <Timeline
          empty="No qualifications added"
          items={education.map((a, i) => (
            <div key={i}>
              <p className="font-semibold text-slate-800">
                {a.qualification}
                {a.specification ? ` · ${a.specification}` : ''}
              </p>
              <p className="text-sm text-slate-600">{a.institute_name}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Passed {a.year_of_passing}
                {a.rank_or_grade ? ` · ${a.rank_or_grade}` : ''}
              </p>
            </div>
          ))}
        />
      </Card>
      {training.length > 0 && (
        <Card title="Training" icon={Award}>
          <ul className="divide-y divide-slate-100">
            {training.map((t, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                <div>
                  <p className="font-semibold text-slate-800">{t.area_of_training}</p>
                  <p className="text-sm text-slate-500">{t.institute_name}</p>
                </div>
                <Badge>{t.duration}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export function ReferencesSection({ record }) {
  const refs = record?.professional_reference || [];
  const about = record?.about_self;
  const strengths = [about?.strength1, about?.strength2, about?.strength3].filter(Boolean);
  const weaknesses = [about?.weakness1, about?.weakness2, about?.weakness3].filter(Boolean);
  return (
    <div className="space-y-5">
      <Card title="References" icon={Contact}>
        {refs.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {refs.map((r, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-800">{r.name}</p>
                <p className="text-sm text-slate-600">{[r.designation, r.company].filter(Boolean).join(' · ')}</p>
                <p className="mt-2 text-xs text-slate-500">{[r.tel_no, r.email].filter(Boolean).join(' · ')}</p>
                {r.capacity_known && <p className="mt-1 text-xs text-slate-500">{r.capacity_known}{r.period_known ? ` · ${r.period_known}` : ''}</p>}
                {r.referred_by_employee_ISCS && <Badge tone="brand" className="mt-2">ISCS referral</Badge>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No references added" className="py-6" />
        )}
      </Card>
      {about && (
        <Card title="About">
          <div className="space-y-4 text-sm">
            {about.career_ambition && (
              <div>
                <p className="eyebrow">Career ambition</p>
                <p className="mt-1 text-slate-700">{about.career_ambition}</p>
              </div>
            )}
            {about.significant_achievements && (
              <div>
                <p className="eyebrow">Achievements</p>
                <p className="mt-1 text-slate-700">{about.significant_achievements}</p>
              </div>
            )}
            {(strengths.length > 0 || weaknesses.length > 0) && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="eyebrow">Strengths</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {strengths.map((s) => <Badge key={s} tone="success">{s}</Badge>)}
                  </div>
                </div>
                <div>
                  <p className="eyebrow">Areas to improve</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {weaknesses.map((s) => <Badge key={s} tone="warning">{s}</Badge>)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
