export const ROLES = {
  SUPERADMIN: 'superadmin',
  HR: 'hr',
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
};

export const ROLE_LABELS = {
  superadmin: 'Super Admin',
  hr: 'HR',
  admin: 'Admin',
  employee: 'Employee',
};

export const isHrRole = (role) => role === ROLES.HR || role === ROLES.SUPERADMIN;

/* Signing statuses - mirrors signature_request_model.py on the backend. */
export const SIGNATURE_STATUS = {
  draft: { tone: 'neutral', label: 'Not started' },
  sent: { tone: 'info', label: 'Awaiting employee signature' },
  viewed: { tone: 'info', label: 'Opened by employee' },
  employee_signed: { tone: 'warning', label: 'Pending HR countersign' },
  completed: { tone: 'success', label: 'Completed' },
  declined: { tone: 'warning', label: 'Declined' },
  expired: { tone: 'warning', label: 'Expired' },
  cancelled: { tone: 'neutral', label: 'Cancelled' },
  // Not an error: usually HR has not generated the contracts yet.
  pending_service: { tone: 'info', label: 'Signature pending' },
  failed: { tone: 'danger', label: 'Failed' },
};

export const RESTARTABLE_STATUSES = ['declined', 'expired', 'cancelled', 'pending_service', 'failed'];
export const OPEN_STATUSES = ['sent', 'viewed', 'employee_signed'];

export const DOCUMENT_TYPES = {
  proposed_offer_letter: 'Proposed Offer Letter',
  appointment_letter: 'Appointment Letter',
  nda: 'Non-Disclosure Agreement',
  relieving_experience_letter: 'Relieving & Experience Letter',
  payslip: 'Payslip',
};

export const EMAIL_STATUS = {
  sent: { tone: 'success', label: 'Delivered' },
  failed: { tone: 'danger', label: 'Failed' },
  not_requested: { tone: 'neutral', label: 'Download only' },
};

export const GENDERS = ['Male', 'Female', 'Other'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'];
export const RELATIONSHIPS = ['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister', 'Guardian'];
export const ACCOUNT_TYPES = ['Savings', 'Salary'];
export const QUALIFICATIONS = [
  'SSC / 10th',
  'Intermediate / 12th',
  'Diploma',
  'B.Tech',
  'B.E',
  'B.Sc',
  'B.Com',
  'BBA',
  'BCA',
  'M.Tech',
  'M.Sc',
  'M.Com',
  'MBA',
  'MCA',
  'Other',
];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

/* Validation patterns - match the CHECK constraints on the backend tables. */
export const PATTERNS = {
  phone: /^\d{10}$/,
  aadhaar: /^\d{12}$/,
  pan: /^[A-Z]{5}\d{4}[A-Z]$/,
  passport: /^[A-Z]\d{7}$/,
  uan: /^\d{12}$/,
  esi: /^\d{17}$/,
  pin: /^\d{6}$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

export const ZOHO_EMBED_HOST = (import.meta.env.VITE_ZOHO_EMBED_HOST || 'https://www.iscstech.co.in').replace(
  /\/$/,
  '',
);

export const ONBOARDING_STEPS = [
  { step: 1, title: 'Basic Details', description: 'Role and contact' },
  { step: 2, title: 'Personal Profile', description: 'Identity & documents' },
  { step: 3, title: 'Bank & Background', description: 'Bank, family, education' },
  { step: 4, title: 'Experience', description: 'Training & employment' },
  { step: 5, title: 'References', description: 'References & about you' },
  { step: 6, title: 'Declaration & Signing', description: 'Aadhaar eSign via Zoho' },
];
