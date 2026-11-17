/**
 * Every backend endpoint the portal uses, grouped by domain.
 * Paths mirror the FastAPI routers mounted in src/main.py of the backend.
 */
import { request } from '@/lib/api';

const enc = encodeURIComponent;

const multipart = (fields) => {
  const fd = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    fd.append(key, value);
  });
  return fd;
};

/* ---------------------------------------------------------------- Auth --- */
export const authApi = {
  login: (username, password) =>
    request('/auth/token', { method: 'POST', form: { username, password }, auth: false }),
  logout: (refreshToken) =>
    request('/auth/logout', { method: 'POST', body: { refresh_token: refreshToken }, auth: false }),
  forgotPassword: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  resetPassword: (token, newPassword, confirmPassword) =>
    request('/auth/reset-password', {
      method: 'POST',
      auth: false,
      body: { token, new_password: newPassword, confirm_new_password: confirmPassword },
    }),
  changePassword: (currentPassword, newPassword, confirmPassword) =>
    request('/auth/change-password', {
      method: 'POST',
      body: {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      },
    }),
  me: () => request('/db/Current_user/Profile'),
};

/* --------------------------------------------------------------- Users --- */
export const usersApi = {
  list: () => request('/admin/users'),
  create: (body) => request('/admin/create-user', { method: 'POST', body }),
};

/* -------------------------------------------------------- Employee IDs --- */
export const employeeIdsApi = {
  /** HR/Superadmin: is this exact ID free? userId ignores that login's own reservation. */
  check: (value, userId) => request('/employee-ids/check', { query: { value, user_id: userId } }),
  /** HR/Superadmin: next automatic ID per type. */
  next: () => request('/employee-ids/next'),
  /** HR/Superadmin: set, change or clear (null) a reservation before Step 1. */
  reserve: (userId, employeeId) =>
    request(`/employee-ids/reserve/${userId}`, { method: 'PUT', body: { employee_id: employeeId } }),
  /** Logged-in employee: the ID HR reserved for them, or the automatic previews. */
  mine: () => request('/employee-ids/mine'),
};

/* ----------------------------------------------------------- Employees --- */
export const employeesApi = {
  /** Without `page` the backend returns a plain array of every employee. */
  list: (query) => request('/db/employment-applications', { query }),
  get: (employeeId) => request(`/db/employment-applications/${enc(employeeId)}`),
  update: (employeeId, body) =>
    request(`/db/employment-applications/${enc(employeeId)}`, { method: 'PUT', body }),
  documents: (employeeId) => request(`/db/generate-sas/${enc(employeeId)}`),
  declarationPdf: (employeeId) => request(`/db/declaration-pdf/${enc(employeeId)}`),
};

