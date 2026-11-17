import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';

import { EMAIL_STATUS, SIGNATURE_STATUS } from '@/lib/constants';
import { Badge } from '@/components/ui';

export function SignatureStatusBadge({ status, label }) {
  const cfg = SIGNATURE_STATUS[status] || { tone: 'neutral', label: status || '—' };
  return (
    <Badge tone={cfg.tone} dot>
      {label || cfg.label}
    </Badge>
  );
}

/**
 * How the signature was ACTUALLY applied. Status alone cannot show this: an
 * ordinary electronic signature reads "completed" exactly like Aadhaar.
 */
export function AadhaarBadge({ signMethod, confirmed }) {
  if (confirmed) {
    return (
      <Badge tone="success" icon={ShieldCheck}>
        Aadhaar verified
      </Badge>
    );
  }
  if (signMethod === 'aadhaar_esign_unverified') {
    return (
      <span title="Aadhaar was requested; Zoho's response did not confirm it. The completion certificate is authoritative.">
        <Badge tone="neutral" icon={ShieldQuestion}>
          Not confirmed
        </Badge>
      </span>
    );
  }
  return (
    <Badge tone="danger" icon={ShieldAlert}>
      No Aadhaar
    </Badge>
  );
}

export function EmailStatusBadge({ status }) {
  const cfg = EMAIL_STATUS[status] || { tone: 'neutral', label: status || '—' };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}
