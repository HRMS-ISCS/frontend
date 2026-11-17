/**
 * Every word on the public landing page.
 *
 * Rule for this file: every claim describes something the portal does today.
 * No customer logos, adoption numbers or testimonials - this is ISCS's own HR
 * platform, not a product for sale. The facts in FACTS are properties of the
 * system (two envelopes, ten documents, six steps), not usage statistics.
 */

export const COMPANY = 'ISCS Technologies Private Limited';

export const CONTACT = {
  email: 'hr@iscstech.com',
  website: { label: 'www.iscstech.com', href: 'https://www.iscstech.com' },
  linkedin: { label: 'LinkedIn', href: 'https://www.linkedin.com/company/iscs-technologies/' },
  address: ['Level 4, Gumidelli Towers', 'Old Airport Road, Begumpet', 'Hyderabad 500016, Telangana'],
};

export const NAV = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#journey' },
  { label: 'Security', href: '#security' },
  { label: 'FAQ', href: '#faq' },
];

export const HERO = {
  badge: 'Aadhaar eSign is live for the whole joining pack',
  titleLead: 'The HR platform behind',
  titleAccent: 'every ISCS employee.',
  sub: 'Offer letters, guided onboarding, Aadhaar-verified signing and payroll, all on one secure employee record. Built for HR teams who would rather not chase paperwork.',
  primary: 'Sign in to your workspace',
  secondary: 'Take the product tour',
  assurances: ['Aadhaar eSign via Zoho Sign India', 'Role-based access, enforced on the server', 'Works on any phone'],
};

export const INFRA = [
  { name: 'Zoho Sign', detail: 'India data centre', icon: 'FileSignature' },
  { name: 'Aadhaar eSign', detail: 'UIDAI OTP', icon: 'Fingerprint' },
  { name: 'Microsoft Azure', detail: 'Document storage', icon: 'Cloud' },
  { name: 'PostgreSQL', detail: 'Employee records', icon: 'Database' },
  { name: 'Encrypted email', detail: 'TLS delivery', icon: 'Mail' },
];

export const TOUR = [
  {
    key: 'onboarding',
    tab: 'Onboarding',
    icon: 'Workflow',
    kicker: 'Guided onboarding',
    title: 'Onboarding that new joiners finish on their own.',
    body: 'A secure invite goes out and the joiner works through six guided steps, from identity and bank details to experience, references and the declaration. HR stops typing and starts reviewing.',
    points: [
      'Progress saved at every step and resumable on any device',
      'ID proofs, certificates and experience letters uploaded in place',
      'Freshers skip experience with a single answer',
      'HR sees who is paused, on which step, and for how long',
    ],
    fact: { value: '6', label: 'guided steps, saved as they go' },
  },
  {
    key: 'esign',
    tab: 'Aadhaar eSign',
    icon: 'Fingerprint',
    kicker: 'Document signing',
    title: 'The entire joining pack, signed with Aadhaar eSign.',
    body: 'The appointment letter goes out on its own, and the NDA, company policies and declaration go out together, both signed through Zoho Sign India. HR countersigns each from the dashboard, and the sealed copies are filed automatically.',
    points: [
      'The Aadhaar number goes straight to UIDAI and is never stored',
      'Each envelope records whether Aadhaar was actually applied',
      'HR countersigns in an embedded window, with no downloads',
      'Sealed PDF and completion certificate archived per employee',
    ],
    fact: { value: '2', label: 'envelopes, one Aadhaar OTP each' },
  },
  {
    key: 'payroll',
    tab: 'Payroll',
    icon: 'BadgeIndianRupee',
    kicker: 'Payroll',
    title: 'Set the salary structure once. Payslips follow.',
    body: 'HR enters the annual CTC and every monthly component is derived from it. Revisions are versioned, so a payslip for any past month uses the structure that applied at the time.',
    points: [
      'Earnings prorated by paid days; deductions never are',
      'Bulk runs for the whole company, one row per employee',
      'Payslips emailed and published to the employee portal',
      'Every CTC revision kept as history, never overwritten',
    ],
    fact: { value: '1', label: 'CTC figure derives every monthly component' },
  },
  {
    key: 'letters',
    tab: 'HR letters',
    icon: 'ScrollText',
    kicker: 'Letters & documents',
    title: 'Official letters, written straight from the employee record.',
    body: 'Proposed offer, appointment, NDA and relieving letters are generated on the company templates, with the salary annexure calculated for you. Send them from the portal with To, CC and BCC.',
    points: [
      'Autofill from the employee record, or type for a candidate',
      'Live Annexure II salary breakup as you enter the CTC',
      'Addresses remembered for next time',
      'Every dispatch logged with recipients and delivery status',
    ],
    fact: { value: '4', label: 'letter types on the official templates' },
  },
  {
    key: 'insights',
    tab: 'HR dashboard',
    icon: 'LayoutDashboard',
    kicker: 'HR command centre',
    title: 'One screen that tells HR what needs them today.',
    body: 'The dashboard reads across onboarding, signing and document delivery and turns it into a worklist, ordered by severity, with the action on each row.',
    points: [
      'Countersign, remind or retry without leaving the page',
      'Stalled onboarding ranked High, Medium and Low by idle time',
      'Aadhaar compliance tracked across every signed envelope',
      'Email delivery health for every letter and payslip',
    ],
    fact: { value: '1', label: 'worklist instead of five inboxes' },
  },
];

