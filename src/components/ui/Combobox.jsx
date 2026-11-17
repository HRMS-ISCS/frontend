import { useId, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, ChevronDown, Plus } from 'lucide-react';

import { useClickOutside } from '@/lib/hooks';
import { Field } from './Form';

/**
 * Free-text input with filtered suggestions. The user can pick an option or
 * type any value of their own; `onChange` always receives the text.
 */
export function Combobox({
  label,
  required,
  hint,
  error,
  value = '',
  onChange,
  options = [],
  placeholder = 'Type or choose…',
  createLabel = (text) => `Use “${text}”`,
  fieldClassName,
  disabled,
  maxResults = 50,
}) {
  const id = useId();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  useClickOutside(ref, () => setOpen(false), open);

  const text = value.trim();
  const filtered = useMemo(() => {
    const q = text.toLowerCase();
    return options.filter((o) => !q || o.toLowerCase().includes(q)).slice(0, maxResults);
  }, [options, text, maxResults]);
  const exact = options.some((o) => o.toLowerCase() === text.toLowerCase());
  const showCreate = Boolean(text) && !exact;
  const rows = [...(showCreate ? [{ create: true, value: text }] : []), ...filtered.map((o) => ({ value: o }))];

  const choose = (row) => {
    onChange(row.value);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open && active >= 0 && rows[active]) {
      e.preventDefault();
      choose(rows[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <Field label={label} required={required} hint={hint} error={error} className={fieldClassName} htmlFor={id}>
      <div ref={ref} className="relative">
        <input
          id={id}
          value={value}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={clsx('input pr-9', error && 'input-error')}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
          aria-label="Show options"
        >
          <ChevronDown size={16} />
        </button>

        {open && rows.length > 0 && (
          <ul className="absolute z-40 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-pop animate-fade-in scrollbar-thin">
            {rows.map((row, i) => (
              <li key={row.create ? '__create' : row.value}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(row);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={clsx(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
                    i === active ? 'bg-brand-50 text-brand-800' : 'text-slate-700',
                    row.create && 'border-b border-slate-100 font-medium text-brand-700',
                  )}
                >
                  {row.create ? <Plus size={14} /> : null}
                  <span className="flex-1 truncate">{row.create ? createLabel(row.value) : row.value}</span>
                  {!row.create && row.value.toLowerCase() === text.toLowerCase() && <Check size={14} className="text-brand-600" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  );
}
