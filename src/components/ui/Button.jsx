import { forwardRef } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
};

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size,
    loading = false,
    icon: Icon,
    iconRight: IconRight,
    className,
    children,
    type = 'button',
    disabled,
    ...rest
  },
  ref,
) {
  const iconSize = size === 'sm' ? 14 : 16;
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={clsx(
        'btn',
        VARIANTS[variant],
        size === 'sm' && 'btn-sm',
        !children && 'btn-icon',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : (
        Icon && <Icon size={iconSize} strokeWidth={2} />
      )}
      {children}
      {IconRight && !loading && <IconRight size={iconSize} strokeWidth={2} />}
    </button>
  );
});
