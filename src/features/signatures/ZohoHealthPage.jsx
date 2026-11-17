import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react';

import { signatureAdminApi } from '@/api';
import { Alert, Badge, Button, Card, ErrorState, PageHeader, PageLoader } from '@/components/ui';

function Check({ label, ok, detail }) {
  return (
    <li className="flex items-start gap-3 py-3">
      {ok ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" /> : <XCircle size={18} className="mt-0.5 shrink-0 text-red-500" />}
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {detail && <p className="mt-0.5 break-words text-xs text-slate-500">{detail}</p>}
      </div>
    </li>
  );
}

export function ZohoHealthPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({ queryKey: ['signatures', 'health'], queryFn: signatureAdminApi.health });

  if (isLoading) return <PageLoader label="Checking Zoho Sign…" />;
  if (error) return <Card><ErrorState error={error} onRetry={refetch} /></Card>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zoho Sign setup"
        subtitle="Go-live diagnostics for Aadhaar eSign. Nothing is sent to anyone from this page."
        actions={<Button variant="secondary" icon={RefreshCw} loading={isFetching} onClick={() => refetch()}>Re-check</Button>}
      />

      <div className={clsx('flex items-start gap-4 rounded-xl border p-5', data.ready ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50')}>
        {data.ready ? <CheckCircle2 className="text-emerald-500" size={28} /> : <XCircle className="text-amber-500" size={28} />}
        <div>
          <p className={clsx('text-lg font-semibold', data.ready ? 'text-emerald-900' : 'text-amber-900')}>
            {data.ready ? 'Signing is ready' : 'Signing is not ready yet'}
          </p>
          <p className={clsx('text-sm', data.ready ? 'text-emerald-800' : 'text-amber-800')}>{data.message}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Connection">
          <ul className="divide-y divide-slate-100 -my-3">
            <Check label="Feature enabled" ok={data.enabled} detail="ZOHO_SIGN_ENABLED" />
            <Check label="Credentials configured" ok={data.configured} detail={data.missing_settings?.length ? `Missing: ${data.missing_settings.join(', ')}` : 'All required settings present'} />
            <Check label="Zoho accepted the credentials" ok={data.credentials_reachable} />
            <Check label="India data centre" ok={data.india_data_centre} detail={data.api_base_url} />
            <Check label="Company signatory" ok={Boolean(data.company_signer_email)} detail={data.company_signer_email || 'ZOHO_SIGN_COMPANY_SIGNER_EMAIL not set'} />
          </ul>
        </Card>

        <Card title="Aadhaar eSign enforcement">
          <ul className="divide-y divide-slate-100 -my-3">
            <Check label="Aadhaar enforced on every signer" ok={data.aadhaar_enforced} />
            <Check label="Provider payload sent" ok={Object.keys(data.aadhaar_payload_sent || {}).length > 0} detail={JSON.stringify(data.aadhaar_payload_sent)} />
            <Check label="Aadhaar is the only permitted provider" ok={JSON.stringify(data.aadhaar_allowed_providers) === JSON.stringify([data.aadhaar_provider_id])} detail={`Allowed providers: ${JSON.stringify(data.aadhaar_allowed_providers)}`} />
            <Check label="Refuse envelopes Zoho reports as non-Aadhaar" ok={data.aadhaar_require_confirmation} detail="ZOHO_SIGN_REQUIRE_AADHAAR_CONFIRMATION" />
          </ul>
          {data.aadhaar_hint && <Alert tone="info" className="mt-4">{data.aadhaar_hint}</Alert>}
        </Card>
      </div>

      <Card title="Signing package" subtitle={`${data.expected_document_count} documents in a complete envelope`}>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 eyebrow">
              Shared policy masters · {data.policy_documents_found?.length}/{data.policy_documents_expected} found
            </p>
            <div className="flex flex-wrap gap-2">
              {data.policy_documents_found?.map((p) => <Badge key={p} tone="success">{p.replace(/\.pdf$/i, '')}</Badge>)}
            </div>
          </div>
          <div>
            <p className="mb-2 eyebrow">Generated per employee</p>
            <div className="flex flex-wrap gap-2">
              {data.per_employee_documents?.map((p) => <Badge key={p} tone="brand">{p}</Badge>)}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {data.contracts_required
                ? 'Envelopes wait for the appointment letter and NDA, so an eSign credit is never spent on a partial package.'
                : 'Envelopes may be sent without the contracts.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
