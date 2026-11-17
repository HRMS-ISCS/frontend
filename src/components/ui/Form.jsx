import { forwardRef, useId } from 'react';
import clsx from 'clsx';

export function Field({ label, required, hint, error, children, className, htmlFor }) {
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="error-text">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, required, hint, error, className, fieldClassName, prefix, ...rest },
  ref,
) {
  const id = useId();
  const input = (
    <input
      ref={ref}
      id={id}
      className={clsx('input', error && 'input-error', prefix && 'pl-9', className)}
      aria-invalid={Boolean(error)}
      {...rest}
    />
  );
  return (
    <Field label={label} required={required} hint={hint} error={error} className={fieldClassName} htmlFor={id}>
      {prefix ? (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            {prefix}
          </span>
          {input}
        </div>
      ) : (
        input
      )}
    </Field>
  );
});

export function Select({
  label,
  required,
  hint,
  error,
  options = [],
  placeholder = 'Select…',
  className,
  fieldClassName,
  ...rest
}) {
  const id = useId();
  return (
    <Field label={label} required={required} hint={hint} error={error} className={fieldClassName} htmlFor={id}>
      <select id={id} className={clsx('input pr-8', error && 'input-error', className)} {...rest}>
        {placeholder !== null && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const o = typeof opt === 'string' ? { value: opt, label: opt } : opt;
          return (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          );
        })}
      </select>
    </Field>
  );
}

export function Textarea({ label, required, hint, error, className, fieldClassName, rows = 4, ...rest }) {
  const id = useId();
  return (
    <Field label={label} required={required} hint={hint} error={error} className={fieldClassName} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        className={clsx('input resize-y', error && 'input-error', className)}
        {...rest}
      />
    </Field>
  );
}

export function Checkbox({ label, description, checked, onChange, disabled, className }) {
  return (
    <label className={clsx('flex cursor-pointer items-start gap-3', disabled && 'cursor-not-allowed opacity-60', className)}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        checked={Boolean(checked)}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
      />
      <span>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
      </span>
    </label>
  );
}

export function Switch({ checked, onChange, label, description, disabled }) {
  return (
    <label className={clsx('flex items-center justify-between gap-4', disabled ? 'opacity-60' : 'cursor-pointer')}>
      {(label || description) && (
        <span>
          {label && <span className="block text-sm font-medium text-slate-800">{label}</span>}
          {description && <span className="block text-xs text-slate-500">{description}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(checked)}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={clsx(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          checked ? 'bg-brand-600' : 'bg-slate-300',
        )}
      >
        <span
          className={clsx(
            'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </label>
  );
}

export function FormGrid({ children, cols = 2, className }) {
  return (
    <div
      className={clsx(
        'grid grid-cols-1 gap-x-5 gap-y-4',
        cols === 2 && 'sm:grid-cols-2',
        cols === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        cols === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FormSection({ title, description, children, actions }) {
  return (
    <section className="py-6 first:pt-0 last:pb-0">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
