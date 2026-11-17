/**
 * Employee help desk - frontend only.
 *
 * Nothing is sent through the HRMS server. The employee fills in a short form
 * and it opens in their own email (default mail app, Gmail or Outlook) already
 * addressed to HR, with a clear subject and their details filled in, so HR can
 * reply straight from their inbox.
 *
 * Set the address in the frontend .env:
 *   VITE_HELPDESK_EMAIL=hr@yourcompany.com
 * (Optional) VITE_HELPDESK_NAME=HR Help Desk
 */
export const HELPDESK_EMAIL = (import.meta.env.VITE_HELPDESK_EMAIL || '').trim();
export const HELPDESK_NAME = (import.meta.env.VITE_HELPDESK_NAME || 'HR Help Desk').trim();

export const CATEGORIES = [
  { value: 'Onboarding', label: 'Onboarding steps (1–6)' },
  { value: 'Document signing', label: 'Document signing / Aadhaar eSign' },
  { value: 'Login & password', label: 'Login & password' },
  { value: 'Profile update', label: 'Update my details (bank, address, name…)' },
  { value: 'Payslips & salary', label: 'Payslips & salary' },
  { value: 'Documents & letters', label: 'Documents & letters' },
  { value: 'Other', label: 'Something else' },
];

// Mail apps truncate or refuse very long mailto: links; keep the body under this.
const MAILTO_BODY_LIMIT = 1800;

export function buildEmail({ category, subject, message, user, context }) {
  const who = user?.displayName || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || '';
  const id = user?.employee_id;

  const fullSubject = `[HRMS Help] ${category}: ${subject.trim()}${id ? ` (${id})` : ''}`;
  const lines = [
    `Hello ${HELPDESK_NAME},`,
    '',
    message.trim(),
    '',
    '— My details —',
    who && `Name: ${who}`,
    id ? `Employee ID: ${id}` : 'Employee ID: not assigned yet',
    user?.email && `Login email: ${user.email}`,
    user?.username && `Username: ${user.username}`,
    `Topic: ${category}`,
    context && `Where: ${context}`,
    `Sent from the HRMS portal on ${new Date().toLocaleString('en-IN')}`,
  ].filter(Boolean);

  return { to: HELPDESK_EMAIL, subject: fullSubject, body: lines.join('\n') };
}

const trimmed = (body) =>
  body.length <= MAILTO_BODY_LIMIT ? body : `${body.slice(0, MAILTO_BODY_LIMIT)}\n\n[Message shortened — full text was copied, please paste it here]`;

export const mailLinks = ({ to, subject, body }) => {
  const s = encodeURIComponent(subject);
  const b = encodeURIComponent(trimmed(body));
  const t = encodeURIComponent(to);
  return {
    mailto: `mailto:${to}?subject=${s}&body=${b}`,
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${t}&su=${s}&body=${b}`,
    outlook: `https://outlook.office.com/mail/deeplink/compose?to=${t}&subject=${s}&body=${b}`,
  };
};

export const isLong = (body) => body.length > MAILTO_BODY_LIMIT;

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / insecure context: fall back to a hidden textarea.
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
