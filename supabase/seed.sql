-- Medimade HMS realistic development seed data.
-- Hospital: NorthBridge Medical Center, New York, USA.
-- Counts generated:
-- 1 hospital, 8 departments, 25 staff, 8 doctors, 10 nurses, 50 patients,
-- 20 emergency contacts, 5 insurance providers, 30 patient insurance records,
-- 6 wards, 40 rooms, 90 beds, 30 admissions, 25 bed allocations,
-- 60 appointments, 35 encounters, 50 vitals, 35 diagnoses, 25 treatment plans,
-- 60 medications, 60 inventory records, 8 suppliers, 100 stock movements,
-- 25 prescriptions, 75 prescription items, 30 lab tests, 40 lab orders,
-- 90 lab order items, 30 invoices, 50 invoice items, 20 payments,
-- 40 notifications, and 80 audit logs.

do $$
begin
  if to_regclass('auth.users') is not null then
    insert into auth.users (
      id,
      aud,
      role,
      email,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    select
      ('11000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
      'authenticated',
      'authenticated',
      lower(replace(staff_name, ' ', '.')) || '@northbridge.example',
      now() - interval '90 days',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', staff_name),
      now() - interval '120 days',
      now() - interval '1 day'
    from (
      select
        row_number() over () as i,
        staff_name
      from unnest(array[
        'Aisha Rahman',
        'Daniel Chen',
        'Olivia Martinez',
        'Marcus Thompson',
        'Priya Nair',
        'Samuel Brooks',
        'Emily Carter',
        'Rafael Ortiz',
        'Nora Kim',
        'Grace Patel',
        'Jamal Wright',
        'Hannah Lee',
        'Elena Kovacs',
        'Bianca Russo',
        'Maya Stein',
        'Fatima Al-Hassan',
        'Tyler Evans',
        'Sofia Morales',
        'Noah Bennett',
        'Irene Walsh',
        'Omar Haddad',
        'Leo Brooks',
        'Chloe Morgan',
        'Victor Hayes',
        'Mei Lin'
      ]) as staff_name
    ) staff_seed
    on conflict (id) do nothing;
  end if;
end $$;

insert into public.hospitals (
  id,
  name,
  legal_name,
  license_number,
  tax_id,
  phone,
  email,
  website,
  address_line1,
  address_line2,
  city,
  state,
  postal_code,
  country,
  logo_url,
  is_active
) values (
  '00000000-0000-4000-8000-000000000001',
  'NorthBridge Medical Center',
  'NorthBridge Medical Center LLC',
  'NY-HOSP-2026-4811',
  '13-4811026',
  '+1 212 555 4100',
  'operations@northbridge.example',
  'https://northbridge.example',
  '410 Riverside Medical Plaza',
  'Suite 100',
  'New York',
  'NY',
  '10027',
  'United States',
  'https://northbridge.example/logo.png',
  true
) on conflict (id) do nothing;

insert into public.departments (id, hospital_id, name, code, description, floor, phone_extension, is_active)
select
  ('10000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  name,
  code,
  description,
  floor,
  phone_extension,
  true
from (
  values
    (1, 'Emergency', 'ER', 'Emergency medicine, triage, and trauma stabilization', '2', '2201'),
    (2, 'Cardiology', 'CARD', 'Cardiac diagnostics, procedures, and inpatient cardiology', '5', '5501'),
    (3, 'Neurology', 'NEURO', 'Neurology consults, stroke care, and EEG services', '6', '6601'),
    (4, 'Orthopedics', 'ORTHO', 'Fracture care, sports medicine, and joint surgery', '4', '4401'),
    (5, 'Pediatrics', 'PEDS', 'Pediatric primary, emergency, and inpatient care', '3', '3301'),
    (6, 'Radiology', 'RAD', 'Diagnostic imaging, CT, MRI, ultrasound, and X-ray', '1', '1101'),
    (7, 'Pharmacy', 'PHARM', 'Medication dispensing, formulary, and inventory control', '1', '1201'),
    (8, 'Billing', 'BILL', 'Revenue cycle, invoicing, insurance, and payments', '7', '7701')
) as d(i, name, code, description, floor, phone_extension)
on conflict do nothing;

insert into public.profiles (
  id,
  auth_user_id,
  hospital_id,
  full_name,
  email,
  phone,
  role,
  avatar_url,
  is_active,
  last_login_at
)
select
  ('12000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('11000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  full_name,
  lower(replace(full_name, ' ', '.')) || '@northbridge.example',
  '+1 212 555 ' || lpad((5000 + i)::text, 4, '0'),
  role::public.user_role,
  null,
  true,
  now() - (i || ' days')::interval
from (
  select
    row_number() over () as i,
    full_name,
    case
      when row_number() over () = 1 then 'hospital_admin'
      when row_number() over () between 2 and 9 then 'doctor'
      when row_number() over () between 10 and 19 then 'nurse'
      when row_number() over () in (20, 21) then 'receptionist'
      when row_number() over () = 22 then 'pharmacist'
      when row_number() over () = 23 then 'lab_technician'
      when row_number() over () in (24, 25) then 'billing_staff'
    end as role
  from unnest(array[
    'Aisha Rahman',
    'Daniel Chen',
    'Olivia Martinez',
    'Marcus Thompson',
    'Priya Nair',
    'Samuel Brooks',
    'Emily Carter',
    'Rafael Ortiz',
    'Nora Kim',
    'Grace Patel',
    'Jamal Wright',
    'Hannah Lee',
    'Elena Kovacs',
    'Bianca Russo',
    'Maya Stein',
    'Fatima Al-Hassan',
    'Tyler Evans',
    'Sofia Morales',
    'Noah Bennett',
    'Irene Walsh',
    'Omar Haddad',
    'Leo Brooks',
    'Chloe Morgan',
    'Victor Hayes',
    'Mei Lin'
  ]) as full_name
) staff_seed
on conflict do nothing;

insert into public.staff (
  id,
  profile_id,
  hospital_id,
  department_id,
  employee_code,
  job_title,
  employment_type,
  shift,
  status,
  hire_date
)
select
  ('13000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('12000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('10000000-0000-4000-8000-' || lpad(department_no::text, 12, '0'))::uuid,
  'NBMC-EMP-' || lpad(i::text, 4, '0'),
  job_title,
  employment_type,
  shift,
  status::public.staff_status,
  date '2018-01-01' + (i * 37)
from (
  select
    i,
    case
      when i = 1 then 8
      when i between 2 and 3 then 2
      when i = 4 then 3
      when i = 5 then 4
      when i = 6 then 5
      when i = 7 then 6
      when i between 8 and 9 then 1
      when i between 10 and 19 then ((i - 10) % 6) + 1
      when i in (20, 21) then 1
      when i = 22 then 7
      when i = 23 then 6
      else 8
    end as department_no,
    case
      when i = 1 then 'Hospital Administrator'
      when i between 2 and 9 then 'Attending Physician'
      when i between 10 and 19 then 'Registered Nurse'
      when i in (20, 21) then 'Patient Services Coordinator'
      when i = 22 then 'Clinical Pharmacist'
      when i = 23 then 'Senior Lab Technologist'
      else 'Billing Specialist'
    end as job_title,
    case when i in (1, 24, 25) then 'full_time' else 'full_time' end as employment_type,
    case when i % 3 = 0 then 'Night' when i % 3 = 1 then 'Day' else 'Evening' end as shift,
    case when i in (18, 25) then 'on_leave' else 'active' end as status
  from generate_series(1, 25) as i
) staff_seed
on conflict do nothing;

insert into public.wards (id, hospital_id, department_id, name, floor, description, is_active)
select
  ('16000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('10000000-0000-4000-8000-' || lpad(department_no::text, 12, '0'))::uuid,
  name,
  floor,
  description,
  true
from (
  values
    (1, 1, 'Emergency Observation', '2', 'Short-stay emergency observation and triage overflow'),
    (2, 2, 'Cardiac Care Unit', '5', 'Telemetry and post-procedure cardiac monitoring'),
    (3, 3, 'Neuro Stepdown', '6', 'Stroke recovery and neurological monitoring'),
    (4, 4, 'Orthopedic Recovery', '4', 'Post-operative orthopedic recovery beds'),
    (5, 5, 'Pediatric Ward', '3', 'Pediatric inpatient rooms and family care areas'),
    (6, 1, 'Intensive Care Unit', '2', 'High-acuity critical care beds')
) as w(i, department_no, name, floor, description)
on conflict do nothing;

insert into public.doctors (
  id,
  staff_id,
  specialization,
  license_number,
  consultation_fee,
  years_experience,
  availability_notes
)
select
  ('14000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('13000000-0000-4000-8000-' || lpad((i + 1)::text, 12, '0'))::uuid,
  specialization,
  'NY-MD-' || lpad((82000 + i)::text, 6, '0'),
  consultation_fee,
  years_experience,
  availability_notes
from (
  values
    (1, 'Interventional Cardiology', 425, 14, 'Clinic Monday/Wednesday, cath lab Friday'),
    (2, 'Cardiac Electrophysiology', 390, 11, 'Clinic Tuesday/Thursday'),
    (3, 'Vascular Neurology', 410, 16, 'Stroke call rotation and neuro clinic'),
    (4, 'Orthopedic Surgery', 375, 12, 'OR Monday/Thursday, clinic Tuesday'),
    (5, 'Pediatric Hospital Medicine', 290, 9, 'Pediatric inpatient service'),
    (6, 'Diagnostic Radiology', 250, 15, 'Imaging reads and procedures'),
    (7, 'Emergency Medicine', 325, 10, 'Emergency department attending'),
    (8, 'Trauma and Critical Care', 450, 18, 'ICU and emergency trauma coverage')
) as d(i, specialization, consultation_fee, years_experience, availability_notes)
on conflict do nothing;

insert into public.nurses (
  id,
  staff_id,
  nursing_license_number,
  assigned_ward_id,
  shift
)
select
  ('15000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('13000000-0000-4000-8000-' || lpad((i + 9)::text, 12, '0'))::uuid,
  'NY-RN-' || lpad((31000 + i)::text, 6, '0'),
  ('16000000-0000-4000-8000-' || lpad((((i - 1) % 6) + 1)::text, 12, '0'))::uuid,
  case when i % 3 = 0 then 'Night' when i % 3 = 1 then 'Day' else 'Evening' end
from generate_series(1, 10) as i
on conflict do nothing;

insert into public.patients (
  id,
  hospital_id,
  mrn,
  first_name,
  last_name,
  date_of_birth,
  gender,
  blood_group,
  phone,
  email,
  address_line1,
  address_line2,
  city,
  state,
  postal_code,
  country,
  allergies,
  chronic_conditions,
  notes
)
select
  ('20000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  'MRN-2026-' || lpad(i::text, 4, '0'),
  first_name,
  last_name,
  (date '1945-01-01' + (i * 431)::integer)::date,
  gender::public.gender_type,
  blood_group::public.blood_group,
  '+1 646 555 ' || lpad((1000 + i)::text, 4, '0'),
  lower(regexp_replace(first_name || '.' || last_name || i || '@example.com', '[^a-zA-Z0-9@._+-]', '', 'g')),
  (100 + i)::text || ' ' || street,
  apt,
  'New York',
  'NY',
  postal_code,
  'United States',
  allergies,
  chronic_conditions,
  notes
from (
  select
    row_number() over () as i,
    first_name,
    last_name,
    (array['female', 'male', 'female', 'male', 'other'])[(i - 1) % 5 + 1] as gender,
    (array['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB+'])[(i - 1) % 8 + 1] as blood_group,
    (array['Riverside Dr', 'Amsterdam Ave', 'Broadway', 'Lenox Ave', 'Columbus Ave'])[(i - 1) % 5 + 1] as street,
    case when i % 4 = 0 then 'Apt ' || ((i % 12) + 1)::text || chr(65 + (i % 4)) else null end as apt,
    (array['10025', '10026', '10027', '10029', '10031'])[(i - 1) % 5 + 1] as postal_code,
    (array['None', 'Penicillin', 'Latex', 'Shellfish', 'Sulfa drugs'])[(i - 1) % 5 + 1] as allergies,
    (array['Hypertension', 'Type 2 diabetes', 'Asthma', 'Migraine', 'Osteoarthritis', null])[(i - 1) % 6 + 1] as chronic_conditions,
    case when i % 7 = 0 then 'Requires interpreter support for family meetings.' else 'Registered through NorthBridge intake.' end as notes
  from (
    values
      (1, 'Maya', 'Bennett'), (2, 'Noah', 'Singh'), (3, 'Elena', 'Morales'), (4, 'James', 'O''Connor'), (5, 'Sophia', 'Kim'),
      (6, 'Liam', 'Patel'), (7, 'Ava', 'Garcia'), (8, 'Ethan', 'Nguyen'), (9, 'Isabella', 'Rivera'), (10, 'Lucas', 'Cohen'),
      (11, 'Mia', 'Johnson'), (12, 'Benjamin', 'Lee'), (13, 'Charlotte', 'Brown'), (14, 'Mason', 'Davis'), (15, 'Amelia', 'Wilson'),
      (16, 'Logan', 'Martinez'), (17, 'Harper', 'Anderson'), (18, 'Jacob', 'Thomas'), (19, 'Evelyn', 'Taylor'), (20, 'Michael', 'Moore'),
      (21, 'Abigail', 'Jackson'), (22, 'Daniel', 'White'), (23, 'Emily', 'Harris'), (24, 'Henry', 'Clark'), (25, 'Grace', 'Lewis'),
      (26, 'Sebastian', 'Young'), (27, 'Chloe', 'Walker'), (28, 'Matthew', 'Hall'), (29, 'Lily', 'Allen'), (30, 'Joseph', 'King'),
      (31, 'Zoey', 'Wright'), (32, 'David', 'Scott'), (33, 'Nora', 'Green'), (34, 'Samuel', 'Baker'), (35, 'Layla', 'Adams'),
      (36, 'Anthony', 'Nelson'), (37, 'Victoria', 'Carter'), (38, 'Christopher', 'Mitchell'), (39, 'Aria', 'Perez'), (40, 'Andrew', 'Roberts'),
      (41, 'Scarlett', 'Turner'), (42, 'Joshua', 'Phillips'), (43, 'Penelope', 'Campbell'), (44, 'Nathan', 'Parker'), (45, 'Riley', 'Evans'),
      (46, 'Ryan', 'Edwards'), (47, 'Stella', 'Collins'), (48, 'Caleb', 'Stewart'), (49, 'Lucy', 'Sanchez'), (50, 'Isaac', 'Morris')
  ) as names(i, first_name, last_name)
) patient_seed
on conflict do nothing;

insert into public.emergency_contacts (
  id,
  patient_id,
  full_name,
  relationship,
  phone,
  email,
  address,
  is_primary
)
select
  ('21000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('20000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  contact_name,
  relationship,
  '+1 917 555 ' || lpad((2000 + i)::text, 4, '0'),
  lower(replace(contact_name, ' ', '.') || '@example.com'),
  (200 + i)::text || ' West End Ave, New York, NY',
  i <= 15
from (
  select
    i,
    (array['Sofia Bennett', 'Aarav Singh', 'Camila Morales', 'Mary O''Connor', 'Daniel Kim', 'Neha Patel', 'Carlos Garcia', 'Minh Nguyen', 'Rosa Rivera', 'Sarah Cohen', 'Olivia Johnson', 'Hannah Lee', 'Eleanor Brown', 'Patricia Davis', 'Evan Wilson', 'Mateo Martinez', 'Julia Anderson', 'Rachel Thomas', 'George Taylor', 'Karen Moore'])[i] as contact_name,
    (array['Sister', 'Son', 'Mother', 'Spouse', 'Brother', 'Daughter', 'Father', 'Partner', 'Aunt', 'Friend'])[(i - 1) % 10 + 1] as relationship
  from generate_series(1, 20) as i
) contact_seed
on conflict do nothing;

insert into public.insurance_providers (id, hospital_id, name, phone, email, address, payer_code, is_active)
select
  ('22000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  name,
  '+1 800 555 ' || lpad((3000 + i)::text, 4, '0'),
  lower(replace(name, ' ', '') || '@claims.example'),
  (50 + i)::text || ' Insurance Plaza, New York, NY',
  code,
  true
from (
  values
    (1, 'Empire BlueCross BlueShield', 'EBCBS'),
    (2, 'Aetna Health New York', 'AETNY'),
    (3, 'UnitedHealthcare Choice', 'UHCC'),
    (4, 'Cigna Open Access', 'CIGNA'),
    (5, 'NorthBridge Health Plan', 'NBHP')
) as p(i, name, code)
on conflict do nothing;

insert into public.patient_insurance (
  id,
  patient_id,
  insurance_provider_id,
  policy_number,
  group_number,
  subscriber_name,
  relationship_to_patient,
  valid_from,
  valid_until,
  is_primary
)
select
  ('23000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('20000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('22000000-0000-4000-8000-' || lpad((((i - 1) % 5) + 1)::text, 12, '0'))::uuid,
  'POL-' || lpad((600000 + i * 17)::text, 8, '0'),
  'GRP-' || lpad((((i - 1) % 8) + 100)::text, 3, '0'),
  p.first_name || ' ' || p.last_name,
  'self',
  current_date - interval '14 months',
  current_date + interval '10 months',
  true
from generate_series(1, 30) as i
join public.patients p on p.id = ('20000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid
on conflict do nothing;

insert into public.rooms (id, hospital_id, ward_id, room_number, room_type, status, daily_rate)
select
  ('24000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('16000000-0000-4000-8000-' || lpad(ward_no::text, 12, '0'))::uuid,
  room_number,
  room_type::public.room_type,
  status::public.room_status,
  daily_rate
from (
  select
    i,
    case
      when i <= 6 then 6
      when i <= 12 then 1
      when i <= 19 then 2
      when i <= 26 then 3
      when i <= 33 then 4
      else 5
    end as ward_no,
    case
      when i <= 6 then 'ICU-' || (100 + i)::text
      when i <= 12 then 'ER-' || (200 + i - 6)::text
      when i <= 19 then 'CARD-' || (300 + i - 12)::text
      when i <= 26 then 'NEU-' || (400 + i - 19)::text
      when i <= 33 then 'ORT-' || (500 + i - 26)::text
      else 'GEN-' || (300 + i - 33)::text
    end as room_number,
    case
      when i <= 6 then 'icu'
      when i <= 12 then 'emergency'
      when i % 5 = 0 then 'private'
      when i % 3 = 0 then 'semi_private'
      else 'general'
    end as room_type,
    case
      when i <= 14 then 'occupied'
      when i in (15, 16, 17, 18) then 'reserved'
      when i in (19, 20, 21) then 'maintenance'
      else 'available'
    end as status,
    case
      when i <= 6 then 2100
      when i <= 12 then 950
      when i % 5 = 0 then 1350
      else 850
    end as daily_rate
  from generate_series(1, 40) as i
) room_seed
on conflict do nothing;

insert into public.beds (id, hospital_id, room_id, bed_number, status, current_patient_id)
select
  ('25000000-0000-4000-8000-' || lpad(bed_id::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('24000000-0000-4000-8000-' || lpad(room_id::text, 12, '0'))::uuid,
  chr(64 + bed_index),
  case
    when bed_id <= 20 then 'occupied'
    when bed_id between 21 and 30 then 'reserved'
    when bed_id between 31 and 40 then 'maintenance'
    else 'available'
  end::public.bed_status,
  case when bed_id <= 20 then ('20000000-0000-4000-8000-' || lpad(bed_id::text, 12, '0'))::uuid else null end
from (
  select
    row_number() over (order by room_id, bed_index) as bed_id,
    room_id,
    bed_index
  from (
    select
      r as room_id,
      b as bed_index
    from generate_series(1, 40) as r
    cross join lateral generate_series(1, case when r <= 10 then 3 else 2 end) as b
  ) beds
) bed_seed
on conflict do nothing;

insert into public.admissions (
  id,
  hospital_id,
  patient_id,
  admitting_doctor_id,
  department_id,
  admission_datetime,
  expected_discharge_datetime,
  discharge_datetime,
  reason,
  diagnosis_summary,
  status,
  created_by
)
select
  ('26000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('20000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('14000000-0000-4000-8000-' || lpad((((i - 1) % 8) + 1)::text, 12, '0'))::uuid,
  ('10000000-0000-4000-8000-' || lpad((((i - 1) % 5) + 1)::text, 12, '0'))::uuid,
  now() - (case when i <= 20 then (i % 8) + 1 else (i % 14) + 12 end || ' days')::interval,
  now() + (case when i <= 20 then ((i % 5) + 1) else 0 end || ' days')::interval,
  case when i > 20 then now() - ((i % 5) + 1 || ' days')::interval else null end,
  reason,
  diagnosis_summary,
  case when i <= 20 then 'admitted' else 'discharged' end::public.admission_status,
  '12000000-0000-4000-8000-000000000020'
from (
  select
    i,
    (array['Chest pain evaluation', 'Acute asthma exacerbation', 'Post-operative observation', 'Stroke monitoring', 'Pediatric dehydration', 'Fracture stabilization'])[(i - 1) % 6 + 1] as reason,
    (array['Rule out acute coronary syndrome', 'Improving with bronchodilator therapy', 'Stable post-procedure recovery', 'Neurological observation protocol', 'IV fluids and monitoring', 'Pain control and surgical consult'])[(i - 1) % 6 + 1] as diagnosis_summary
  from generate_series(1, 30) as i
) admission_seed
on conflict do nothing;

insert into public.bed_allocations (
  id,
  hospital_id,
  admission_id,
  patient_id,
  bed_id,
  allocated_at,
  released_at,
  allocated_by,
  release_reason
)
select
  ('27000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('26000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('20000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('25000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  now() - ((i % 10) + 1 || ' days')::interval,
  case when i > 20 then now() - ((i % 4) + 1 || ' days')::interval else null end,
  '12000000-0000-4000-8000-000000000020',
  case when i > 20 then 'Discharged home with follow-up appointment' else null end
from generate_series(1, 25) as i
on conflict do nothing;

insert into public.appointments (
  id,
  hospital_id,
  patient_id,
  doctor_id,
  department_id,
  scheduled_start,
  scheduled_end,
  reason,
  status,
  notes,
  created_by,
  cancelled_at,
  cancellation_reason
)
select
  ('28000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('20000000-0000-4000-8000-' || lpad((((i - 1) % 50) + 1)::text, 12, '0'))::uuid,
  ('14000000-0000-4000-8000-' || lpad((((i - 1) % 8) + 1)::text, 12, '0'))::uuid,
  ('10000000-0000-4000-8000-' || lpad((((i - 1) % 6) + 1)::text, 12, '0'))::uuid,
  date_trunc('month', current_date)::timestamptz
    + (((i - 1) % 28) || ' days')::interval
    + ((8 + (i % 9)) || ' hours')::interval
    + (case when i % 2 = 0 then interval '30 minutes' else interval '0 minutes' end),
  date_trunc('month', current_date)::timestamptz
    + (((i - 1) % 28) || ' days')::interval
    + ((8 + (i % 9)) || ' hours')::interval
    + (case when i % 2 = 0 then interval '60 minutes' else interval '30 minutes' end),
  reason,
  status::public.appointment_status,
  'Scheduled through NorthBridge central scheduling.',
  '12000000-0000-4000-8000-000000000020',
  case when status = 'cancelled' then date_trunc('month', current_date)::timestamptz + (((i - 2) % 28) || ' days')::interval else null end,
  case when status = 'cancelled' then 'Patient requested reschedule.' else null end
from (
  select
    i,
    (array['Annual wellness visit', 'Cardiology follow-up', 'Neurology consult', 'Orthopedic evaluation', 'Pediatric fever visit', 'Imaging review', 'Emergency follow-up'])[(i - 1) % 7 + 1] as reason,
    (array['scheduled', 'checked_in', 'completed', 'scheduled', 'completed', 'cancelled', 'no_show'])[(i - 1) % 7 + 1] as status
  from generate_series(1, 60) as i
) appointment_seed
on conflict do nothing;

insert into public.clinical_encounters (
  id,
  hospital_id,
  patient_id,
  admission_id,
  appointment_id,
  doctor_id,
  nurse_id,
  encounter_type,
  chief_complaint,
  notes,
  status,
  started_at,
  ended_at
)
select
  ('29000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('20000000-0000-4000-8000-' || lpad((((i - 1) % 50) + 1)::text, 12, '0'))::uuid,
  case when i <= 30 then ('26000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid else null end,
  ('28000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('14000000-0000-4000-8000-' || lpad((((i - 1) % 8) + 1)::text, 12, '0'))::uuid,
  ('15000000-0000-4000-8000-' || lpad((((i - 1) % 10) + 1)::text, 12, '0'))::uuid,
  (array['outpatient', 'inpatient_round', 'emergency', 'consult'])[(i - 1) % 4 + 1],
  (array['Chest discomfort', 'Shortness of breath', 'Headache and dizziness', 'Knee pain', 'Fever and cough', 'Medication review'])[(i - 1) % 6 + 1],
  'SOAP note documented with assessment and follow-up plan.',
  case when i % 6 = 0 then 'in_progress' else 'completed' end::public.encounter_status,
  now() - (i || ' hours')::interval,
  case when i % 6 = 0 then null else now() - (i || ' hours')::interval + interval '35 minutes' end
from generate_series(1, 35) as i
on conflict do nothing;

insert into public.vitals (
  id,
  hospital_id,
  patient_id,
  encounter_id,
  recorded_by,
  temperature_c,
  blood_pressure_systolic,
  blood_pressure_diastolic,
  pulse,
  respiratory_rate,
  oxygen_saturation,
  weight_kg,
  height_cm,
  pain_score,
  recorded_at
)
select
  ('2a000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('20000000-0000-4000-8000-' || lpad((((i - 1) % 35) + 1)::text, 12, '0'))::uuid,
  ('29000000-0000-4000-8000-' || lpad((((i - 1) % 35) + 1)::text, 12, '0'))::uuid,
  ('12000000-0000-4000-8000-' || lpad((10 + ((i - 1) % 10))::text, 12, '0'))::uuid,
  36.4 + ((i % 8)::numeric / 10),
  112 + (i % 35),
  68 + (i % 18),
  62 + (i % 38),
  14 + (i % 8),
  94 + (i % 6),
  54 + (i % 45),
  150 + (i % 45),
  i % 10,
  now() - (i || ' hours')::interval
from generate_series(1, 50) as i
on conflict do nothing;

insert into public.diagnoses (
  id,
  hospital_id,
  patient_id,
  encounter_id,
  doctor_id,
  diagnosis_code,
  diagnosis_name,
  description,
  is_primary
)
select
  ('2b000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('20000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('29000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('14000000-0000-4000-8000-' || lpad((((i - 1) % 8) + 1)::text, 12, '0'))::uuid,
  code,
  name,
  'Diagnosis recorded during NorthBridge encounter.',
  i % 3 <> 0
from (
  select
    i,
    (array['I10', 'E11.9', 'J45.901', 'R07.9', 'G43.909', 'M17.11', 'S52.501A', 'J18.9', 'I63.9', 'K21.9'])[(i - 1) % 10 + 1] as code,
    (array['Essential hypertension', 'Type 2 diabetes mellitus', 'Asthma exacerbation', 'Chest pain', 'Migraine', 'Osteoarthritis of knee', 'Distal radius fracture', 'Pneumonia', 'Cerebral infarction', 'GERD'])[(i - 1) % 10 + 1] as name
  from generate_series(1, 35) as i
) diagnosis_seed
on conflict do nothing;

insert into public.treatment_plans (
  id,
  hospital_id,
  patient_id,
  encounter_id,
  doctor_id,
  plan_title,
  plan_details,
  start_date,
  end_date,
  status
)
select
  ('2c000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('20000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('29000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('14000000-0000-4000-8000-' || lpad((((i - 1) % 8) + 1)::text, 12, '0'))::uuid,
  (array['Blood pressure optimization', 'Diabetes follow-up', 'Respiratory therapy plan', 'Post-op mobility plan', 'Pain management plan'])[(i - 1) % 5 + 1],
  'Plan includes medication review, monitoring goals, patient education, and follow-up timeline.',
  current_date - (i % 5),
  current_date + ((i % 21) + 7),
  case when i % 8 = 0 then 'completed' else 'active' end
from generate_series(1, 25) as i
on conflict do nothing;

insert into public.medications (
  id,
  hospital_id,
  name,
  generic_name,
  brand_name,
  strength,
  dosage_form,
  manufacturer,
  description,
  is_active
)
select
  ('2d000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  name,
  generic_name,
  brand_name,
  strength,
  dosage_form,
  manufacturer,
  'Medication stocked by NorthBridge Medical Center.',
  true
from (
  select
    row_number() over () as i,
    *
  from (
    values
      ('Amoxicillin','Amoxicillin',null,'500 mg','Capsule','Sandoz'),
      ('Metformin','Metformin hydrochloride','Glucophage','500 mg','Tablet','Bristol Myers Squibb'),
      ('Lisinopril','Lisinopril','Prinivil','10 mg','Tablet','Lupin'),
      ('Atorvastatin','Atorvastatin calcium','Lipitor','20 mg','Tablet','Pfizer'),
      ('Ibuprofen','Ibuprofen','Advil','200 mg','Tablet','Haleon'),
      ('Albuterol','Albuterol sulfate','Ventolin','90 mcg','Inhaler','GSK'),
      ('Omeprazole','Omeprazole','Prilosec','20 mg','Capsule','AstraZeneca'),
      ('Amlodipine','Amlodipine besylate','Norvasc','5 mg','Tablet','Pfizer'),
      ('Azithromycin','Azithromycin','Zithromax','250 mg','Tablet','Pfizer'),
      ('Prednisone','Prednisone',null,'20 mg','Tablet','Hikma'),
      ('Furosemide','Furosemide','Lasix','40 mg','Tablet','Sanofi'),
      ('Gabapentin','Gabapentin','Neurontin','300 mg','Capsule','Pfizer'),
      ('Levothyroxine','Levothyroxine sodium','Synthroid','50 mcg','Tablet','AbbVie'),
      ('Hydrochlorothiazide','Hydrochlorothiazide',null,'25 mg','Tablet','Teva'),
      ('Losartan','Losartan potassium','Cozaar','50 mg','Tablet','Merck'),
      ('Sertraline','Sertraline','Zoloft','50 mg','Tablet','Pfizer'),
      ('Cetirizine','Cetirizine hydrochloride','Zyrtec','10 mg','Tablet','Johnson & Johnson'),
      ('Clopidogrel','Clopidogrel','Plavix','75 mg','Tablet','Sanofi'),
      ('Warfarin','Warfarin sodium','Coumadin','5 mg','Tablet','Bristol Myers Squibb'),
      ('Insulin Glargine','Insulin glargine','Lantus','100 units/mL','Injection','Sanofi'),
      ('Insulin Lispro','Insulin lispro','Humalog','100 units/mL','Injection','Eli Lilly'),
      ('Morphine','Morphine sulfate',null,'2 mg/mL','Injection','Hospira'),
      ('Ondansetron','Ondansetron','Zofran','4 mg','Tablet','Novartis'),
      ('Acetaminophen','Acetaminophen','Tylenol','500 mg','Tablet','Johnson & Johnson'),
      ('Ceftriaxone','Ceftriaxone sodium','Rocephin','1 g','Injection','Roche'),
      ('Vancomycin','Vancomycin hydrochloride',null,'1 g','Injection','Fresenius Kabi'),
      ('Doxycycline','Doxycycline hyclate',null,'100 mg','Capsule','Teva'),
      ('Pantoprazole','Pantoprazole sodium','Protonix','40 mg','Tablet','Pfizer'),
      ('Fluticasone','Fluticasone propionate','Flovent','110 mcg','Inhaler','GSK'),
      ('Montelukast','Montelukast sodium','Singulair','10 mg','Tablet','Organon'),
      ('Carvedilol','Carvedilol','Coreg','12.5 mg','Tablet','GSK'),
      ('Metoprolol','Metoprolol tartrate','Lopressor','25 mg','Tablet','Novartis'),
      ('Aspirin','Aspirin','Bayer','81 mg','Tablet','Bayer'),
      ('Nitroglycerin','Nitroglycerin','Nitrostat','0.4 mg','Sublingual tablet','Pfizer'),
      ('Heparin','Heparin sodium',null,'5000 units/mL','Injection','Fresenius Kabi'),
      ('Enoxaparin','Enoxaparin sodium','Lovenox','40 mg/0.4 mL','Injection','Sanofi'),
      ('Simvastatin','Simvastatin','Zocor','20 mg','Tablet','Merck'),
      ('Rosuvastatin','Rosuvastatin calcium','Crestor','10 mg','Tablet','AstraZeneca'),
      ('Tramadol','Tramadol hydrochloride','Ultram','50 mg','Tablet','Janssen'),
      ('Oxycodone','Oxycodone hydrochloride','Roxicodone','5 mg','Tablet','Mallinckrodt'),
      ('Cyclobenzaprine','Cyclobenzaprine hydrochloride','Flexeril','10 mg','Tablet','Teva'),
      ('Naproxen','Naproxen','Aleve','500 mg','Tablet','Bayer'),
      ('Ketorolac','Ketorolac tromethamine','Toradol','30 mg/mL','Injection','Hospira'),
      ('Lorazepam','Lorazepam','Ativan','1 mg','Tablet','Bausch Health'),
      ('Diazepam','Diazepam','Valium','5 mg','Tablet','Roche'),
      ('Haloperidol','Haloperidol','Haldol','5 mg/mL','Injection','Fresenius Kabi'),
      ('Risperidone','Risperidone','Risperdal','1 mg','Tablet','Janssen'),
      ('Quetiapine','Quetiapine fumarate','Seroquel','25 mg','Tablet','AstraZeneca'),
      ('Budesonide','Budesonide','Pulmicort','0.5 mg/2 mL','Nebulizer suspension','AstraZeneca'),
      ('Ipratropium','Ipratropium bromide','Atrovent','0.02%','Nebulizer solution','Boehringer Ingelheim'),
      ('Ciprofloxacin','Ciprofloxacin','Cipro','500 mg','Tablet','Bayer'),
      ('Levofloxacin','Levofloxacin','Levaquin','500 mg','Tablet','Janssen'),
      ('Fluconazole','Fluconazole','Diflucan','150 mg','Tablet','Pfizer'),
      ('Nystatin','Nystatin',null,'100000 units/mL','Suspension','Teva'),
      ('Ferrous Sulfate','Ferrous sulfate',null,'325 mg','Tablet','Nature Made'),
      ('Vitamin D3','Cholecalciferol',null,'2000 IU','Tablet','Nature Made'),
      ('Potassium Chloride','Potassium chloride','Klor-Con','20 mEq','Tablet','Upsher-Smith'),
      ('Magnesium Oxide','Magnesium oxide',null,'400 mg','Tablet','Major'),
      ('Docusate','Docusate sodium','Colace','100 mg','Capsule','Purdue'),
      ('Polyethylene Glycol','Polyethylene glycol','MiraLAX','17 g','Powder','Bayer')
  ) as m(name, generic_name, brand_name, strength, dosage_form, manufacturer)
) medication_seed
on conflict do nothing;

insert into public.suppliers (id, hospital_id, name, contact_person, phone, email, address, is_active)
select
  ('2e000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  name,
  contact_person,
  '+1 800 555 ' || lpad((4000 + i)::text, 4, '0'),
  lower(replace(name, ' ', '') || '@supply.example'),
  (700 + i)::text || ' Distribution Way, Secaucus, NJ',
  true
from (
  values
    (1, 'NorthStar Medical Supply', 'Irene Walsh'),
    (2, 'Hudson Valley Pharma', 'Renee Fox'),
    (3, 'Atlantic Clinical Distributors', 'Gordon Miles'),
    (4, 'MetroCare Wholesale', 'Patricia Lin'),
    (5, 'TriState Surgical Supply', 'Derek Stone'),
    (6, 'Empire Diagnostics Supply', 'Amina Qureshi'),
    (7, 'Liberty Medication Partners', 'Grace Nolan'),
    (8, 'Harbor Health Logistics', 'Vincent Rao')
) as s(i, name, contact_person)
on conflict do nothing;

insert into public.medicine_inventory (
  id,
  hospital_id,
  medication_id,
  supplier_id,
  sku,
  batch_no,
  expiry_date,
  quantity_on_hand,
  reorder_level,
  unit_cost,
  selling_price,
  storage_location
)
select
  ('2f000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('2d000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('2e000000-0000-4000-8000-' || lpad((((i - 1) % 8) + 1)::text, 12, '0'))::uuid,
  'NB-MED-' || lpad(i::text, 4, '0'),
  'NB-' || to_char(current_date, 'YY') || '-' || lpad((700 + i)::text, 4, '0'),
  case
    when i between 1 and 8 then current_date + interval '18 days'
    when i between 9 and 16 then current_date + interval '45 days'
    else current_date + (((i % 18) + 6) || ' months')::interval
  end,
  case
    when i between 1 and 10 then 5 + i
    when i between 11 and 16 then 18 + i
    else 90 + (i * 7 % 240)
  end,
  case when i <= 16 then 40 else 50 + (i % 40) end,
  round((0.35 + (i::numeric * 0.87)), 2),
  round((2.50 + (i::numeric * 1.45)), 2),
  'PH-' || chr(65 + (i % 6)) || '-' || lpad(((i % 24) + 1)::text, 2, '0')
from generate_series(1, 60) as i
on conflict do nothing;

insert into public.stock_movements (
  id,
  hospital_id,
  inventory_id,
  movement_type,
  quantity,
  reason,
  reference_number,
  performed_by,
  movement_date
)
select
  ('30000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('2f000000-0000-4000-8000-' || lpad((((i - 1) % 60) + 1)::text, 12, '0'))::uuid,
  movement_type::public.stock_movement_type,
  quantity,
  reason,
  'SM-' || to_char(current_date, 'YYYY') || '-' || lpad(i::text, 5, '0'),
  '12000000-0000-4000-8000-000000000022',
  now() - (i || ' hours')::interval
from (
  select
    i,
    (array['purchase', 'dispense', 'adjustment', 'return', 'transfer_in', 'transfer_out', 'expired', 'damaged'])[(i - 1) % 8 + 1] as movement_type,
    case when (i - 1) % 8 in (1, 5, 6, 7) then -1 * (5 + (i % 18)) else 20 + (i % 80) end as quantity,
    (array['Supplier receipt', 'Prescription dispense', 'Cycle count adjustment', 'Patient return', 'Transfer from satellite pharmacy', 'Transfer to emergency cart', 'Expired stock removal', 'Damaged package removal'])[(i - 1) % 8 + 1] as reason
  from generate_series(1, 100) as i
) movement_seed
on conflict do nothing;

insert into public.prescriptions (
  id,
  hospital_id,
  patient_id,
  doctor_id,
  encounter_id,
  status,
  prescribed_at,
  notes
)
select
  ('31000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('20000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('14000000-0000-4000-8000-' || lpad((((i - 1) % 8) + 1)::text, 12, '0'))::uuid,
  ('29000000-0000-4000-8000-' || lpad((((i - 1) % 35) + 1)::text, 12, '0'))::uuid,
  case when i % 7 = 0 then 'completed' else 'active' end::public.prescription_status,
  now() - (i || ' days')::interval,
  'Medication instructions reviewed with patient.'
from generate_series(1, 25) as i
on conflict do nothing;

insert into public.prescription_items (
  id,
  prescription_id,
  medication_id,
  dosage,
  frequency,
  duration,
  route,
  instructions,
  quantity
)
select
  ('32000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('31000000-0000-4000-8000-' || lpad((((i - 1) / 3) + 1)::text, 12, '0'))::uuid,
  ('2d000000-0000-4000-8000-' || lpad((((i - 1) % 60) + 1)::text, 12, '0'))::uuid,
  (array['1 tablet', '2 tablets', '1 capsule', '2 puffs', '5 mL'])[(i - 1) % 5 + 1],
  (array['daily', 'twice daily', 'every 8 hours', 'as needed', 'nightly'])[(i - 1) % 5 + 1],
  (array['5 days', '7 days', '14 days', '30 days'])[(i - 1) % 4 + 1],
  (array['oral', 'inhaled', 'subcutaneous', 'intravenous'])[(i - 1) % 4 + 1],
  'Take as directed and report adverse symptoms.',
  10 + (i % 30)
from generate_series(1, 75) as i
on conflict do nothing;

insert into public.lab_tests (
  id,
  hospital_id,
  test_name,
  test_code,
  category,
  description,
  sample_type,
  price,
  reference_range,
  is_active
)
select
  ('33000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  test_name,
  test_code,
  category,
  'NorthBridge laboratory test catalog item.',
  sample_type,
  price,
  reference_range,
  true
from (
  select
    row_number() over () as i,
    *
  from (
    values
      ('CBC with Differential','CBC','Hematology','Whole blood',45,'See component ranges'),
      ('Basic Metabolic Panel','BMP','Chemistry','Serum',55,'See component ranges'),
      ('Comprehensive Metabolic Panel','CMP','Chemistry','Serum',75,'See component ranges'),
      ('Lipid Panel','LIPID','Chemistry','Serum',70,'See component ranges'),
      ('Hemoglobin A1c','A1C','Chemistry','Whole blood',60,'4.0-5.6%'),
      ('Troponin I','TROP-I','Cardiac','Serum',95,'< 0.04 ng/mL'),
      ('BNP','BNP','Cardiac','Plasma',110,'< 100 pg/mL'),
      ('PT/INR','PTINR','Coagulation','Plasma',45,'INR 0.8-1.2'),
      ('aPTT','APTT','Coagulation','Plasma',45,'25-35 sec'),
      ('D-Dimer','DDIMER','Coagulation','Plasma',85,'< 0.50 mcg/mL FEU'),
      ('TSH','TSH','Endocrine','Serum',65,'0.4-4.0 mIU/L'),
      ('Free T4','FT4','Endocrine','Serum',60,'0.8-1.8 ng/dL'),
      ('Urinalysis','UA','Urine','Urine',35,'Negative/normal'),
      ('Urine Culture','UCX','Microbiology','Urine',80,'No growth'),
      ('Blood Culture','BCX','Microbiology','Blood',120,'No growth'),
      ('COVID-19 PCR','COVIDPCR','Molecular','Nasopharyngeal swab',120,'Not detected'),
      ('Influenza A/B PCR','FLUPCR','Molecular','Nasopharyngeal swab',95,'Not detected'),
      ('Respiratory Viral Panel','RVP','Molecular','Nasopharyngeal swab',210,'Not detected'),
      ('ESR','ESR','Hematology','Whole blood',40,'0-20 mm/hr'),
      ('CRP','CRP','Chemistry','Serum',50,'< 10 mg/L'),
      ('Ferritin','FERR','Chemistry','Serum',75,'24-336 ng/mL'),
      ('Vitamin B12','B12','Chemistry','Serum',85,'200-900 pg/mL'),
      ('Vitamin D','VITD','Chemistry','Serum',90,'30-100 ng/mL'),
      ('Magnesium','MG','Chemistry','Serum',35,'1.7-2.2 mg/dL'),
      ('Phosphorus','PHOS','Chemistry','Serum',35,'2.5-4.5 mg/dL'),
      ('Liver Function Panel','LFT','Chemistry','Serum',65,'See component ranges'),
      ('Pregnancy Test','HCG','Chemistry','Serum',45,'Negative'),
      ('Type and Screen','TNS','Blood Bank','Whole blood',110,'ABO/Rh antibody screen'),
      ('Lactate','LACT','Chemistry','Plasma',55,'0.5-2.2 mmol/L'),
      ('Procalcitonin','PCT','Chemistry','Serum',105,'< 0.1 ng/mL')
  ) as t(test_name, test_code, category, sample_type, price, reference_range)
) lab_test_seed
on conflict do nothing;

insert into public.lab_orders (
  id,
  hospital_id,
  patient_id,
  doctor_id,
  encounter_id,
  status,
  priority,
  ordered_at,
  completed_at,
  notes
)
select
  ('34000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('20000000-0000-4000-8000-' || lpad((((i - 1) % 50) + 1)::text, 12, '0'))::uuid,
  ('14000000-0000-4000-8000-' || lpad((((i - 1) % 8) + 1)::text, 12, '0'))::uuid,
  case when i <= 35 then ('29000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid else null end,
  status::public.lab_order_status,
  priority,
  now() - (i || ' hours')::interval,
  case when status = 'completed' then now() - ((i - 1) || ' hours')::interval else null end,
  'Lab order generated from clinical workflow.'
from (
  select
    i,
    (array['ordered', 'sample_collected', 'processing', 'completed', 'completed', 'ordered'])[(i - 1) % 6 + 1] as status,
    (array['routine', 'urgent', 'stat'])[(i - 1) % 3 + 1] as priority
  from generate_series(1, 40) as i
) lab_order_seed
on conflict do nothing;

insert into public.lab_order_items (
  id,
  lab_order_id,
  lab_test_id,
  result_value,
  result_unit,
  reference_range,
  result_status,
  technician_id,
  result_notes,
  resulted_at
)
select
  ('35000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('34000000-0000-4000-8000-' || lpad((((i - 1) % 40) + 1)::text, 12, '0'))::uuid,
  ('33000000-0000-4000-8000-' || lpad((((i - 1) % 30) + 1)::text, 12, '0'))::uuid,
  case when i % 4 = 0 then null else (round((3.5 + (i::numeric % 12)), 1))::text end,
  case when i % 4 = 0 then null else (array['mg/dL', 'mmol/L', '10^3/uL', 'ng/mL'])[(i - 1) % 4 + 1] end,
  'See laboratory reference range',
  (array['pending', 'normal', 'abnormal', 'critical', 'normal'])[(i - 1) % 5 + 1]::public.lab_result_status,
  '13000000-0000-4000-8000-000000000023',
  case when i % 5 in (2, 3, 4) then 'Result reviewed by laboratory technician.' else null end,
  case when i % 5 in (2, 3, 4) then now() - (i || ' minutes')::interval else null end
from generate_series(1, 90) as i
on conflict do nothing;

insert into public.invoices (
  id,
  hospital_id,
  patient_id,
  admission_id,
  appointment_id,
  invoice_number,
  subtotal,
  tax_amount,
  discount_amount,
  total_amount,
  status,
  issued_at,
  due_at,
  created_by
)
select
  ('36000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('20000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  case when i <= 30 then ('26000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid else null end,
  ('28000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  'INV-2026-' || lpad(i::text, 4, '0'),
  subtotal,
  tax_amount,
  discount_amount,
  subtotal + tax_amount - discount_amount,
  status::public.invoice_status,
  case when status = 'draft' then null else now() - (i || ' days')::interval end,
  case when status = 'draft' then null else now() + ((30 - (i % 20)) || ' days')::interval end,
  '12000000-0000-4000-8000-000000000024'
from (
  select
    i,
    (350 + i * 175)::numeric(12,2) as subtotal,
    case when i % 4 = 0 then 0 else (i * 3)::numeric(12,2) end as tax_amount,
    case when i % 5 = 0 then 75 else 0 end::numeric(12,2) as discount_amount,
    (array['draft', 'issued', 'paid', 'partially_paid', 'issued', 'paid'])[(i - 1) % 6 + 1] as status
  from generate_series(1, 30) as i
) invoice_seed
on conflict do nothing;

insert into public.invoice_items (
  id,
  invoice_id,
  item_type,
  description,
  quantity,
  unit_price,
  total_price
)
select
  ('37000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  ('36000000-0000-4000-8000-' || lpad((((i - 1) % 30) + 1)::text, 12, '0'))::uuid,
  (array['consultation', 'room', 'lab', 'medication', 'procedure'])[(i - 1) % 5 + 1],
  (array['Specialist consultation', 'Room and nursing care', 'Laboratory services', 'Medication administration', 'Procedure package'])[(i - 1) % 5 + 1],
  case when i % 6 = 0 then 2 else 1 end,
  (85 + (i * 23 % 900))::numeric(12,2),
  (case when i % 6 = 0 then 2 else 1 end * (85 + (i * 23 % 900)))::numeric(12,2)
from generate_series(1, 50) as i
on conflict do nothing;

insert into public.payments (
  id,
  hospital_id,
  invoice_id,
  amount,
  payment_method,
  payment_status,
  transaction_reference,
  paid_at,
  received_by
)
select
  ('38000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('36000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  (150 + i * 95)::numeric(12,2),
  (array['card', 'cash', 'insurance', 'bank_transfer', 'online'])[(i - 1) % 5 + 1]::public.payment_method,
  case when i % 10 = 0 then 'pending' else 'completed' end::public.payment_status,
  'PAY-' || to_char(current_date, 'YYYY') || '-' || lpad(i::text, 5, '0'),
  case when i % 10 = 0 then null else now() - (i || ' days')::interval end,
  '12000000-0000-4000-8000-000000000024'
from generate_series(1, 20) as i
on conflict do nothing;

insert into public.notifications (
  id,
  hospital_id,
  profile_id,
  title,
  message,
  notification_type,
  is_read
)
select
  ('39000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('12000000-0000-4000-8000-' || lpad((((i - 1) % 25) + 1)::text, 12, '0'))::uuid,
  (array['New admission assigned', 'Lab result ready', 'Low stock alert', 'Appointment reminder', 'Invoice payment received'])[(i - 1) % 5 + 1],
  'NorthBridge HMS notification generated from realistic seed data.',
  (array['clinical', 'lab', 'inventory', 'appointment', 'billing'])[(i - 1) % 5 + 1],
  i % 3 = 0
from generate_series(1, 40) as i
on conflict do nothing;

insert into public.audit_logs (
  id,
  hospital_id,
  actor_profile_id,
  action,
  entity_type,
  entity_id,
  old_values,
  new_values,
  ip_address,
  user_agent,
  created_at
)
select
  ('3a000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  ('12000000-0000-4000-8000-' || lpad((((i - 1) % 25) + 1)::text, 12, '0'))::uuid,
  action,
  entity_type,
  entity_id,
  case when i % 4 = 0 then jsonb_build_object('status', 'previous') else null end,
  jsonb_build_object('status', 'current', 'seeded', true),
  ('10.20.' || ((i % 20) + 1)::text || '.' || ((i % 200) + 10)::text)::inet,
  'Mozilla/5.0 NorthBridgeSeed/1.0',
  now() - (i || ' minutes')::interval
from (
  select
    i,
    (array['patient.created', 'appointment.updated', 'admission.created', 'invoice.issued', 'stock.adjusted', 'lab.resulted', 'payment.received', 'profile.updated'])[(i - 1) % 8 + 1] as action,
    (array['patient', 'appointment', 'admission', 'invoice', 'medicine_inventory', 'lab_order', 'payment', 'profile'])[(i - 1) % 8 + 1] as entity_type,
    case (i - 1) % 8
      when 0 then ('20000000-0000-4000-8000-' || lpad((((i - 1) % 50) + 1)::text, 12, '0'))::uuid
      when 1 then ('28000000-0000-4000-8000-' || lpad((((i - 1) % 60) + 1)::text, 12, '0'))::uuid
      when 2 then ('26000000-0000-4000-8000-' || lpad((((i - 1) % 30) + 1)::text, 12, '0'))::uuid
      when 3 then ('36000000-0000-4000-8000-' || lpad((((i - 1) % 30) + 1)::text, 12, '0'))::uuid
      when 4 then ('2f000000-0000-4000-8000-' || lpad((((i - 1) % 60) + 1)::text, 12, '0'))::uuid
      when 5 then ('34000000-0000-4000-8000-' || lpad((((i - 1) % 40) + 1)::text, 12, '0'))::uuid
      when 6 then ('38000000-0000-4000-8000-' || lpad((((i - 1) % 20) + 1)::text, 12, '0'))::uuid
      else ('12000000-0000-4000-8000-' || lpad((((i - 1) % 25) + 1)::text, 12, '0'))::uuid
    end as entity_id
  from generate_series(1, 80) as i
) audit_seed
on conflict do nothing;