/* ---------------------------------------------------------- Onboarding --- */
export const onboardingApi = {
  progress: () => request('/application/progress'),
  updateProgress: (step, completed = true) =>
    request('/application/progress', { method: 'PUT', body: { step, completed } }),
  resumeData: () => request('/application/resume-data'),
  complete: () => request('/application/complete', { method: 'POST' }),

  createBasic: (body) => request('/users/Basic_Employee_Details', { method: 'POST', body }),
  updateBasic: (employeeId, body) =>
    request(`/users/Basic_Employee_Details/${enc(employeeId)}`, { method: 'PUT', body }),

  createPersonal: (employeeId, body) =>
    request(`/users/Personal_Profile/${enc(employeeId)}`, { method: 'POST', body }),
  updatePersonal: (employeeId, body) =>
    request(`/users/Personal_Profile/${enc(employeeId)}`, { method: 'PUT', body }),
  uploadPersonalDocuments: (employeeId, files) =>
    request(`/users/Personal_Documents/${enc(employeeId)}/bulk`, {
      method: 'PUT',
      // sign_policies stays false: signing happens only through Zoho Sign.
      formData: multipart({ ...files, sign_policies: 'false' }),
    }),

  createBank: (employeeId, body) =>
    request(`/users/Bank_Account/${enc(employeeId)}`, { method: 'POST', body }),
  updateBank: (employeeId, body) =>
    request(`/users/Bank_Account/${enc(employeeId)}`, { method: 'PUT', body }),
  createMarital: (employeeId, body) =>
    request(`/users/MaritalStatus/${enc(employeeId)}`, { method: 'POST', body }),
  updateMarital: (employeeId, body) =>
    request(`/users/MaritalStatus/${enc(employeeId)}`, { method: 'PUT', body }),
  uploadCertificates: (employeeId, files) =>
    request(`/users/Certificates/${enc(employeeId)}`, {
      method: 'PUT',
      formData: multipart(files),
    }),

  setTraining: (employeeId, body) =>
    request(`/users/Professional_Training/${enc(employeeId)}`, { method: 'POST', body }),
  setExperience: (employeeId, body) =>
    request(`/users/Professional_Experience/${enc(employeeId)}`, { method: 'POST', body }),
  uploadExperienceDocuments: (employeeId, companyName, files) =>
    request(`/users/ExperienceDocuments/${enc(employeeId)}`, {
      method: 'PUT',
      query: { company_name: companyName },
      formData: multipart(files),
    }),

  // Dedicated about-self endpoints store text as typed (the unified profile
  // update title-cases every string, which mangles free-text answers).
  createAboutSelf: (employeeId, body) =>
    request(`/users/About_Self/${enc(employeeId)}`, { method: 'POST', body }),
  updateAboutSelf: (employeeId, body) =>
    request(`/users/About_Self/${enc(employeeId)}`, { method: 'PUT', body }),

  /** employee_id is a QUERY parameter on this endpoint. */
  createDeclaration: (employeeId, body) =>
    request('/users/Declaration', { method: 'POST', query: { employee_id: employeeId }, body }),
};

/* ----------------------------------------------------------- Positions --- */
export const positionsApi = {
  names: () => request('/positions'),
  all: () => request('/positions/all'),
  create: (name, description) =>
    request('/positions', { method: 'POST', body: { name, description } }),
  toggle: (id) => request(`/positions/${id}/toggle`, { method: 'PUT' }),
  remove: (id) => request(`/positions/${id}`, { method: 'DELETE' }),
};

/* ------------------------------------------------------------ Calendar --- */
export const calendarApi = {
  list: (year) => request('/calendar/holidays', { query: { year } }),
  add: ({ date, name, color }) =>
    request('/calendar/holidays', {
      method: 'POST',
      query: { holiday_date: date, name, color },
    }),
  upload: (file) =>
    request('/calendar/holidays/upload', { method: 'POST', formData: multipart({ file }) }),
  remove: (id) => request(`/calendar/holidays/${id}`, { method: 'DELETE' }),
  removeAll: () => request('/calendar/holidays', { method: 'DELETE' }),
};

/* ----------------------------------------------------- Frequent emails --- */
export const frequentEmailsApi = {
  search: (q, limit = 8) => request('/frequent-emails', { query: { q, limit } }),
  all: (page = 1, pageSize = 20) =>
    request('/frequent-emails/all', { query: { page, page_size: pageSize } }),
  add: (email) => request('/frequent-emails', { method: 'POST', body: { email } }),
  remove: (id) => request(`/frequent-emails/${id}`, { method: 'DELETE' }),
};

/* ------------------------------------------------------------- Letters --- */
const letter = (path) => (body) =>
  request(path, { method: 'POST', body, responseType: 'blob' });

export const lettersApi = {
  proposedOffer: letter('/proposed-offer-letter/generate'),
  appointment: letter('/appointment-letter/generate'),
  relieving: letter('/relieving-experience-letter/generate'),
  nda: letter('/nda/generate'),
};

/* ------------------------------------------------------------- Payroll --- */
export const salaryApi = {
  get: (employeeId) => request(`/salary-structure/${enc(employeeId)}`),
  history: (employeeId) => request(`/salary-structure/${enc(employeeId)}/history`),
  create: (employeeId, body) =>
    request(`/salary-structure/${enc(employeeId)}`, { method: 'POST', body }),
  revise: (employeeId, body) =>
    request(`/salary-structure/${enc(employeeId)}`, { method: 'PUT', body }),
};

