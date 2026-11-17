import { useRef, useState } from 'react';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';

import { Alert, Button, EmptyState } from '@/components/ui';
import { SavingOverlay } from './SavingOverlay';
import { ErrorSummaryModal } from './StepErrors';

/** Convert '' to null for optional fields - the backend rejects empty strings on length-checked fields. */
export function clean(values, optionalKeys = []) {
  const out = { ...values };
  Object.keys(out).forEach((key) => {
    if (typeof out[key] === 'string') out[key] = out[key].trim();
    if ((optionalKeys === 'all' || optionalKeys.includes(key)) && out[key] === '') out[key] = null;
  });
  return out;
}

export function dateOnly(value) {
  return value ? String(value).slice(0, 10) : '';
}

export function ageFrom(dob) {
  if (!dob) return '';
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? String(age) : '';
}

export function StepCard({
  step, title, description, children, onBack, onSubmit, saving, error, submitLabel, extraActions, savingMessage,
  // Pop-up listing what to fix (see StepErrors.jsx). null/[] = hidden.
  issues, onIssuesClose,
}) {
  const formRef = useRef(null);
  return (
    <>
    <SavingOverlay show={Boolean(saving)} message={savingMessage} />
    <ErrorSummaryModal
      issues={issues}
      root={formRef.current}
      onClose={() => onIssuesClose?.()}
      onRetry={onSubmit}
    />
    <form
      ref={formRef}
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      noValidate
    >
      <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
        <p className="text-micro font-semibold uppercase text-brand-600">Step {step} of 6</p>
        <h2 className="mt-1.5 text-display-sm text-slate-900">{title}</h2>
        {description && <p className="mt-1.5 text-body text-slate-500">{description}</p>}
      </div>
      <div className="divide-y divide-slate-100 px-6 py-6 sm:px-8">{children}</div>
      {error && (
        <div className="px-6 pb-4 sm:px-8">
          <Alert tone="danger" title="Could not save this step">
            {error.message}
          </Alert>
        </div>
      )}
      {onSubmit && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:px-8">
          <div>
            {onBack && (
              <Button variant="ghost" icon={ArrowLeft} onClick={onBack} disabled={saving}>
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {extraActions}
            <Button type="submit" loading={saving} iconRight={ArrowRight}>
              {submitLabel || 'Save & continue'}
            </Button>
          </div>
        </div>
      )}
    </form>
    </>
  );
}

/** Add/remove list of sub-forms (family members, qualifications, references…). */
export function RepeatableList({ items, onChange, newItem, renderItem, addLabel, emptyTitle, emptyIcon, itemTitle, min = 0 }) {
  const update = (index, patch) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300">
          <EmptyState icon={emptyIcon} title={emptyTitle || 'Nothing added yet'} className="py-8" />
        </div>
      )}
      {items.map((item, index) => (
        // data-repeat-row lets the error pop-up's Fix button find row N.
        <div key={item._key || index} data-repeat-row={index} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {itemTitle ? itemTitle(item, index) : `#${index + 1}`}
            </p>
            {items.length > min && (
              <Button variant="ghost" size="sm" icon={Trash2} onClick={() => remove(index)} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                Remove
              </Button>
            )}
          </div>
          {renderItem(item, index, (patch) => update(index, patch))}
        </div>
      ))}
      <Button variant="secondary" size="sm" icon={Plus} onClick={() => onChange([...items, { ...newItem(), _key: `${Date.now()}-${Math.random()}` }])}>
        {addLabel}
      </Button>
    </div>
  );
}

export function YesNo({ label, value, onChange, yesLabel = 'Yes', noLabel = 'No' }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-sm">
        {[
          { v: true, l: yesLabel },
          { v: false, l: noLabel },
        ].map((opt) => (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(opt.v)}
            className={clsx(
              'rounded-md px-4 py-1.5 text-sm font-medium transition',
              value === opt.v ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50',
            )}
          >
            {opt.l}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Tracks which rows have validation errors: { [index]: { field: msg } } */
export function useRowErrors() {
  const [rowErrors, setRowErrors] = useState({});
  const errorFor = (index, field) => rowErrors[index]?.[field];
  return { rowErrors, setRowErrors, errorFor };
}

export function validateRows(items, check) {
  const errors = {};
  items.forEach((item, index) => {
    const e = check(item);
    if (Object.keys(e).length) errors[index] = e;
  });
  return errors;
}
