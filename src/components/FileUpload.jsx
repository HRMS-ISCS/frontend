import { useRef, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, FileText, UploadCloud, X } from 'lucide-react';

import { formatBytes } from '@/lib/format';

/**
 * Single-file drop zone.
 *   accept     - input accept string, e.g. ".pdf,.jpg"
 *   maxMB      - client-side size limit, mirrors the backend limits
 *   existing   - truthy when a file is already on record (shows "Uploaded")
 */
export function FileUpload({ label, hint, accept, maxMB, file, onChange, existing, required, compact }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const pick = (f) => {
    if (!f) return;
    if (maxMB && f.size > maxMB * 1024 * 1024) {
      setError(`File is ${formatBytes(f.size)}. Maximum allowed is ${maxMB} MB.`);
      return;
    }
    if (accept) {
      const ext = `.${f.name.split('.').pop()?.toLowerCase()}`;
      const allowed = accept.split(',').map((a) => a.trim().toLowerCase());
      if (!allowed.includes(ext)) {
        setError(`Allowed formats: ${allowed.join(', ')}`);
        return;
      }
    }
    setError('');
    onChange(f);
  };

  return (
    <div>
      {label && (
        <p className="label">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </p>
      )}
      {file ? (
        <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50/50 px-3 py-2.5">
          <FileText size={18} className="shrink-0 text-brand-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
            <p className="text-xs text-slate-500">{formatBytes(file.size)} · ready to upload</p>
          </div>
          <button type="button" onClick={() => onChange(null)} className="text-slate-400 hover:text-slate-600" aria-label="Remove file">
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={clsx(
            'flex w-full items-center gap-3 rounded-lg border border-dashed px-4 text-left transition',
            compact ? 'py-2.5' : 'py-4',
            dragging ? 'border-brand-400 bg-brand-50' : 'border-slate-300 bg-white hover:border-brand-300 hover:bg-slate-50',
            error && 'border-red-300',
          )}
        >
          {existing ? (
            <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />
          ) : (
            <UploadCloud size={20} className="shrink-0 text-slate-400" />
          )}
          <span className="min-w-0">
            <span className="block text-sm font-medium text-slate-700">
              {existing ? 'Uploaded · click to replace' : 'Click to upload or drag & drop'}
            </span>
            <span className="block text-xs text-slate-500">
              {hint || [accept?.replaceAll(',', ', '), maxMB && `max ${maxMB} MB`].filter(Boolean).join(' · ')}
            </span>
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
