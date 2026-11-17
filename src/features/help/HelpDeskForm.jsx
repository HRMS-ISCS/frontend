/**
 * The "write to HR" form. Used on the Help desk page and in the pop-up on the
 * onboarding screen. See helpdesk.js for how the email is built and sent.
 */
import { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, LifeBuoy, Mail, Paperclip, Send } from 'lucide-react';

import { useAuth } from '@/lib/auth';
import { Alert, Button, FormGrid, Input, Modal, Select, Textarea, useToast } from '@/components/ui';
import { CATEGORIES, HELPDESK_EMAIL, buildEmail, copyText, isLong, mailLinks } from './helpdesk';

const MIN_MESSAGE = 10;

export function HelpDeskForm({ context, defaultCategory = '', onSent }) {
  const toast = useToast();
  const { user, displayName } = useAuth();
  const [category, setCategory] = useState(defaultCategory);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [ready, setReady] = useState(null); // the built email once the form is valid
  const [copied, setCopied] = useState(false);

  const who = useMemo(() => ({ ...user, displayName }), [user, displayName]);

  if (!HELPDESK_EMAIL) {
    return (
      <Alert tone="warning" title="Help desk email is not set up yet">
        Please contact HR directly for now. (Administrator: set <code>VITE_HELPDESK_EMAIL</code> in the frontend
        <code> .env</code> and restart the app.)
      </Alert>
    );
  }

  const prepare = () => {
    const found = {};
    if (!category) found.category = 'Choose what your question is about';
    if (!subject.trim()) found.subject = 'Add a short subject';
    if (message.trim().length < MIN_MESSAGE) found.message = `Describe your question (at least ${MIN_MESSAGE} characters)`;
    setErrors(found);
    if (Object.keys(found).length) return;
    setReady(buildEmail({ category, subject, message, user: who, context }));
    setCopied(false);
  };

  const copy = async () => {
    const ok = await copyText(`To: ${ready.to}\nSubject: ${ready.subject}\n\n${ready.body}`);
    setCopied(ok);
    if (ok) toast.success('Paste it into a new email to HR.', 'Message copied');
    else toast.error('Could not copy. Please select the text and copy it manually.');
  };

  const opened = () => {
    onSent?.();
    toast.info('Your email app should now be open. Check it and press Send there.', 'Almost done');
  };

  // Step 2: the email is ready - choose how to send it.
  if (ready) {
    const links = mailLinks(ready);
    const long = isLong(ready.body);
    return (
      <div className="space-y-5">
        <Alert tone="success" icon={Check} title="Your email is ready">
          Choose how to send it. It opens with everything filled in — just check it and press <strong>Send</strong>.
        </Alert>

        <div className="grid gap-2.5 sm:grid-cols-3">
          <a href={links.mailto} onClick={opened} className="btn btn-primary justify-center">
            <Mail size={16} /> Email app
          </a>
          <a href={links.gmail} target="_blank" rel="noopener noreferrer" onClick={opened} className="btn btn-secondary justify-center">
            <ExternalLink size={16} /> Gmail
          </a>
          <a href={links.outlook} target="_blank" rel="noopener noreferrer" onClick={opened} className="btn btn-secondary justify-center">
            <ExternalLink size={16} /> Outlook
          </a>
        </div>

        {long && (
          <Alert tone="warning">
            Your message is long, so some email apps may shorten it. Use <strong>Copy message</strong> and paste the
            full text into the email.
          </Alert>
        )}

        <div className="rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
            <p className="text-xs text-slate-500">
              To <strong className="text-slate-700">{ready.to}</strong>
            </p>
            <Button size="sm" variant="secondary" icon={copied ? Check : Copy} onClick={copy}>
              {copied ? 'Copied' : 'Copy message'}
            </Button>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">{ready.subject}</p>
            <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-600 scrollbar-thin">
              {ready.body}
            </pre>
          </div>
        </div>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
          <Paperclip size={14} className="mt-px shrink-0" />
          Need to show a screenshot or document? Attach it in your email before sending.
          Nothing opened? Copy the message and email it to {ready.to} yourself.
        </p>

        <Button variant="ghost" size="sm" onClick={() => setReady(null)}>← Edit my message</Button>
      </div>
    );
  }

  // Step 1: write the question.
  return (
    <div className="space-y-4">
      <FormGrid>
        <Select
          label="What is it about?"
          required
          value={category}
          onChange={(e) => { setCategory(e.target.value); setErrors((x) => ({ ...x, category: undefined })); }}
          options={CATEGORIES}
          error={errors.category}
        />
        <Input
          label="Subject"
          required
          maxLength={120}
          value={subject}
          onChange={(e) => { setSubject(e.target.value); setErrors((x) => ({ ...x, subject: undefined })); }}
          error={errors.subject}
          placeholder="e.g. Aadhaar OTP not received"
        />
      </FormGrid>
      <Textarea
        label="Your question"
        required
        rows={6}
        maxLength={3000}
        value={message}
        onChange={(e) => { setMessage(e.target.value); setErrors((x) => ({ ...x, message: undefined })); }}
        error={errors.message}
        placeholder="Tell us what happened, what you expected, and any error message you saw."
        hint="Your name, Employee ID and login email are added automatically."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <LifeBuoy size={14} /> Goes to <strong className="text-slate-700">{HELPDESK_EMAIL}</strong>
        </p>
        <Button icon={Send} onClick={prepare}>Continue</Button>
      </div>
    </div>
  );
}

/** Pop-up version, for screens without the sidebar (onboarding). */
export function HelpDeskModal({ open, onClose, context, defaultCategory }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Contact HR"
      description="Ask us anything about your onboarding. We reply by email."
    >
      <HelpDeskForm context={context} defaultCategory={defaultCategory} />
    </Modal>
  );
}
