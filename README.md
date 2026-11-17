# ISCS Technologies Private Limited — HRMS Frontend

React web portal for the ISCS HRMS FastAPI backend: employee onboarding with
Aadhaar eSign through Zoho Sign, employee self-service, and HR operations.

## Stack

- React 18 + Vite 5 (JavaScript)
- React Router 6, TanStack Query 5
- Tailwind CSS 3, lucide-react icons

## Getting started

```bash
cd frontend
npm install
cp .env.example .env      # then edit
npm run dev               # http://localhost:5173/hrms/
npm run build             # production build in dist/
```

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | FastAPI backend URL |
| `VITE_BASE_PATH` | `/hrms/` | Path the app is served under. Keep `/hrms/`: the backend emails password links to `{FRONTEND_URL}/hrms/reset-password`. |
| `VITE_ZOHO_EMBED_HOST` | `https://www.iscstech.co.in` | Must equal `ZOHO_SIGN_EMBED_HOST` on the backend. Zoho only renders the signing iframe on this origin. |

When deploying, serve `dist/` under `/hrms/` with a fallback to `index.html`
for client-side routes.

## What's inside

**Employee**
- **Onboarding wizard** (`/onboarding`): six steps, resumable, saves through the existing `/users/*` endpoints.
- **Step 6 — Declaration & signing, Zoho Sign only.** The declaration is saved with `sign_policies: false`, so no font-rendered "signatures" are ever created. The appointment letter, NDA, policies and declaration are signed in Zoho's embedded window with one Aadhaar OTP. `pending_service` (contracts not generated yet) never blocks the employee from finishing.
- Home, My profile, My documents, Payslips, Document signing, Holiday calendar.

**HR / Super Admin**
- Dashboard: KPIs, action items, onboarding funnel, workforce, e-signature and email-delivery health, celebrations with one-click formal wishes.
- Employees directory and 360° employee page (profile, documents, salary, payslips, e-signature).
- Onboarding tracker (stalled employees by urgency).
- HR letters: proposed offer, appointment, NDA, relieving & experience — autofill from employee records, live salary breakup, To/CC/BCC with address suggestions.
- E-signatures hub: countersign in Zoho, download sealed bundle + completion certificate, sync / remind / retry / cancel, send packages with a readiness check. Zoho setup diagnostics.
- Payroll: versioned salary structures, bulk and single payslip runs, payslip uploads (single PDF or ZIP).
- Dispatch history, Users & access, Holiday calendar, Positions, Email directory.

**Admin role**: Holiday calendar, payslip uploads, users (the backend does not grant this role the HR modules).

## Project layout

```
src/
  api/index.js            every backend endpoint, grouped by domain
  lib/                    http client (token refresh), auth context, formatting, salary maths, hooks
  components/ui/          design-system primitives (Button, Card, Modal, Tabs, Toast…)
  components/             EmployeePicker, EmailRecipients, FileUpload, status badges, charts, layout
  features/
    auth/  onboarding/  signing/  me/  dashboard/  employees/
    letters/  signatures/  payroll/  documents/  admin/
```

## Backend behaviours worth knowing

- **Filenames**: the backend does not expose `Content-Disposition` via CORS, so downloaded PDFs/ZIPs are named on the client.
- **Title-casing**: `PUT /db/employment-applications/{id}` title-cases most text fields (e.g. `MBA` → `Mba`). The wizard uses it only for list sections (family, education, training, experience, references); "About you" goes through the dedicated `/users/About_Self` endpoints to keep text as typed.
- **Holidays are stored per tenant**, and every user has their own tenant, so holidays HR adds are not visible to employees until the backend shares the calendar across tenants.
- **Employee ID changes** are intentionally not offered in the UI: the rename path in `PUT /users/Basic_Employee_Details` recreates the employee row and drops salary structures and signature history.