export const payslipGeneratorApi = {
  generate: (body) =>
    request('/payslip-generator/generate', { method: 'POST', body, responseType: 'blob' }),
  generateBulk: (body) => request('/payslip-generator/generate-bulk', { method: 'POST', body }),
};

export const payslipsApi = {
  list: (employeeId, year) => request(`/payslips/${enc(employeeId)}`, { query: { year } }),
  downloadUrl: (employeeId, year, month) =>
    request(`/payslips/${enc(employeeId)}/${year}/${month}`),
  downloadAll: (employeeId, year) =>
    request(`/payslips/${enc(employeeId)}/download-all`, {
      query: { year },
      responseType: 'blob',
    }),
  upload: (employeeId, month, year, file) =>
    request(`/payslips/${enc(employeeId)}`, {
      method: 'POST',
      query: { month, year },
      formData: multipart({ file }),
    }),
  uploadZip: (file) =>
    request('/payslips/upload-zip', { method: 'POST', formData: multipart({ file }) }),
  remove: (employeeId, payslipId) =>
    request(`/payslips/${enc(employeeId)}/${payslipId}`, { method: 'DELETE' }),
};

/* ---------------------------------------------------- Document history --- */
export const documentHistoryApi = {
  list: (query) => request('/dashboard/document-history', { query }),
  summary: () => request('/dashboard/document-history/summary'),
  download: (id) => request(`/dashboard/document-history/${id}/download`),
  remove: (id) => request(`/dashboard/document-history/${id}`, { method: 'DELETE' }),
  bulkRemove: (ids) =>
    request('/dashboard/document-history/bulk', { method: 'DELETE', body: { history_ids: ids } }),
};

/* ----------------------------------------------------------- Dashboard --- */
export const dashboardApi = {
  overview: (query) => request('/dashboard/overview', { query }),
  funnel: () => request('/dashboard/onboarding-funnel'),
  stuckEmployees: (query) => request('/dashboard/stuck-employees', { query }),
  signatureStatus: () => request('/dashboard/signature-status'),
  documentMetrics: () => request('/dashboard/document-metrics'),
  celebrations: (query) => request('/dashboard/celebrations', { query }),
  sendWish: (body) => request('/dashboard/celebrations/wish', { method: 'POST', body }),
};

/* ------------------------------------------------------ Zoho signing ---- */
export const signingApi = {
  start: () => request('/zoho-sign/start', { method: 'POST' }),
  // envelope: 'appointment_letter' | 'nda_policy_pack'; omitted = whichever is waiting.
  session: (envelope) => request('/zoho-sign/session', { query: { envelope } }),
  status: () => request('/zoho-sign/status'),
};

export const signatureAdminApi = {
  health: () => request('/zoho-sign/admin/health'),
  list: (query) => request('/zoho-sign/admin/requests', { query }),
  get: (id) => request(`/zoho-sign/admin/requests/${id}`),
  countersign: (id) => request(`/zoho-sign/admin/requests/${id}/countersign`, { method: 'POST' }),
  documents: (id) => request(`/zoho-sign/admin/requests/${id}/documents`),
  sync: (id) => request(`/zoho-sign/admin/requests/${id}/sync`, { method: 'POST' }),
  retry: (id) => request(`/zoho-sign/admin/requests/${id}/retry`, { method: 'POST' }),
  remind: (id) => request(`/zoho-sign/admin/requests/${id}/remind`, { method: 'POST' }),
  cancel: (id) => request(`/zoho-sign/admin/requests/${id}/cancel`, { method: 'POST' }),
  // Both envelopes when envelope is omitted.
  readiness: (employeeId, envelope) =>
    request(`/zoho-sign/admin/contracts/${enc(employeeId)}/readiness`, { query: { envelope } }),
  send: (employeeId, envelope) =>
    request(`/zoho-sign/admin/contracts/${enc(employeeId)}/start`, { method: 'POST', query: { envelope } }),
};
