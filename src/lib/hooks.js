import { useCallback, useEffect, useRef, useState } from 'react';

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Interval polling that also fires on window focus. Employees switch to their
 * SMS app for the Aadhaar OTP and come back, so focus is a useful signal.
 * Pass intervalMs = null to stop.
 */
export function usePolling(callback, intervalMs) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!intervalMs) return undefined;
    const tick = () => saved.current?.();
    const id = setInterval(tick, intervalMs);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', tick);
    };
  }, [intervalMs]);
}

export function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const listener = (event) => {
      if (ref.current && !ref.current.contains(event.target)) handler(event);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler, active]);
}

/** Minimal form state helper: values, errors, set, and bulk reset. */
export function useForm(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

  const set = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }, []);

  const bind = useCallback(
    (name, transform) => ({
      value: values[name] ?? '',
      onChange: (e) => set(name, transform ? transform(e.target.value) : e.target.value),
      error: errors[name],
    }),
    [values, errors, set],
  );

  return { values, setValues, errors, setErrors, set, bind };
}

/** Validate with a map of name -> (value, values) => error message | undefined. */
export function validate(values, rules) {
  const errors = {};
  Object.entries(rules).forEach(([name, rule]) => {
    const message = rule(values[name], values);
    if (message) errors[name] = message;
  });
  return errors;
}

export const rules = {
  required: (label) => (v) =>
    v === undefined || v === null || String(v).trim() === '' ? `${label} is required` : undefined,
  pattern: (regex, message) => (v) => (v && !regex.test(String(v)) ? message : undefined),
  all:
    (...fns) =>
    (v, values) => {
      for (const fn of fns) {
        const m = fn(v, values);
        if (m) return m;
      }
      return undefined;
    },
};
