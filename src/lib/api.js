/**
 * HTTP layer for the HRMS FastAPI backend.
 *
 * - Attaches the bearer token and transparently refreshes it once on a 401.
 * - Flattens FastAPI's `detail` (string | validation array | object) into a
 *   readable message on ApiError.
 * - Supports JSON, form-urlencoded (login), multipart (uploads) and blob
 *   (generated PDFs / ZIPs) exchanges.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(
  /\/$/,
  '',
);

const ACCESS_KEY = 'hrms.access_token';
const REFRESH_KEY = 'hrms.refresh_token';

export const tokens = {
  get access() {
    return safeGet(ACCESS_KEY);
  },
  get refresh() {
    return safeGet(REFRESH_KEY);
  },
  set({ access, refresh }) {
    if (access !== undefined) safeSet(ACCESS_KEY, access);
    if (refresh !== undefined) safeSet(REFRESH_KEY, refresh);
  },
  clear() {
    safeRemove(ACCESS_KEY);
    safeRemove(REFRESH_KEY);
  },
};

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}
function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

let sessionExpiredHandler = () => {};
export function onSessionExpired(handler) {
  sessionExpiredHandler = handler;
}

function buildUrl(path, query) {
  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else params.append(key, String(value));
  });
  const qs = params.toString();
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`;
}

function extractDetail(payload, fallback) {
  if (!payload) return fallback;
  const { detail } = payload;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (!item?.msg) return JSON.stringify(item);
        const field = Array.isArray(item.loc) ? item.loc.filter((p) => p !== 'body').join('.') : '';
        const msg = item.msg.replace(/^Value error, /, '');
        return field ? `${field}: ${msg}` : msg;
      })
      .join('; ');
  }
  if (detail && typeof detail === 'object') {
    const missing = Array.isArray(detail.missing_steps) ? ` ${detail.missing_steps.join(', ')}` : '';
    return (detail.message || JSON.stringify(detail)) + missing;
  }
  return fallback;
}

function filenameFrom(headers, fallback) {
  const disposition = headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1]) : fallback;
}

let refreshInFlight = null;

async function refreshAccessToken() {
  const refreshToken = tokens.refresh;
  if (!refreshToken) throw new ApiError('Session expired', 401);
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) throw new ApiError('Session expired', res.status);
  const data = await res.json();
  tokens.set({ access: data.access_token });
  return data.access_token;
}

/**
 * @param {string} path
 * @param {object} options
 *   method, query, body (JSON), form (urlencoded object), formData (FormData),
 *   responseType: 'json' | 'blob', auth (default true), signal
 */
export async function request(path, options = {}) {
  const {
    method = 'GET',
    query,
    body,
    form,
    formData,
    responseType = 'json',
    auth = true,
    signal,
    _retried = false,
  } = options;

  const headers = { Accept: responseType === 'blob' ? '*/*' : 'application/json' };
  let payload;

  if (formData) {
    payload = formData;
  } else if (form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    payload = new URLSearchParams(form).toString();
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  if (auth && tokens.access) headers.Authorization = `Bearer ${tokens.access}`;

  let res;
  try {
    res = await fetch(buildUrl(path, query), { method, headers, body: payload, signal });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError(
      'Unable to reach the HRMS server. Check your connection and try again.',
      0,
    );
  }

  if (res.status === 401 && auth) {
    if (!_retried && tokens.refresh) {
      try {
        refreshInFlight = refreshInFlight || refreshAccessToken();
        await refreshInFlight;
        return request(path, { ...options, _retried: true });
      } catch {
        tokens.clear();
        sessionExpiredHandler();
      } finally {
        refreshInFlight = null;
      }
    } else {
      tokens.clear();
      sessionExpiredHandler();
    }
  }

  if (!res.ok) {
    let data = null;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    throw new ApiError(extractDetail(data, `Request failed (${res.status})`), res.status, data);
  }

  if (responseType === 'blob') {
    const blob = await res.blob();
    return { blob, headers: res.headers, filename: filenameFrom(res.headers, 'download') };
  }

  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Trigger a browser download for a Blob. */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Open a (SAS) URL in a new tab without leaking the opener. */
export function openExternal(url) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}
