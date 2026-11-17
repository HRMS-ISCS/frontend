import { useRef, useState } from 'react';
import { HelpCircle, LifeBuoy, Mail } from 'lucide-react';

import { Card, PageHeader } from '@/components/ui';
import { AnswerFinder } from './AnswerFinder';
import { HelpDeskForm } from './HelpDeskForm';
import { HELPDESK_EMAIL, HELPDESK_NAME } from './helpdesk';

export function HelpDeskPage() {
  // "Email HR about this" on an answer picks the form's category; the form is
  // keyed on it so it starts fresh with that category chosen.
  const [askCategory, setAskCategory] = useState('');
  const formRef = useRef(null);

  const ask = (category) => {
    setAskCategory(category);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div>
      <PageHeader
        title="Help desk"
        subtitle="Search for an instant answer, or write to HR — we reply by email."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card title="Find an answer" subtitle="Most questions are answered here in seconds" icon={HelpCircle} elevation="raised">
            <AnswerFinder onAsk={ask} />
          </Card>

          <div ref={formRef} className="scroll-mt-24">
            <Card title="Write to HR" icon={LifeBuoy}>
              <HelpDeskForm key={askCategory} defaultCategory={askCategory} context="Help desk page" />
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          {HELPDESK_EMAIL && (
            <Card title={HELPDESK_NAME} icon={Mail}>
              <p className="text-sm leading-relaxed text-slate-500">
                You can also email us directly at{' '}
                <a href={`mailto:${HELPDESK_EMAIL}`} className="font-medium text-brand-700 hover:underline">{HELPDESK_EMAIL}</a>.
                Please include your Employee ID.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
