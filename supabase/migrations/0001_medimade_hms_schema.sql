-- Medimade HMS production schema for Supabase Postgres.
-- This migration is designed for a fresh Supabase project.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum (
    'super_admin',
    'hospital_admin',
    'doctor',
    'nurse',
    'receptionist',
    'pharmacist',
    'lab_technician',
    'billing_staff'
  );
exception when duplicate_object then null; end $$;

do $$ begin create type public.gender_type as enum ('male', 'female', 'other', 'unknown'); exception when duplicate_object then null; end $$;
do $$ begin create type public.blood_group as enum ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'); exception when duplicate_object then null; end $$;
do $$ begin create type public.staff_status as enum ('active', 'on_leave', 'suspended', 'terminated'); exception when duplicate_object then null; end $$;
do $$ begin create type public.room_type as enum ('general', 'private', 'semi_private', 'icu', 'emergency', 'operating', 'isolation'); exception when duplicate_object then null; end $$;
do $$ begin create type public.room_status as enum ('available', 'occupied', 'reserved', 'cleaning', 'maintenance', 'inactive'); exception when duplicate_object then null; end $$;
do $$ begin create type public.bed_status as enum ('available', 'occupied', 'reserved', 'cleaning', 'maintenance'); exception when duplicate_object then null; end $$;
do $$ begin create type public.admission_status as enum ('admitted', 'transferred', 'discharged', 'cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.appointment_status as enum ('scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'); exception when duplicate_object then null; end $$;
do $$ begin create type public.encounter_status as enum ('draft', 'in_progress', 'completed', 'cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.prescription_status as enum ('active', 'completed', 'cancelled', 'expired'); exception when duplicate_object then null; end $$;
do $$ begin create type public.lab_order_status as enum ('ordered', 'sample_collected', 'processing', 'completed', 'cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.lab_result_status as enum ('pending', 'normal', 'abnormal', 'critical'); exception when duplicate_object then null; end $$;
do $$ begin create type public.invoice_status as enum ('draft', 'issued', 'partially_paid', 'paid', 'cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status as enum ('pending', 'completed', 'failed', 'refunded', 'void'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_method as enum ('cash', 'card', 'bank_transfer', 'insurance', 'online'); exception when duplicate_object then null; end $$;
do $$ begin create type public.stock_movement_type as enum ('purchase', 'dispense', 'adjustment', 'return', 'transfer_in', 'transfer_out', 'expired', 'damaged'); exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  license_number text,
  tax_id text,
  phone text,
  email text,
  website text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text not null default 'United States',
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hospitals_email_format check (email is null or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  floor text,
  phone_extension text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint departments_code_not_blank check (btrim(code) <> ''),
  constraint departments_name_not_blank check (btrim(name) <> '')
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  hospital_id uuid references public.hospitals(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  role public.user_role not null,
  avatar_url text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_format check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  constraint profiles_name_not_blank check (btrim(full_name) <> '')
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  employee_code text not null,
  job_title text not null,
  employment_type text,
  shift text,
  status public.staff_status not null default 'active',
  hire_date date,
  termination_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint staff_employee_code_not_blank check (btrim(employee_code) <> ''),
  constraint staff_termination_after_hire check (termination_date is null or hire_date is null or termination_date >= hire_date)
);

create table if not exists public.wards (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  name text not null,
  floor text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wards_name_not_blank check (btrim(name) <> '')
);

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  specialization text,
  license_number text not null,
  consultation_fee numeric(12,2) not null default 0,
  years_experience integer not null default 0,
  availability_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint doctors_consultation_fee_nonnegative check (consultation_fee >= 0),
  constraint doctors_years_experience_nonnegative check (years_experience >= 0)
);

create table if not exists public.nurses (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  nursing_license_number text not null,
  assigned_ward_id uuid references public.wards(id) on delete set null,
  shift text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  mrn text not null,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  gender public.gender_type not null default 'unknown',
  blood_group public.blood_group not null default 'unknown',
  phone text,
  email text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text not null default 'United States',
  allergies text,
  chronic_conditions text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint patients_mrn_not_blank check (btrim(mrn) <> ''),
  constraint patients_first_name_not_blank check (btrim(first_name) <> ''),
  constraint patients_last_name_not_blank check (btrim(last_name) <> ''),
  constraint patients_date_of_birth_valid check (date_of_birth <= current_date),
  constraint patients_email_format check (email is null or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  full_name text not null,
  relationship text not null,
  phone text not null,
  email text,
  address text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint emergency_contacts_name_not_blank check (btrim(full_name) <> '')
);

create table if not exists public.insurance_providers (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  payer_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint insurance_providers_name_not_blank check (btrim(name) <> '')
);

create table if not exists public.patient_insurance (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  insurance_provider_id uuid not null references public.insurance_providers(id) on delete restrict,
  policy_number text not null,
  group_number text,
  subscriber_name text,
  relationship_to_patient text,
  valid_from date,
  valid_until date,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_insurance_policy_not_blank check (btrim(policy_number) <> ''),
  constraint patient_insurance_valid_dates check (valid_until is null or valid_from is null or valid_until >= valid_from)
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  ward_id uuid not null references public.wards(id) on delete cascade,
  room_number text not null,
  room_type public.room_type not null default 'general',
  status public.room_status not null default 'available',
  daily_rate numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_daily_rate_nonnegative check (daily_rate >= 0),
  constraint rooms_room_number_not_blank check (btrim(room_number) <> '')
);

create table if not exists public.beds (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  bed_number text not null,
  status public.bed_status not null default 'available',
  current_patient_id uuid references public.patients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint beds_bed_number_not_blank check (btrim(bed_number) <> '')
);

create table if not exists public.admissions (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  admitting_doctor_id uuid references public.doctors(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  admission_datetime timestamptz not null default now(),
  expected_discharge_datetime timestamptz,
  discharge_datetime timestamptz,
  reason text not null,
  diagnosis_summary text,
  status public.admission_status not null default 'admitted',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admissions_expected_after_admission check (expected_discharge_datetime is null or expected_discharge_datetime >= admission_datetime),
  constraint admissions_discharge_after_admission check (discharge_datetime is null or discharge_datetime >= admission_datetime)
);

create table if not exists public.bed_allocations (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  admission_id uuid not null references public.admissions(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  bed_id uuid not null references public.beds(id) on delete restrict,
  allocated_at timestamptz not null default now(),
  released_at timestamptz,
  allocated_by uuid references public.profiles(id) on delete set null,
  release_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bed_allocations_release_after_allocate check (released_at is null or released_at >= allocated_at)
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  department_id uuid references public.departments(id) on delete set null,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  reason text,
  status public.appointment_status not null default 'scheduled',
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancellation_reason text,
  constraint appointments_end_after_start check (scheduled_end > scheduled_start),
  constraint appointments_cancelled_reason check (cancelled_at is null or cancellation_reason is not null)
);

create table if not exists public.clinical_encounters (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  admission_id uuid references public.admissions(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  doctor_id uuid references public.doctors(id) on delete set null,
  nurse_id uuid references public.nurses(id) on delete set null,
  encounter_type text not null,
  chief_complaint text,
  notes text,
  status public.encounter_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint encounters_ended_after_started check (ended_at is null or ended_at >= started_at)
);

create table if not exists public.vitals (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  recorded_by uuid references public.profiles(id) on delete set null,
  temperature_c numeric(5,2),
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  pulse integer,
  respiratory_rate integer,
  oxygen_saturation numeric(5,2),
  weight_kg numeric(7,2),
  height_cm numeric(7,2),
  pain_score integer,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint vitals_pain_score_range check (pain_score is null or pain_score between 0 and 10),
  constraint vitals_oxygen_range check (oxygen_saturation is null or oxygen_saturation between 0 and 100)
);

create table if not exists public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  doctor_id uuid references public.doctors(id) on delete set null,
  diagnosis_code text,
  diagnosis_name text not null,
  description text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.treatment_plans (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  doctor_id uuid references public.doctors(id) on delete set null,
  plan_title text not null,
  plan_details text,
  start_date date,
  end_date date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint treatment_plans_end_after_start check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  name text not null,
  generic_name text,
  brand_name text,
  strength text,
  dosage_form text,
  manufacturer text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medications_name_not_blank check (btrim(name) <> '')
);

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  doctor_id uuid references public.doctors(id) on delete set null,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  status public.prescription_status not null default 'active',
  prescribed_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete restrict,
  dosage text not null,
  frequency text not null,
  duration text,
  route text,
  instructions text,
  quantity numeric(10,2) not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prescription_items_quantity_positive check (quantity > 0)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint suppliers_name_not_blank check (btrim(name) <> '')
);

create table if not exists public.medicine_inventory (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete restrict,
  supplier_id uuid references public.suppliers(id) on delete set null,
  sku text not null,
  batch_no text not null,
  expiry_date date not null,
  quantity_on_hand integer not null default 0,
  reorder_level integer not null default 0,
  unit_cost numeric(12,2) not null default 0,
  selling_price numeric(12,2) not null default 0,
  storage_location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medicine_inventory_quantity_nonnegative check (quantity_on_hand >= 0),
  constraint medicine_inventory_reorder_nonnegative check (reorder_level >= 0),
  constraint medicine_inventory_cost_nonnegative check (unit_cost >= 0),
  constraint medicine_inventory_price_nonnegative check (selling_price >= 0),
  constraint medicine_inventory_sku_not_blank check (btrim(sku) <> ''),
  constraint medicine_inventory_batch_not_blank check (btrim(batch_no) <> '')
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  inventory_id uuid not null references public.medicine_inventory(id) on delete restrict,
  movement_type public.stock_movement_type not null,
  quantity integer not null,
  reason text,
  reference_number text,
  performed_by uuid references public.profiles(id) on delete set null,
  movement_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint stock_movements_quantity_nonzero check (quantity <> 0)
);

create table if not exists public.lab_tests (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  test_name text not null,
  test_code text not null,
  category text,
  description text,
  sample_type text,
  price numeric(12,2) not null default 0,
  reference_range text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lab_tests_name_not_blank check (btrim(test_name) <> ''),
  constraint lab_tests_code_not_blank check (btrim(test_code) <> ''),
  constraint lab_tests_price_nonnegative check (price >= 0)
);

create table if not exists public.lab_orders (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  doctor_id uuid references public.doctors(id) on delete set null,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  status public.lab_order_status not null default 'ordered',
  priority text not null default 'routine',
  ordered_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lab_orders_completed_after_ordered check (completed_at is null or completed_at >= ordered_at),
  constraint lab_orders_priority_allowed check (priority in ('routine', 'urgent', 'stat'))
);

create table if not exists public.lab_order_items (
  id uuid primary key default gen_random_uuid(),
  lab_order_id uuid not null references public.lab_orders(id) on delete cascade,
  lab_test_id uuid not null references public.lab_tests(id) on delete restrict,
  result_value text,
  result_unit text,
  reference_range text,
  result_status public.lab_result_status not null default 'pending',
  technician_id uuid references public.staff(id) on delete set null,
  result_notes text,
  resulted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  admission_id uuid references public.admissions(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  invoice_number text not null,
  subtotal numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  status public.invoice_status not null default 'draft',
  issued_at timestamptz,
  due_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_amounts_nonnegative check (subtotal >= 0 and tax_amount >= 0 and discount_amount >= 0 and total_amount >= 0),
  constraint invoices_due_after_issue check (due_at is null or issued_at is null or due_at >= issued_at),
  constraint invoices_number_not_blank check (btrim(invoice_number) <> '')
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  item_type text not null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  constraint invoice_items_quantity_positive check (quantity > 0),
  constraint invoice_items_prices_nonnegative check (unit_price >= 0 and total_price >= 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null,
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'pending',
  transaction_reference text,
  paid_at timestamptz,
  received_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint payments_amount_positive check (amount > 0)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text,
  notification_type text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_title_not_blank check (btrim(title) <> '')
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_not_blank check (btrim(action) <> ''),
  constraint audit_logs_entity_type_not_blank check (btrim(entity_type) <> '')
);

create unique index if not exists hospitals_license_number_unique on public.hospitals (license_number) where license_number is not null;
create unique index if not exists departments_hospital_code_unique on public.departments (hospital_id, lower(code)) where deleted_at is null;
create unique index if not exists profiles_auth_user_id_unique on public.profiles (auth_user_id);
create unique index if not exists profiles_hospital_email_unique on public.profiles (hospital_id, lower(email));
create unique index if not exists staff_hospital_employee_code_unique on public.staff (hospital_id, lower(employee_code)) where deleted_at is null;
create unique index if not exists doctors_staff_id_unique on public.doctors (staff_id);
create unique index if not exists doctors_license_number_unique on public.doctors (license_number);
create unique index if not exists nurses_staff_id_unique on public.nurses (staff_id);
create unique index if not exists nurses_license_number_unique on public.nurses (nursing_license_number);
create unique index if not exists patients_hospital_mrn_unique on public.patients (hospital_id, mrn) where deleted_at is null;
create unique index if not exists insurance_providers_hospital_payer_code_unique on public.insurance_providers (hospital_id, payer_code) where payer_code is not null;
create unique index if not exists wards_hospital_name_unique on public.wards (hospital_id, lower(name));
create unique index if not exists rooms_hospital_room_number_unique on public.rooms (hospital_id, lower(room_number));
create unique index if not exists beds_room_bed_number_unique on public.beds (room_id, lower(bed_number));
create unique index if not exists active_bed_allocation_unique on public.bed_allocations (bed_id) where released_at is null;
create unique index if not exists medications_hospital_name_strength_unique on public.medications (hospital_id, lower(name), coalesce(lower(strength), ''));
create unique index if not exists medicine_inventory_hospital_sku_batch_unique on public.medicine_inventory (hospital_id, lower(sku), lower(batch_no));
create unique index if not exists lab_tests_hospital_code_unique on public.lab_tests (hospital_id, lower(test_code));
create unique index if not exists invoices_hospital_number_unique on public.invoices (hospital_id, lower(invoice_number));

create index if not exists idx_patients_mrn on public.patients (mrn);
create index if not exists idx_patients_hospital_id on public.patients (hospital_id);
create index if not exists idx_patients_name on public.patients (hospital_id, last_name, first_name);
create index if not exists idx_appointments_doctor_id on public.appointments (doctor_id);
create index if not exists idx_appointments_scheduled_start on public.appointments (scheduled_start);
create index if not exists idx_appointments_hospital_status_start on public.appointments (hospital_id, status, scheduled_start);
create index if not exists idx_admissions_patient_id on public.admissions (patient_id);
create index if not exists idx_admissions_status on public.admissions (status);
create index if not exists idx_admissions_hospital_status on public.admissions (hospital_id, status);
create index if not exists idx_beds_status on public.beds (status);
create index if not exists idx_beds_hospital_status on public.beds (hospital_id, status);
create index if not exists idx_medicine_inventory_expiry_date on public.medicine_inventory (expiry_date);
create index if not exists idx_medicine_inventory_quantity_on_hand on public.medicine_inventory (quantity_on_hand);
create index if not exists idx_invoices_patient_id on public.invoices (patient_id);
create index if not exists idx_invoices_status on public.invoices (status);
create index if not exists idx_invoices_hospital_status on public.invoices (hospital_id, status);
create index if not exists idx_audit_logs_entity_type_entity_id on public.audit_logs (entity_type, entity_id);
create index if not exists idx_audit_logs_hospital_created_at on public.audit_logs (hospital_id, created_at desc);
create index if not exists idx_lab_orders_patient_status on public.lab_orders (patient_id, status);
create index if not exists idx_stock_movements_inventory_date on public.stock_movements (inventory_id, movement_date desc);
create index if not exists idx_notifications_profile_read on public.notifications (profile_id, is_read, created_at desc);

drop trigger if exists set_hospitals_updated_at on public.hospitals;
create trigger set_hospitals_updated_at before update on public.hospitals for each row execute function public.set_updated_at();
drop trigger if exists set_departments_updated_at on public.departments;
create trigger set_departments_updated_at before update on public.departments for each row execute function public.set_updated_at();
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists set_staff_updated_at on public.staff;
create trigger set_staff_updated_at before update on public.staff for each row execute function public.set_updated_at();
drop trigger if exists set_doctors_updated_at on public.doctors;
create trigger set_doctors_updated_at before update on public.doctors for each row execute function public.set_updated_at();
drop trigger if exists set_nurses_updated_at on public.nurses;
create trigger set_nurses_updated_at before update on public.nurses for each row execute function public.set_updated_at();
drop trigger if exists set_patients_updated_at on public.patients;
create trigger set_patients_updated_at before update on public.patients for each row execute function public.set_updated_at();
drop trigger if exists set_emergency_contacts_updated_at on public.emergency_contacts;
create trigger set_emergency_contacts_updated_at before update on public.emergency_contacts for each row execute function public.set_updated_at();
drop trigger if exists set_insurance_providers_updated_at on public.insurance_providers;
create trigger set_insurance_providers_updated_at before update on public.insurance_providers for each row execute function public.set_updated_at();
drop trigger if exists set_patient_insurance_updated_at on public.patient_insurance;
create trigger set_patient_insurance_updated_at before update on public.patient_insurance for each row execute function public.set_updated_at();
drop trigger if exists set_wards_updated_at on public.wards;
create trigger set_wards_updated_at before update on public.wards for each row execute function public.set_updated_at();
drop trigger if exists set_rooms_updated_at on public.rooms;
create trigger set_rooms_updated_at before update on public.rooms for each row execute function public.set_updated_at();
drop trigger if exists set_beds_updated_at on public.beds;
create trigger set_beds_updated_at before update on public.beds for each row execute function public.set_updated_at();
drop trigger if exists set_admissions_updated_at on public.admissions;
create trigger set_admissions_updated_at before update on public.admissions for each row execute function public.set_updated_at();
drop trigger if exists set_bed_allocations_updated_at on public.bed_allocations;
create trigger set_bed_allocations_updated_at before update on public.bed_allocations for each row execute function public.set_updated_at();
drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at before update on public.appointments for each row execute function public.set_updated_at();
drop trigger if exists set_clinical_encounters_updated_at on public.clinical_encounters;
create trigger set_clinical_encounters_updated_at before update on public.clinical_encounters for each row execute function public.set_updated_at();
drop trigger if exists set_diagnoses_updated_at on public.diagnoses;
create trigger set_diagnoses_updated_at before update on public.diagnoses for each row execute function public.set_updated_at();
drop trigger if exists set_treatment_plans_updated_at on public.treatment_plans;
create trigger set_treatment_plans_updated_at before update on public.treatment_plans for each row execute function public.set_updated_at();
drop trigger if exists set_medications_updated_at on public.medications;
create trigger set_medications_updated_at before update on public.medications for each row execute function public.set_updated_at();
drop trigger if exists set_prescriptions_updated_at on public.prescriptions;
create trigger set_prescriptions_updated_at before update on public.prescriptions for each row execute function public.set_updated_at();
drop trigger if exists set_prescription_items_updated_at on public.prescription_items;
create trigger set_prescription_items_updated_at before update on public.prescription_items for each row execute function public.set_updated_at();
drop trigger if exists set_suppliers_updated_at on public.suppliers;
create trigger set_suppliers_updated_at before update on public.suppliers for each row execute function public.set_updated_at();
drop trigger if exists set_medicine_inventory_updated_at on public.medicine_inventory;
create trigger set_medicine_inventory_updated_at before update on public.medicine_inventory for each row execute function public.set_updated_at();
drop trigger if exists set_lab_tests_updated_at on public.lab_tests;
create trigger set_lab_tests_updated_at before update on public.lab_tests for each row execute function public.set_updated_at();
drop trigger if exists set_lab_orders_updated_at on public.lab_orders;
create trigger set_lab_orders_updated_at before update on public.lab_orders for each row execute function public.set_updated_at();
drop trigger if exists set_lab_order_items_updated_at on public.lab_order_items;
create trigger set_lab_order_items_updated_at before update on public.lab_order_items for each row execute function public.set_updated_at();
drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at before update on public.invoices for each row execute function public.set_updated_at();

create or replace view public.active_admissions_view as
select
  a.id,
  a.hospital_id,
  a.patient_id,
  p.mrn,
  p.first_name,
  p.last_name,
  a.admitting_doctor_id,
  doctor_profile.full_name as admitting_doctor_name,
  a.department_id,
  d.name as department_name,
  a.admission_datetime,
  a.expected_discharge_datetime,
  a.reason,
  a.diagnosis_summary,
  a.status,
  ba.bed_id,
  b.bed_number,
  r.room_number,
  w.name as ward_name
from public.admissions a
join public.patients p on p.id = a.patient_id
left join public.departments d on d.id = a.department_id
left join public.doctors doc on doc.id = a.admitting_doctor_id
left join public.staff doctor_staff on doctor_staff.id = doc.staff_id
left join public.profiles doctor_profile on doctor_profile.id = doctor_staff.profile_id
left join public.bed_allocations ba on ba.admission_id = a.id and ba.released_at is null
left join public.beds b on b.id = ba.bed_id
left join public.rooms r on r.id = b.room_id
left join public.wards w on w.id = r.ward_id
where a.status in ('admitted', 'transferred');

create or replace view public.room_occupancy_view as
select
  r.hospital_id,
  w.id as ward_id,
  w.name as ward_name,
  r.id as room_id,
  r.room_number,
  r.room_type,
  r.status as room_status,
  count(b.id)::integer as total_beds,
  count(b.id) filter (where b.status = 'occupied')::integer as occupied_beds,
  count(b.id) filter (where b.status = 'available')::integer as available_beds,
  case when count(b.id) = 0 then 0 else round((count(b.id) filter (where b.status = 'occupied')::numeric / count(b.id)::numeric) * 100, 2) end as occupancy_percent
from public.rooms r
join public.wards w on w.id = r.ward_id
left join public.beds b on b.room_id = r.id
group by r.hospital_id, w.id, w.name, r.id, r.room_number, r.room_type, r.status;

create or replace view public.patient_timeline_view as
select hospital_id, patient_id, id as entity_id, 'admission'::text as event_type, admission_datetime as event_at, reason as title, status::text as status
from public.admissions
union all
select hospital_id, patient_id, id, 'appointment', scheduled_start, coalesce(reason, 'Appointment'), status::text
from public.appointments
union all
select hospital_id, patient_id, id, 'encounter', started_at, coalesce(chief_complaint, encounter_type), status::text
from public.clinical_encounters
union all
select hospital_id, patient_id, id, 'prescription', prescribed_at, 'Prescription', status::text
from public.prescriptions
union all
select hospital_id, patient_id, id, 'lab_order', ordered_at, 'Lab order', status::text
from public.lab_orders
union all
select hospital_id, patient_id, id, 'invoice', created_at, invoice_number, status::text
from public.invoices;

create or replace view public.medicine_low_stock_view as
select
  mi.id,
  mi.hospital_id,
  mi.medication_id,
  m.name as medication_name,
  m.generic_name,
  mi.sku,
  mi.batch_no,
  mi.quantity_on_hand,
  mi.reorder_level,
  mi.expiry_date,
  mi.storage_location
from public.medicine_inventory mi
join public.medications m on m.id = mi.medication_id
where mi.quantity_on_hand <= mi.reorder_level;

create or replace view public.expiring_medicines_view as
select
  mi.id,
  mi.hospital_id,
  mi.medication_id,
  m.name as medication_name,
  mi.sku,
  mi.batch_no,
  mi.quantity_on_hand,
  mi.expiry_date,
  (mi.expiry_date - current_date) as days_until_expiry
from public.medicine_inventory mi
join public.medications m on m.id = mi.medication_id
where mi.quantity_on_hand > 0
  and mi.expiry_date <= current_date + interval '90 days';

create or replace view public.daily_revenue_view as
select
  p.hospital_id,
  p.paid_at::date as revenue_date,
  count(p.id)::integer as payment_count,
  sum(p.amount)::numeric(12,2) as total_revenue
from public.payments p
where p.payment_status = 'completed'
  and p.paid_at is not null
group by p.hospital_id, p.paid_at::date;

create or replace view public.doctor_schedule_view as
select
  a.id as appointment_id,
  a.hospital_id,
  a.doctor_id,
  doctor_profile.full_name as doctor_name,
  a.patient_id,
  p.mrn,
  p.first_name as patient_first_name,
  p.last_name as patient_last_name,
  a.department_id,
  d.name as department_name,
  a.scheduled_start,
  a.scheduled_end,
  a.reason,
  a.status
from public.appointments a
join public.doctors doc on doc.id = a.doctor_id
join public.staff s on s.id = doc.staff_id
join public.profiles doctor_profile on doctor_profile.id = s.profile_id
join public.patients p on p.id = a.patient_id
left join public.departments d on d.id = a.department_id;

create or replace view public.dashboard_stats_view as
select
  h.id as hospital_id,
  h.name as hospital_name,
  coalesce(patient_stats.total_patients, 0)::integer as total_patients,
  coalesce(appointment_stats.appointments_today, 0)::integer as appointments_today,
  coalesce(admission_stats.active_admissions, 0)::integer as active_admissions,
  coalesce(bed_stats.available_beds, 0)::integer as available_beds,
  coalesce(invoice_stats.open_invoices, 0)::integer as open_invoices,
  coalesce(payment_stats.revenue_today, 0)::numeric(12,2) as revenue_today,
  coalesce(inventory_stats.low_stock_items, 0)::integer as low_stock_items,
  coalesce(lab_stats.pending_lab_orders, 0)::integer as pending_lab_orders
from public.hospitals h
left join lateral (
  select count(*) as total_patients
  from public.patients p
  where p.hospital_id = h.id and p.deleted_at is null
) patient_stats on true
left join lateral (
  select count(*) as appointments_today
  from public.appointments a
  where a.hospital_id = h.id and a.scheduled_start::date = current_date
) appointment_stats on true
left join lateral (
  select count(*) as active_admissions
  from public.admissions ad
  where ad.hospital_id = h.id and ad.status in ('admitted', 'transferred')
) admission_stats on true
left join lateral (
  select count(*) as available_beds
  from public.beds b
  where b.hospital_id = h.id and b.status = 'available'
) bed_stats on true
left join lateral (
  select count(*) as open_invoices
  from public.invoices inv
  where inv.hospital_id = h.id and inv.status in ('issued', 'partially_paid')
) invoice_stats on true
left join lateral (
  select sum(pay.amount) as revenue_today
  from public.payments pay
  where pay.hospital_id = h.id
    and pay.payment_status = 'completed'
    and pay.paid_at::date = current_date
) payment_stats on true
left join lateral (
  select count(*) as low_stock_items
  from public.medicine_inventory mi
  where mi.hospital_id = h.id and mi.quantity_on_hand <= mi.reorder_level
) inventory_stats on true
left join lateral (
  select count(*) as pending_lab_orders
  from public.lab_orders lo
  where lo.hospital_id = h.id and lo.status in ('ordered', 'sample_collected', 'processing')
) lab_stats on true;
