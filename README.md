# Medimade HMS

Medimade HMS is a full-stack hospital management platform built to manage real healthcare operations across departments, roles, patients, clinical workflows, inventory, billing, and reporting.

The project is designed as a modern healthcare SaaS dashboard: secure, role-aware, responsive, and backed by a relational Supabase Postgres schema with Row Level Security. It demonstrates how a hospital operations system can be structured beyond a basic CRUD app, with modular services, protected server-side workflows, typed validation, audit trails, analytics, and realistic domain boundaries.

## What It Does

Medimade HMS helps hospitals coordinate the operational flow from patient registration through appointments, admissions, treatment, lab work, prescriptions, stock movement, invoicing, and reporting.

Core capabilities include:

- Patient registration, profiles, emergency contacts, insurance details, and clinical timeline
- Appointment scheduling with doctor availability checks and status workflows
- Admissions, discharge, ward/room/bed allocation, transfers, and occupancy tracking
- Doctor, nurse, and staff management with department assignments
- Clinical encounters, vitals, diagnosis records, notes, and treatment plans
- Prescription management and pharmacy dispensing workflows
- Medicine catalog, suppliers, inventory batches, reorder levels, stock movements, low-stock alerts, and expiry alerts
- Lab test catalog, lab orders, result entry, critical result tracking, and patient timeline integration
- Billing, invoices, invoice items, tax/discount calculations, partial payments, and payment history
- Reports for occupancy, revenue, patient growth, appointments, lab workload, and inventory health
- Notifications, audit logs, protected API routes, and role-based dashboard navigation

## Roles Supported

The platform includes role-based access patterns for:

- `super_admin`
- `hospital_admin`
- `doctor`
- `nurse`
- `receptionist`
- `pharmacist`
- `lab_technician`
- `billing_staff`

Each role receives scoped navigation and permission-aware access to hospital workflows. The system is designed so users belong to a hospital through their profile, while super admins can operate across hospitals.

## Tech Stack

- **Framework:** Next.js 15 App Router
- **Language:** TypeScript
- **Database:** Supabase Postgres
- **Auth:** Supabase Auth
- **Security:** Supabase Row Level Security and server-side route guards
- **UI:** Tailwind CSS and shadcn/ui-style components
- **Forms:** React Hook Form
- **Validation:** Zod
- **Tables:** TanStack Table
- **Charts:** Recharts
- **Dates:** date-fns
- **Deployment Target:** Vercel

## Architecture Highlights

Medimade HMS follows a modular architecture intended to stay maintainable as the product grows.

- **App Router-first routing:** Dashboard pages, auth pages, dynamic patient/admission/appointment routes, and API route handlers live under `app/`.
- **Server-first data access:** Server Components and server-side helpers are used for protected data fetching wherever possible.
- **Clean service layer:** Domain services in `lib/services` centralize Supabase access, permission checks, filtering, pagination, and audit logging.
- **Validation by module:** Zod schemas in `lib/validations` define expected payloads for patients, appointments, admissions, inventory, lab, billing, and staff flows.
- **Reusable UI:** Forms, tables, cards, charts, modals, badges, empty states, and layout components are split into focused folders under `components/`.
- **Hospital-scoped tenancy:** Database records are associated with `hospital_id`, and RLS policies enforce tenant boundaries.
- **Typed domain model:** Shared TypeScript types model roles, database records, common API responses, and workflow states.
- **Production deployment path:** Environment variables are separated from source control and configured through Vercel for live deployments.

## Security Model

The application is built around secure defaults:

- Dashboard pages require server-side authentication.
- Authenticated users must have an active profile mapped to a hospital.
- API routes return consistent success/error responses.
- Mutations validate payloads with Zod before database writes.
- Client-supplied hospital IDs are not trusted for guarded operations.
- Supabase RLS scopes data by hospital membership.
- `super_admin` policies are separated from hospital-local roles.
- Audit logs are designed for controlled server-side writes.
- The Supabase service role key is server-only and must never be exposed to the browser.

