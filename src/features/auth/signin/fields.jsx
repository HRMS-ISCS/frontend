/** Form controls for the sign-in screen: a roomy text field and a password field. */
import { forwardRef, useId, useState } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff, Lock } from 'lucide-react';

const INPUT =
  'block h-12 w-full rounded-xl border border-slate-200 bg-white text-[15px] text-slate-900 shadow-[0_1px_2px_rgb(15_23_42/0.04)] ' +
  'transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 hover:border-slate-300 ' +
  'focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15';

export const AuthField = forwardRef(function AuthField(
  { label, icon: Icon, aside, trailing, invalid, className, ...rest },
  ref,
) {
  const id = useId();
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[13.5px] font-semibold text-slate-800">
          {label}
        </label>
        {aside}
      </div>
      <div className="group relative">
        {Icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400 transition-colors group-focus-within:text-brand-600">
            <Icon size={18} strokeWidth={1.9} />
          </span>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={invalid || undefined}
          className={clsx(
            INPUT,
            Icon ? 'pl-11' : 'pl-4',
            trailing ? 'pr-12' : 'pr-4',
            invalid && 'border-red-300 focus:border-red-500 focus:ring-red-500/15',
          )}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div>}
      </div>
    </div>
  );
});

/** Password with a show/hide toggle and a Caps Lock warning. */
export function PasswordField({ aside, invalid, ...rest }) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const readCaps = (e) => {
    if (typeof e.getModifierState === 'function') setCapsLock(e.getModifierState('CapsLock'));
  };

  return (
    <div>
      <AuthField
        label="Password"
        icon={Lock}
        type={visible ? 'text' : 'password'}
        aside={aside}
        invalid={invalid}
        onKeyDown={readCaps}
        onKeyUp={readCaps}
        onBlur={() => setCapsLock(false)}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
        {...rest}
      />
      {capsLock && (
        <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-amber-700" role="status">
          <span className="rounded border border-amber-300 bg-amber-50 px-1 text-[10.5px] font-bold leading-4">⇪</span>
          Caps Lock is on
        </p>
      )}
    </div>
  );
}
