import { useState } from 'react';
import clsx from 'clsx';

/**
 * Company logo.
 *
 * Drop the file in `frontend/public/` as `logo.svg` (preferred) or `logo.png`
 * with a transparent background, and it replaces the "IS" monogram everywhere.
 * Until then - or if the file fails to load - the monogram is shown, so the
 * app never renders a broken image.
 */
const CANDIDATES = [`${import.meta.env.BASE_URL}logo.svg`, `${import.meta.env.BASE_URL}logo.png`];

/**
 * @param {string} className  height utility, e.g. "h-8" (width stays auto)
 * @param {boolean} onDark    sit the logo on a white panel, so the dark navy
 *                            sidebar / login panel keeps it legible
 */
export function BrandLogo({ className = 'h-8', onDark = false }) {
  const [index, setIndex] = useState(0);
  const src = CANDIDATES[index];

  if (!src) {
    return (
      <span
        className={clsx(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white',
          className,
        )}
      >
        IS
      </span>
    );
  }

  const img = (
    <img
      src={src}
      alt="ISCS Technologies Private Limited"
      onError={() => setIndex((i) => i + 1)}
      className={clsx('w-auto shrink-0 object-contain', className)}
    />
  );

  return onDark ? <span className="inline-flex rounded-lg bg-white px-3 py-2 shadow-sm">{img}</span> : img;
}