## Product Modules

### Patient Management

Patients can be searched, filtered, created, edited, soft deleted, and viewed through a detailed profile. The patient detail experience connects registration data with admissions, appointments, prescriptions, lab history, invoices, and a timeline-style clinical view.

### Appointments

Appointments support scheduled, checked-in, in-progress, completed, cancelled, and no-show states. The scheduling layer includes doctor/department filters and overlap protection for doctor bookings.

### Admissions, Rooms, Wards, and Beds

Admissions connect patients to departments, assigned doctors, wards, rooms, and beds. Bed allocation logic tracks availability, occupancy, transfers, discharge, and historical allocation records.

### Clinical Workflows

Clinical encounter workflows cover chief complaints, doctor notes, nurse notes, vitals, diagnoses, primary diagnosis marking, treatment plans, linked prescriptions, linked lab orders, and encounter completion.

### Pharmacy and Inventory

The pharmacy module manages medicines, suppliers, stock batches, expiry dates, quantity on hand, reorder levels, costs, selling prices, stock adjustments, dispensing rules, and inventory alerts.

### Laboratory

The lab module supports test catalogs, multi-test lab orders, technician assignment, reference ranges, result statuses, critical values, and order completion.

### Billing

Billing supports invoice creation, invoice items, service charges, room charges, medication charges, lab charges, consultation fees, tax, discount, outstanding balances, full payments, and partial payments.

### Reports and Analytics

Reports use dashboard cards and Recharts visualizations for hospital KPIs, including occupancy, revenue, appointments, inventory, lab workload, and patient growth.

## Project Structure

```text
app/                  App Router pages, layouts, and API routes
components/           Layout, forms, tables, cards, charts, and modals
lib/actions/          Server actions for guarded mutations
lib/services/         Domain service layer
lib/supabase/         Supabase browser/server/middleware clients
lib/validations/      Zod schemas
lib/utils/            Permissions, formatting, date helpers, constants
supabase/migrations/  Database schema
supabase/rls.sql      Row Level Security policies
supabase/views.sql    Reporting views
types/                Shared TypeScript types
```

## Running Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Keep real `.env` files out of Git. Use `.env.example` only as a template.

## Database Setup

Create a Supabase project, then apply:

```text
supabase/migrations/0001_medimade_hms_schema.sql
supabase/rls.sql
supabase/views.sql
```

You can apply these with the Supabase SQL Editor or through your preferred migration workflow. For existing databases, review enum/table changes, back up the database, and apply migrations in order.

## Initial Admin Profile

After creating a Supabase Auth user, add a matching profile row for that user. Replace the placeholder values with your own hospital and Auth user IDs.

```sql
insert into public.profiles (
  auth_user_id,
  hospital_id,
  full_name,
  email,
  role,
  phone,
  is_active
) values (
  'AUTH_USER_UUID_HERE',
  'HOSPITAL_UUID_HERE',
  'Hospital Administrator',
  'admin@example.com',
  'hospital_admin',
  '+1-000-000-0000',
  true
)
on conflict (auth_user_id) do update set
  hospital_id = excluded.hospital_id,
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  phone = excluded.phone,
  is_active = true;
```

Use `super_admin` only for platform-level access across hospitals.

## Deployment

The app is ready for deployment on Vercel.

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Add the required environment variables in Vercel Project Settings.
4. Set `NEXT_PUBLIC_APP_URL` to the deployed URL.
5. Add the deployed URL to Supabase Auth redirect URLs.
6. Deploy.

Before deployment, verify:

```bash
npm run typecheck
npm run lint
npm run build
```

## Why This Project Matters

Medimade HMS shows practical full-stack engineering across product design, database modeling, authentication, authorization, healthcare domain workflows, analytics, and deployment readiness. It is structured to demonstrate production thinking: clear modules, typed boundaries, validation, secure data access, reusable UI, and workflow-aware business logic.

