import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { X } from 'lucide-react';

import { frequentEmailsApi } from '@/api';
import { PATTERNS } from '@/lib/constants';
import { useClickOutside, useDebounce } from '@/lib/hooks';
import { Field } from '@/components/ui';

/**
 * Chip input for To / CC / BCC with autocomplete from the frequent-emails
 * directory (addresses are saved there automatically after each send).
 */
export function EmailChips({ label, value = [], onChange, placeholder = 'Type an email and press Enter', hint }) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);
  useClickOutside(ref, () => setFocused(false), focused);

  const debounced = useDebounce(input.trim(), 200);
  const { data } = useQuery({
    queryKey: ['frequent-emails', debounced],
    queryFn: () => frequentEmailsApi.search(debounced, 6),
    enabled: focused && debounced.length >= 1,
    staleTime: 60 * 1000,
  });
  const suggestions = (data?.results || [])
    .map((r) => r.email)
    .filter((e) => !value.includes(e));

  const add = (raw) => {
    const emails = raw
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!emails.length) return;
    const invalid = emails.find((e) => !PATTERNS.email.test(e));
    if (invalid) {
      setError(`"${invalid}" is not a valid email address`);
      return;
    }
    const next = [...value];
    emails.forEach((e) => !next.includes(e) && next.push(e));
    onChange(next);
    setInput('');
    setError('');
  };

  const onKeyDown = (e) => {
    if (['Enter', ',', ';', 'Tab'].includes(e.key) && input.trim()) {
      e.preventDefault();
      add(input);
    } else if (e.key === 'Backspace' && !input && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <Field label={label} hint={hint} error={error}>
      <div ref={ref} className="relative">
        <div
          className={clsx(
            'input flex min-h-[40px] flex-wrap items-center gap-1.5 py-1.5',
            focused && 'border-brand-500 ring-2 ring-brand-500/20',
            error && 'input-error',
          )}
          onClick={() => ref.current?.querySelector('input')?.focus()}
        >
          {value.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
            >
              {email}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== email))}
                className="text-brand-400 hover:text-brand-700"
                aria-label={`Remove ${email}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError('');
            }}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => input.trim() && PATTERNS.email.test(input.trim()) && add(input)}
            placeholder={value.length ? '' : placeholder}
            className="min-w-[160px] flex-1 border-0 p-0.5 text-sm focus:outline-none focus:ring-0"
          />
        </div>
        {focused && suggestions.length > 0 && (
          <ul className="absolute z-40 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-pop">
            {suggestions.map((email) => (
              <li key={email}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(email);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  {email}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  );
}

/** To / CC / BCC block used by every letter and payslip form. */
export function RecipientsFields({ value, onChange, toHint }) {
  const [showCopies, setShowCopies] = useState(Boolean(value.cc_emails?.length || value.bcc_emails?.length));
  return (
    <div className="space-y-4">
      <EmailChips
        label="To"
        value={value.to_emails || []}
        onChange={(to_emails) => onChange({ ...value, to_emails })}
        hint={toHint || 'Leave empty to only download the PDF without emailing it.'}
      />
      {showCopies ? (
        <>
          <EmailChips label="CC" value={value.cc_emails || []} onChange={(cc_emails) => onChange({ ...value, cc_emails })} />
          <EmailChips
            label="BCC"
            value={value.bcc_emails || []}
            onChange={(bcc_emails) => onChange({ ...value, bcc_emails })}
            hint="BCC recipients stay hidden from everyone else."
          />
        </>
      ) : (
        <button type="button" onClick={() => setShowCopies(true)} className="text-sm font-medium text-brand-600 hover:text-brand-700">
          + Add CC / BCC
        </button>
      )}
    </div>
  );
}
