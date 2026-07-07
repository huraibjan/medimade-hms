# Medimade HMS

Medimade HMS is a production-grade Healthcare / Hospital Management System built with Next.js 15 App Router, TypeScript, Supabase Postgres/Auth/RLS/Storage, Tailwind CSS, shadcn/ui-style components, React Hook Form, Zod, TanStack Table, Recharts, and date-fns.

The platform is designed for multi-role hospital operations: patient registration, appointments, admissions, rooms, wards, beds, clinical encounters, vitals, diagnoses, treatment plans, prescriptions, lab orders/results, pharmacy inventory, billing, reports, audit logs, and administration.

## Tech Stack

- Next.js 15 App Router and React Server Components
- TypeScript
- Supabase Postgres, Auth, Row Level Security, and Storage
- Tailwind CSS and shadcn/ui-style local primitives
- React Hook Form and Zod validation
- TanStack Table
- Recharts
- date-fns
- Vercel deployment

## Feature Summary

- Authentication with Supabase Auth and protected dashboard routes
- RBAC for `super_admin`, `hospital_admin`, `doctor`, `nurse`, `receptionist`, `pharmacist`, `lab_technician`, and `billing_staff`
- Hospital-scoped server actions and API route guards
- Patient management with search, filters, profile overview, clinical timeline, admissions, appointments, prescriptions, labs, and billing history
- Appointment scheduling with doctor overlap protection and workflow statuses
- Admissions, wards, rooms, beds, bed assignment, transfer, discharge, and audit logging
- Clinical encounters, vitals, diagnoses, treatment plans, and notes
- Pharmacy catalog, suppliers, inventory batches, stock movements, low-stock alerts, expiry alerts, and dispensing logic
- Lab test catalog, lab orders, multi-test results, critical results, technician workflow
- Billing, invoices, invoice items, payments, partial payment handling, and print-friendly invoice detail
- Reports dashboard with occupancy, revenue, inventory, lab, and patient analytics
- Loading, error, empty, success toast, confirmation dialog, and responsive table states

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

If Supabase environment variables are not configured, much of the UI falls back to realistic local demo data so product review can continue before infrastructure setup.

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Security notes:

- Never commit real `.env` or `.env.local` files.
- `NEXT_PUBLIC_SUPABASE_URL` must be the bare project URL, not `/rest/v1`.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Do not expose it with a `NEXT_PUBLIC_` prefix.

## Supabase Setup

1. Create a new Supabase project.
2. In Supabase Dashboard, open SQL Editor.
3. Run the schema migration:

```sql
-- Paste and run:
-- supabase/migrations/0001_medimade_hms_schema.sql
```

4. Run optional view definitions if you want to refresh report views separately:

```sql
-- Paste and run:
-- supabase/views.sql
```

5. Run optional RLS policy file if applying policies separately:

```sql
-- Paste and run:
-- supabase/rls.sql
```

The main migration includes the production schema, enums, indexes, triggers, audit-related structures, and storage bucket foundations. The RLS file contains helper functions and hospital-scoped policies for tenant isolation.

## Database Migration Instructions

For a fresh project, run:

```bash
supabase db push
```

or paste `supabase/migrations/0001_medimade_hms_schema.sql` into the SQL Editor.

For an existing project:

1. Back up the database.
2. Review enum changes and table definitions.
3. Apply migrations in timestamp order.
4. Re-run `supabase/rls.sql` if policies were changed.
5. Re-run `supabase/views.sql` if reporting views were changed.

## Seed Data Instructions

Development seed data is available at:

- `supabase/seed.sql`
- `supabase/seed/seed.sql`

To seed via SQL Editor, paste and run `supabase/seed.sql`.

To seed with Supabase CLI, configure the local project and run the seed file through `psql` or your preferred SQL runner after migrations are applied.

The seed creates NorthBridge Medical Center in New York with departments, staff, doctors, nurses, patients, admissions, beds, appointments, encounters, vitals, diagnoses, treatments, medications, inventory, suppliers, stock movements, prescriptions, lab orders, invoices, payments, notifications, and audit logs.

## Admin Account Creation

1. In Supabase Dashboard, go to Authentication -> Users.
2. Create a confirmed user with:
   - Email: `admin@gmail.com`
   - Password: `DemoAdmin2026!`
3. Insert or update the matching `profiles` row:

```sql
with demo_auth_user as (
  select id
  from auth.users
  where lower(email) = 'admin@gmail.com'
  limit 1
)
insert into public.profiles (
  auth_user_id,
  hospital_id,
  full_name,
  email,
  role,
  phone,
  is_active
)
select
  id,
  '00000000-0000-4000-8000-000000000001',
  'NorthBridge Administrator',
  'admin@gmail.com',
  'hospital_admin',
  '+1-212-555-0100',
  true
from demo_auth_user
on conflict (auth_user_id) do update set
  hospital_id = excluded.hospital_id,
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  phone = excluded.phone,
  is_active = true;
```

For global platform access, use `role = 'super_admin'`. Super admins can access all hospitals through RLS helper policies.

The login page displays the same demo account by default. Override the visible demo credentials with `NEXT_PUBLIC_DEMO_LOGIN_EMAIL` and `NEXT_PUBLIC_DEMO_LOGIN_PASSWORD` in Vercel if you change them in Supabase Auth.

## Vercel Deployment

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Set Framework Preset to Next.js.
4. Add environment variables from `.env.example`.
5. Set `NEXT_PUBLIC_APP_URL` to the deployed Vercel URL.
6. Deploy.

The included `vercel.json` uses:

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "buildCommand": "npm run build"
}
```

After deployment, add the Vercel URL to Supabase Auth redirect URLs.

## Verification

Run these before every deployment:

```bash
npm run typecheck
npm run lint
npm run build
```

## Important Paths

- App routes: `app/(dashboard)`
- API routes: `app/api`
- UI components: `components`
- Server actions: `lib/actions`
- Services: `lib/services`
- Validation schemas: `lib/validations`
- Supabase clients: `lib/supabase`
- Database schema: `supabase/migrations/0001_medimade_hms_schema.sql`
- RLS policies: `supabase/rls.sql`
- Reporting views: `supabase/views.sql`
- Seed data: `supabase/seed.sql`

## Security Model

- Dashboard pages are protected by server-side auth checks.
- API routes use `requireServiceContext`.
- Server actions use `guardAction`.
- Client-supplied hospital IDs are not trusted by guarded mutations.
- Supabase RLS scopes records by `profiles.hospital_id`.
- `super_admin` can access all hospitals.
- Audit logs are controlled by server-side writes and RLS policy restrictions.