export const FACTS = [
  { value: '1', unit: 'OTP', label: 'Signs the complete joining pack' },
  { value: '10', unit: 'documents', label: 'Bundled into a single envelope' },
  { value: '6', unit: 'steps', label: 'Of guided, resumable onboarding' },
  { value: '4', unit: 'roles', label: 'Super Admin, HR, Admin, Employee' },
];

export const JOURNEY = [
  {
    step: '01',
    stage: 'Offer',
    icon: 'FileText',
    body: 'HR issues a proposed offer letter with the full CTC breakup and emails it from the portal.',
    docs: ['Proposed offer letter'],
    actors: ['HR'],
  },
  {
    step: '02',
    stage: 'Onboard',
    icon: 'Workflow',
    body: 'The joiner gets a secure invite and completes six guided steps from any device.',
    docs: ['Profile', 'Bank', 'ID proofs'],
    actors: ['Employee'],
  },
  {
    step: '03',
    stage: 'Sign',
    icon: 'Fingerprint',
    body: 'Appointment letter in one envelope; NDA, policies and declaration in another. Each signed with Aadhaar OTP, then countersigned.',
    docs: ['Appointment letter', 'NDA', '7 policies'],
    actors: ['Employee', 'HR'],
  },
  {
    step: '04',
    stage: 'Pay',
    icon: 'Receipt',
    body: 'Monthly payslips generated from the salary structure and delivered to inbox and portal.',
    docs: ['Payslips', 'CTC revisions'],
    actors: ['HR'],
  },
  {
    step: '05',
    stage: 'Exit',
    icon: 'LogOut',
    body: 'A relieving and experience letter with tenure and designation, archived in dispatch history.',
    docs: ['Relieving & experience letter'],
    actors: ['HR'],
  },
];

export const DETAILS = {
  title: 'The small things that give HR back hours every week.',
  sub: 'Not headline features, just the details that make the portal pleasant to use every day.',
};

export const SECURITY = {
  title: 'Built for data that has to stay private.',
  sub: 'Salaries, bank accounts and government IDs live in this system. The controls around them are designed in, not bolted on.',
  items: [
    { icon: 'Lock', title: 'Role-based access', body: 'Super Admin, HR, Admin and Employee each reach only their own portal, checked on the server for every request.' },
    { icon: 'Fingerprint', title: 'Aadhaar never stored', body: 'The Aadhaar number is typed into Zoho Sign and verified by UIDAI. ISCS keeps only the result and the certificate.' },
    { icon: 'KeyRound', title: 'Account protection', body: 'Hashed passwords, one-time setup links, rate-limited sign-in, and every session revoked when a password changes.' },
    { icon: 'Clock', title: 'Short-lived legal links', body: 'Signed bundles and dispatched letters open through links that expire within the hour.' },
    { icon: 'History', title: 'Complete audit trail', body: 'Every letter and payslip records who issued it, who received it and whether the email was delivered.' },
    { icon: 'MapPin', title: 'Signed in India', body: 'Signing runs on Zoho Sign’s India data centre, and records stay in the company’s own database.' },
  ],
};

export const FAQ = [
  {
    q: 'How do I sign in for the first time?',
    a: 'HR creates your account and you receive an email with a secure link to set your own password. The link works once and is valid for 24 hours. If it has expired, use “Forgot password” on the sign-in page.',
  },
  {
    q: 'Does ISCS store my Aadhaar number?',
    a: 'No. You type your Aadhaar number into Zoho Sign’s secure window and it is verified by UIDAI. The portal only keeps the signing status and the completion certificate.',
  },
  {
    q: 'How many OTPs do I need to sign my joining documents?',
    a: 'Two. Your appointment letter is sent on its own, and your NDA, company policies and declaration are sent together. Each envelope is signed with its own Aadhaar OTP.',
  },
  {
    q: 'What happens if I stop onboarding halfway?',
    a: 'Nothing is lost. Each step is saved as you complete it, so you can sign out and continue later from any device, right where you left off.',
  },
  {
    q: 'Where do I find my payslips?',
    a: 'Under Payslips in your portal, as soon as HR publishes them. You can open any month or download a whole year as a single ZIP file. Payslips are also emailed to you.',
  },
  {
    q: 'Can I complete everything from my phone?',
    a: 'Yes. The portal is fully usable on a phone, including Aadhaar eSign. The OTP is sent to the mobile number linked to your Aadhaar.',
  },
];

export const CLOSING = {
  title: 'Your HR workspace is ready when you are.',
  sub: 'Sign in with your work email or username to reach your profile, documents, payslips and anything waiting for your signature.',
  primary: 'Sign in',
  secondary: 'Contact HR',
};
