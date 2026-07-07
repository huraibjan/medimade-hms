-- Medimade HMS Row Level Security policies.
-- Apply after supabase/migrations/0001_medimade_hms_schema.sql.

create or replace function public.get_current_profile()
returns public.profiles
language sql
security definer
set search_path = public
stable
as $$
  select p.*
  from public.profiles p
  where p.auth_user_id = auth.uid()
    and p.is_active = true
  limit 1;
$$;

comment on function public.get_current_profile() is
  'Returns the active Medimade profile mapped to auth.uid(). Used by RLS policies.';

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select p.role
  from public.profiles p
  where p.auth_user_id = auth.uid()
    and p.is_active = true
  limit 1;
$$;

comment on function public.current_user_role() is
  'Returns the current authenticated user role from profiles.';

create or replace function public.current_hospital_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select p.hospital_id
  from public.profiles p
  where p.auth_user_id = auth.uid()
    and p.is_active = true
  limit 1;
$$;

comment on function public.current_hospital_id() is
  'Returns the hospital_id assigned to the current profile.';

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() = 'super_admin', false);
$$;

comment on function public.is_super_admin() is
  'True when the current authenticated user is a super_admin.';

create or replace function public.has_hospital_access(hospital_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    public.is_super_admin()
    or (
      hospital_uuid is not null
      and public.current_hospital_id() = hospital_uuid
    ),
    false
  );
$$;

comment on function public.has_hospital_access(uuid) is
  'True for super_admin or users whose profiles.hospital_id matches the requested hospital.';

create or replace function public.current_profile_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = auth.uid()
    and p.is_active = true
  limit 1;
$$;

create or replace function public.has_any_role(variadic roles public.user_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() = any(roles), false);
$$;

create or replace function public.is_hospital_admin_for(hospital_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    public.is_super_admin()
    or (
      public.current_user_role() = 'hospital_admin'
      and public.current_hospital_id() = hospital_uuid
    ),
    false
  );
$$;

create or replace function public.current_doctor_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select d.id
  from public.doctors d
  join public.staff s on s.id = d.staff_id
  where s.profile_id = public.current_profile_id()
    and s.status = 'active'
    and s.deleted_at is null
  limit 1;
$$;

create or replace function public.current_nurse_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select n.id
  from public.nurses n
  join public.staff s on s.id = n.staff_id
  where s.profile_id = public.current_profile_id()
    and s.status = 'active'
    and s.deleted_at is null
  limit 1;
$$;

create or replace function public.current_nurse_ward_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select n.assigned_ward_id
  from public.nurses n
  join public.staff s on s.id = n.staff_id
  where s.profile_id = public.current_profile_id()
    and s.status = 'active'
    and s.deleted_at is null
  limit 1;
$$;

create or replace function public.doctor_can_access_patient(patient_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    exists (
      select 1
      from public.appointments a
      where a.patient_id = patient_uuid
        and a.doctor_id = public.current_doctor_id()
    )
    or exists (
      select 1
      from public.admissions ad
      where ad.patient_id = patient_uuid
        and ad.admitting_doctor_id = public.current_doctor_id()
    )
    or exists (
      select 1
      from public.clinical_encounters ce
      where ce.patient_id = patient_uuid
        and ce.doctor_id = public.current_doctor_id()
    )
    or exists (
      select 1
      from public.prescriptions pr
      where pr.patient_id = patient_uuid
        and pr.doctor_id = public.current_doctor_id()
    )
    or exists (
      select 1
      from public.lab_orders lo
      where lo.patient_id = patient_uuid
        and lo.doctor_id = public.current_doctor_id()
    ),
    false
  );
$$;

create or replace function public.nurse_can_access_patient(patient_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    exists (
      select 1
      from public.admissions ad
      where ad.patient_id = patient_uuid
        and ad.status in ('admitted', 'transferred')
    )
    or exists (
      select 1
      from public.bed_allocations ba
      join public.beds b on b.id = ba.bed_id
      join public.rooms r on r.id = b.room_id
      where ba.patient_id = patient_uuid
        and ba.released_at is null
        and r.ward_id = public.current_nurse_ward_id()
    ),
    false
  );
$$;

create or replace function public.can_access_patient(patient_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    exists (
      select 1
      from public.patients p
      where p.id = patient_uuid
        and public.has_hospital_access(p.hospital_id)
        and (
          public.has_any_role('super_admin', 'hospital_admin', 'receptionist')
          or public.doctor_can_access_patient(patient_uuid)
          or (public.current_user_role() = 'nurse' and public.nurse_can_access_patient(patient_uuid))
          or (
            public.current_user_role() = 'pharmacist'
            and exists (select 1 from public.prescriptions pr where pr.patient_id = patient_uuid)
          )
          or (
            public.current_user_role() = 'lab_technician'
            and exists (select 1 from public.lab_orders lo where lo.patient_id = patient_uuid)
          )
          or (
            public.current_user_role() = 'billing_staff'
            and exists (select 1 from public.invoices inv where inv.patient_id = patient_uuid)
          )
        )
    ),
    false
  );
$$;

create or replace function public.can_access_admission(admission_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    exists (
      select 1
      from public.admissions ad
      where ad.id = admission_uuid
        and public.has_hospital_access(ad.hospital_id)
        and (
          public.has_any_role('super_admin', 'hospital_admin', 'receptionist', 'billing_staff')
          or ad.admitting_doctor_id = public.current_doctor_id()
          or public.doctor_can_access_patient(ad.patient_id)
          or (public.current_user_role() = 'nurse' and public.nurse_can_access_patient(ad.patient_id))
        )
    ),
    false
  );
$$;

create or replace function public.can_access_appointment(appointment_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    exists (
      select 1
      from public.appointments a
      where a.id = appointment_uuid
        and public.has_hospital_access(a.hospital_id)
        and (
          public.has_any_role('super_admin', 'hospital_admin', 'receptionist', 'billing_staff')
          or a.doctor_id = public.current_doctor_id()
          or public.doctor_can_access_patient(a.patient_id)
        )
    ),
    false
  );
$$;

create or replace function public.can_access_encounter(encounter_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    exists (
      select 1
      from public.clinical_encounters ce
      where ce.id = encounter_uuid
        and public.has_hospital_access(ce.hospital_id)
        and (
          public.has_any_role('super_admin', 'hospital_admin')
          or ce.doctor_id = public.current_doctor_id()
          or ce.nurse_id = public.current_nurse_id()
          or public.doctor_can_access_patient(ce.patient_id)
          or (public.current_user_role() = 'nurse' and public.nurse_can_access_patient(ce.patient_id))
        )
    ),
    false
  );
$$;

create or replace function public.can_access_prescription(prescription_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    exists (
      select 1
      from public.prescriptions pr
      where pr.id = prescription_uuid
        and public.has_hospital_access(pr.hospital_id)
        and (
          public.has_any_role('super_admin', 'hospital_admin', 'pharmacist')
          or pr.doctor_id = public.current_doctor_id()
          or public.doctor_can_access_patient(pr.patient_id)
          or (public.current_user_role() = 'nurse' and public.nurse_can_access_patient(pr.patient_id))
        )
    ),
    false
  );
$$;

create or replace function public.can_access_lab_order(lab_order_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    exists (
      select 1
      from public.lab_orders lo
      where lo.id = lab_order_uuid
        and public.has_hospital_access(lo.hospital_id)
        and (
          public.has_any_role('super_admin', 'hospital_admin', 'lab_technician')
          or lo.doctor_id = public.current_doctor_id()
          or public.doctor_can_access_patient(lo.patient_id)
          or (public.current_user_role() = 'nurse' and public.nurse_can_access_patient(lo.patient_id))
        )
    ),
    false
  );
$$;

grant execute on function public.get_current_profile() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_hospital_id() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.has_hospital_access(uuid) to authenticated;
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.has_any_role(public.user_role[]) to authenticated;
grant execute on function public.is_hospital_admin_for(uuid) to authenticated;
grant execute on function public.current_doctor_id() to authenticated;
grant execute on function public.current_nurse_id() to authenticated;
grant execute on function public.current_nurse_ward_id() to authenticated;
grant execute on function public.doctor_can_access_patient(uuid) to authenticated;
grant execute on function public.nurse_can_access_patient(uuid) to authenticated;
grant execute on function public.can_access_patient(uuid) to authenticated;
grant execute on function public.can_access_admission(uuid) to authenticated;
grant execute on function public.can_access_appointment(uuid) to authenticated;
grant execute on function public.can_access_encounter(uuid) to authenticated;
grant execute on function public.can_access_prescription(uuid) to authenticated;
grant execute on function public.can_access_lab_order(uuid) to authenticated;

alter table public.hospitals enable row level security;
alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.staff enable row level security;
alter table public.doctors enable row level security;
alter table public.nurses enable row level security;
alter table public.patients enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.insurance_providers enable row level security;
alter table public.patient_insurance enable row level security;
alter table public.wards enable row level security;
alter table public.rooms enable row level security;
alter table public.beds enable row level security;
alter table public.admissions enable row level security;
alter table public.bed_allocations enable row level security;
alter table public.appointments enable row level security;
alter table public.clinical_encounters enable row level security;
alter table public.vitals enable row level security;
alter table public.diagnoses enable row level security;
alter table public.treatment_plans enable row level security;
alter table public.medications enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;
alter table public.suppliers enable row level security;
alter table public.medicine_inventory enable row level security;
alter table public.stock_movements enable row level security;
alter table public.lab_tests enable row level security;
alter table public.lab_orders enable row level security;
alter table public.lab_order_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Hospitals: super_admin can see all hospitals; users can see their own hospital; hospital_admin can update its hospital profile.
drop policy if exists hospitals_select_access on public.hospitals;
create policy hospitals_select_access on public.hospitals
  for select to authenticated
  using (public.has_hospital_access(id));
comment on policy hospitals_select_access on public.hospitals is
  'Users can read their own hospital; super_admin can read all hospitals.';

drop policy if exists hospitals_admin_update on public.hospitals;
create policy hospitals_admin_update on public.hospitals
  for update to authenticated
  using (public.is_hospital_admin_for(id))
  with check (public.is_hospital_admin_for(id));
comment on policy hospitals_admin_update on public.hospitals is
  'hospital_admin can maintain its hospital profile; super_admin can update any hospital.';

drop policy if exists hospitals_super_admin_insert on public.hospitals;
create policy hospitals_super_admin_insert on public.hospitals
  for insert to authenticated
  with check (public.is_super_admin());
comment on policy hospitals_super_admin_insert on public.hospitals is
  'Only super_admin can create new hospital tenants from the client.';

drop policy if exists hospitals_super_admin_delete on public.hospitals;
create policy hospitals_super_admin_delete on public.hospitals
  for delete to authenticated
  using (public.is_super_admin());
comment on policy hospitals_super_admin_delete on public.hospitals is
  'Only super_admin can delete hospital tenants.';

-- Departments: all users in a hospital can read departments; hospital_admin manages them.
drop policy if exists departments_select_hospital on public.departments;
create policy departments_select_hospital on public.departments
  for select to authenticated
  using (public.has_hospital_access(hospital_id));
comment on policy departments_select_hospital on public.departments is
  'Hospital-scoped department lookup for staff workflows.';

drop policy if exists departments_admin_manage on public.departments;
create policy departments_admin_manage on public.departments
  for all to authenticated
  using (public.is_hospital_admin_for(hospital_id))
  with check (public.is_hospital_admin_for(hospital_id));
comment on policy departments_admin_manage on public.departments is
  'hospital_admin manages departments inside its hospital; super_admin manages all.';

-- Profiles: users read their own profile; hospital_admin reads/manages profiles in its hospital; super_admin reads/manages all.
drop policy if exists profiles_select_access on public.profiles;
create policy profiles_select_access on public.profiles
  for select to authenticated
  using (
    auth_user_id = auth.uid()
    or public.is_hospital_admin_for(hospital_id)
    or (
      public.has_hospital_access(hospital_id)
      and public.has_any_role('doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'billing_staff')
    )
  );
comment on policy profiles_select_access on public.profiles is
  'Users can read themselves; hospital staff can resolve same-hospital profile names for operational workflows.';

drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles
  for insert to authenticated
  with check (public.is_hospital_admin_for(hospital_id));
comment on policy profiles_admin_insert on public.profiles is
  'hospital_admin creates staff profiles in its hospital; super_admin can create any profile.';

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin on public.profiles
  for update to authenticated
  using (auth_user_id = auth.uid() or public.is_hospital_admin_for(hospital_id))
  with check (
    public.is_hospital_admin_for(hospital_id)
    or (
      auth_user_id = auth.uid()
      and id = public.current_profile_id()
      and role = public.current_user_role()
      and hospital_id = public.current_hospital_id()
    )
  );
comment on policy profiles_update_self_or_admin on public.profiles is
  'Users can update their own non-privilege fields; hospital_admin manages same-hospital profiles.';

drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles
  for delete to authenticated
  using (public.is_hospital_admin_for(hospital_id));
comment on policy profiles_admin_delete on public.profiles is
  'Only hospital_admin or super_admin can remove profiles.';

-- Staff, doctors, nurses: readable within hospital; managed by hospital_admin; individual clinicians can read their own record.
drop policy if exists staff_select_hospital on public.staff;
create policy staff_select_hospital on public.staff
  for select to authenticated
  using (public.has_hospital_access(hospital_id));
comment on policy staff_select_hospital on public.staff is
  'Same-hospital staff directory visibility.';

drop policy if exists staff_admin_manage on public.staff;
create policy staff_admin_manage on public.staff
  for all to authenticated
  using (public.is_hospital_admin_for(hospital_id))
  with check (public.is_hospital_admin_for(hospital_id));
comment on policy staff_admin_manage on public.staff is
  'hospital_admin manages staff records for its hospital.';

drop policy if exists doctors_select_hospital on public.doctors;
create policy doctors_select_hospital on public.doctors
  for select to authenticated
  using (
    exists (
      select 1 from public.staff s
      where s.id = staff_id
        and public.has_hospital_access(s.hospital_id)
    )
  );
comment on policy doctors_select_hospital on public.doctors is
  'Same-hospital users can resolve doctor records for scheduling and clinical workflows.';

drop policy if exists doctors_admin_manage on public.doctors;
create policy doctors_admin_manage on public.doctors
  for all to authenticated
  using (
    exists (select 1 from public.staff s where s.id = staff_id and public.is_hospital_admin_for(s.hospital_id))
  )
  with check (
    exists (select 1 from public.staff s where s.id = staff_id and public.is_hospital_admin_for(s.hospital_id))
  );
comment on policy doctors_admin_manage on public.doctors is
  'hospital_admin manages doctor credential records.';

drop policy if exists nurses_select_hospital on public.nurses;
create policy nurses_select_hospital on public.nurses
  for select to authenticated
  using (
    exists (
      select 1 from public.staff s
      where s.id = staff_id
        and public.has_hospital_access(s.hospital_id)
    )
  );
comment on policy nurses_select_hospital on public.nurses is
  'Same-hospital users can resolve nurse records for ward workflows.';

drop policy if exists nurses_admin_manage on public.nurses;
create policy nurses_admin_manage on public.nurses
  for all to authenticated
  using (
    exists (select 1 from public.staff s where s.id = staff_id and public.is_hospital_admin_for(s.hospital_id))
  )
  with check (
    exists (select 1 from public.staff s where s.id = staff_id and public.is_hospital_admin_for(s.hospital_id))
  );
comment on policy nurses_admin_manage on public.nurses is
  'hospital_admin manages nurse credential and ward assignment records.';

-- Patients: hospital_admin and receptionist can read/create hospital patients; clinicians and operational users read related patients only.
drop policy if exists patients_select_by_role_or_assignment on public.patients;
create policy patients_select_by_role_or_assignment on public.patients
  for select to authenticated
  using (public.can_access_patient(id));
comment on policy patients_select_by_role_or_assignment on public.patients is
  'Hospital users see only their hospital patients and, for doctors/nurses/pharmacy/lab/billing, only assigned or related patients.';

drop policy if exists patients_receptionist_or_admin_insert on public.patients;
create policy patients_receptionist_or_admin_insert on public.patients
  for insert to authenticated
  with check (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'receptionist')
  );
comment on policy patients_receptionist_or_admin_insert on public.patients is
  'Receptionists and hospital_admin can register patients in their hospital.';

drop policy if exists patients_admin_receptionist_update on public.patients;
create policy patients_admin_receptionist_update on public.patients
  for update to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'receptionist')
  )
  with check (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'receptionist')
  );
comment on policy patients_admin_receptionist_update on public.patients is
  'Patient demographics are maintained by registration/admin users.';

drop policy if exists patients_admin_delete on public.patients;
create policy patients_admin_delete on public.patients
  for delete to authenticated
  using (public.is_hospital_admin_for(hospital_id));
comment on policy patients_admin_delete on public.patients is
  'Only hospital_admin or super_admin can delete patient records; soft delete is preferred.';

-- Patient-related demographics: access follows the parent patient.
drop policy if exists emergency_contacts_select_related_patient on public.emergency_contacts;
create policy emergency_contacts_select_related_patient on public.emergency_contacts
  for select to authenticated
  using (public.can_access_patient(patient_id));
comment on policy emergency_contacts_select_related_patient on public.emergency_contacts is
  'Emergency contacts inherit visibility from patient access.';

drop policy if exists emergency_contacts_intake_manage on public.emergency_contacts;
create policy emergency_contacts_intake_manage on public.emergency_contacts
  for all to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = patient_id
        and public.has_hospital_access(p.hospital_id)
        and public.has_any_role('super_admin', 'hospital_admin', 'receptionist')
    )
  )
  with check (
    exists (
      select 1 from public.patients p
      where p.id = patient_id
        and public.has_hospital_access(p.hospital_id)
        and public.has_any_role('super_admin', 'hospital_admin', 'receptionist')
    )
  );
comment on policy emergency_contacts_intake_manage on public.emergency_contacts is
  'Receptionists and hospital_admin maintain emergency contacts during registration.';

drop policy if exists insurance_providers_select_hospital on public.insurance_providers;
create policy insurance_providers_select_hospital on public.insurance_providers
  for select to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'receptionist', 'billing_staff')
  );
comment on policy insurance_providers_select_hospital on public.insurance_providers is
  'Registration and billing staff can read insurance provider catalog for their hospital.';

drop policy if exists insurance_providers_admin_billing_manage on public.insurance_providers;
create policy insurance_providers_admin_billing_manage on public.insurance_providers
  for all to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'billing_staff')
  )
  with check (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'billing_staff')
  );
comment on policy insurance_providers_admin_billing_manage on public.insurance_providers is
  'Billing staff and hospital_admin manage payer records.';

drop policy if exists patient_insurance_select_related_patient on public.patient_insurance;
create policy patient_insurance_select_related_patient on public.patient_insurance
  for select to authenticated
  using (public.can_access_patient(patient_id));
comment on policy patient_insurance_select_related_patient on public.patient_insurance is
  'Patient insurance visibility follows patient access.';

drop policy if exists patient_insurance_intake_billing_manage on public.patient_insurance;
create policy patient_insurance_intake_billing_manage on public.patient_insurance
  for all to authenticated
  using (
    exists (
      select 1 from public.patients p
      where p.id = patient_id
        and public.has_hospital_access(p.hospital_id)
        and public.has_any_role('super_admin', 'hospital_admin', 'receptionist', 'billing_staff')
    )
  )
  with check (
    exists (
      select 1 from public.patients p
      where p.id = patient_id
        and public.has_hospital_access(p.hospital_id)
        and public.has_any_role('super_admin', 'hospital_admin', 'receptionist', 'billing_staff')
    )
  );
comment on policy patient_insurance_intake_billing_manage on public.patient_insurance is
  'Receptionists and billing staff manage patient insurance details.';

-- Wards, rooms, beds: hospital users can view availability; hospital_admin manages structure; receptionist can update bed availability through intake workflows.
drop policy if exists wards_select_hospital on public.wards;
create policy wards_select_hospital on public.wards
  for select to authenticated
  using (public.has_hospital_access(hospital_id));
comment on policy wards_select_hospital on public.wards is
  'Same-hospital users can view ward structure.';

drop policy if exists wards_admin_manage on public.wards;
create policy wards_admin_manage on public.wards
  for all to authenticated
  using (public.is_hospital_admin_for(hospital_id))
  with check (public.is_hospital_admin_for(hospital_id));
comment on policy wards_admin_manage on public.wards is
  'hospital_admin manages ward configuration.';

drop policy if exists rooms_select_hospital on public.rooms;
create policy rooms_select_hospital on public.rooms
  for select to authenticated
  using (public.has_hospital_access(hospital_id));
comment on policy rooms_select_hospital on public.rooms is
  'Receptionists, nurses, and admins can view same-hospital room availability.';

drop policy if exists rooms_admin_manage on public.rooms;
create policy rooms_admin_manage on public.rooms
  for all to authenticated
  using (public.is_hospital_admin_for(hospital_id))
  with check (public.is_hospital_admin_for(hospital_id));
comment on policy rooms_admin_manage on public.rooms is
  'Only hospital_admin or super_admin can manage room definitions.';

drop policy if exists beds_select_hospital on public.beds;
create policy beds_select_hospital on public.beds
  for select to authenticated
  using (public.has_hospital_access(hospital_id));
comment on policy beds_select_hospital on public.beds is
  'Same-hospital users can view bed status for admissions and ward workflows.';

drop policy if exists beds_admin_reception_update on public.beds;
create policy beds_admin_reception_update on public.beds
  for update to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'receptionist')
  )
  with check (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'receptionist')
  );
comment on policy beds_admin_reception_update on public.beds is
  'Receptionists and hospital_admin can update bed availability during intake/allocation.';

drop policy if exists beds_admin_manage on public.beds;
create policy beds_admin_manage on public.beds
  for insert to authenticated
  with check (public.is_hospital_admin_for(hospital_id));
comment on policy beds_admin_manage on public.beds is
  'hospital_admin creates bed records.';

-- Admissions and bed allocations: receptionist creates admissions; doctors and nurses view assigned admitted patients.
drop policy if exists admissions_select_by_role_or_assignment on public.admissions;
create policy admissions_select_by_role_or_assignment on public.admissions
  for select to authenticated
  using (public.can_access_admission(id));
comment on policy admissions_select_by_role_or_assignment on public.admissions is
  'Admissions are visible to admins/receptionists/billing and assigned doctors or nurses.';

drop policy if exists admissions_receptionist_insert on public.admissions;
create policy admissions_receptionist_insert on public.admissions
  for insert to authenticated
  with check (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'receptionist')
  );
comment on policy admissions_receptionist_insert on public.admissions is
  'Receptionists and hospital_admin can create admissions for their hospital.';

drop policy if exists admissions_admin_receptionist_update on public.admissions;
create policy admissions_admin_receptionist_update on public.admissions
  for update to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'receptionist')
  )
  with check (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'receptionist')
  );
comment on policy admissions_admin_receptionist_update on public.admissions is
  'Receptionists and hospital_admin update admission status and discharge data.';

drop policy if exists bed_allocations_select_admission_access on public.bed_allocations;
create policy bed_allocations_select_admission_access on public.bed_allocations
  for select to authenticated
  using (public.can_access_admission(admission_id));
comment on policy bed_allocations_select_admission_access on public.bed_allocations is
  'Bed allocations inherit access from the associated admission.';

drop policy if exists bed_allocations_receptionist_manage on public.bed_allocations;
create policy bed_allocations_receptionist_manage on public.bed_allocations
  for all to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'receptionist')
  )
  with check (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'receptionist')
  );
comment on policy bed_allocations_receptionist_manage on public.bed_allocations is
  'Receptionists and hospital_admin allocate and release beds.';

-- Appointments: receptionist creates/manages; doctors see and update their schedule.
drop policy if exists appointments_select_by_role_or_assignment on public.appointments;
create policy appointments_select_by_role_or_assignment on public.appointments
  for select to authenticated
  using (public.can_access_appointment(id));
comment on policy appointments_select_by_role_or_assignment on public.appointments is
  'Appointments are visible to hospital admins/receptionists/billing and assigned doctors.';

drop policy if exists appointments_receptionist_doctor_insert on public.appointments;
create policy appointments_receptionist_doctor_insert on public.appointments
  for insert to authenticated
  with check (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'receptionist', 'doctor')
    and (
      public.current_user_role() <> 'doctor'
      or doctor_id = public.current_doctor_id()
    )
  );
comment on policy appointments_receptionist_doctor_insert on public.appointments is
  'Receptionists schedule any hospital appointment; doctors can create appointments for themselves.';

drop policy if exists appointments_receptionist_doctor_update on public.appointments;
create policy appointments_receptionist_doctor_update on public.appointments
  for update to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and (
      public.has_any_role('super_admin', 'hospital_admin', 'receptionist')
      or doctor_id = public.current_doctor_id()
    )
  )
  with check (
    public.has_hospital_access(hospital_id)
    and (
      public.has_any_role('super_admin', 'hospital_admin', 'receptionist')
      or doctor_id = public.current_doctor_id()
    )
  );
comment on policy appointments_receptionist_doctor_update on public.appointments is
  'Receptionists manage schedules; doctors update their assigned appointment workflow status.';

-- Clinical records: doctors manage their encounters/diagnoses/plans; nurses see admitted or ward patients and manage vitals.
drop policy if exists clinical_encounters_select_assignment on public.clinical_encounters;
create policy clinical_encounters_select_assignment on public.clinical_encounters
  for select to authenticated
  using (public.can_access_encounter(id));
comment on policy clinical_encounters_select_assignment on public.clinical_encounters is
  'Encounters are visible to hospital_admin, assigned doctors, and nurses caring for the patient.';

drop policy if exists clinical_encounters_doctor_manage on public.clinical_encounters;
create policy clinical_encounters_doctor_manage on public.clinical_encounters
  for all to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and (
      public.has_any_role('super_admin', 'hospital_admin')
      or doctor_id = public.current_doctor_id()
    )
  )
  with check (
    public.has_hospital_access(hospital_id)
    and (
      public.has_any_role('super_admin', 'hospital_admin')
      or doctor_id = public.current_doctor_id()
    )
  );
comment on policy clinical_encounters_doctor_manage on public.clinical_encounters is
  'Doctors manage their own encounters; hospital_admin can manage all hospital encounters.';

drop policy if exists vitals_select_clinical_access on public.vitals;
create policy vitals_select_clinical_access on public.vitals
  for select to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and (
      public.has_any_role('super_admin', 'hospital_admin')
      or public.doctor_can_access_patient(patient_id)
      or (public.current_user_role() = 'nurse' and public.nurse_can_access_patient(patient_id))
    )
  );
comment on policy vitals_select_clinical_access on public.vitals is
  'Vitals are visible to assigned doctors and nurses caring for admitted/ward patients.';

drop policy if exists vitals_doctor_nurse_insert on public.vitals;
create policy vitals_doctor_nurse_insert on public.vitals
  for insert to authenticated
  with check (
    public.has_hospital_access(hospital_id)
    and (
      public.has_any_role('super_admin', 'hospital_admin')
      or public.doctor_can_access_patient(patient_id)
      or (public.current_user_role() = 'nurse' and public.nurse_can_access_patient(patient_id))
    )
  );
comment on policy vitals_doctor_nurse_insert on public.vitals is
  'Doctors and nurses can record vitals for patients under their care.';

drop policy if exists vitals_doctor_nurse_update on public.vitals;
create policy vitals_doctor_nurse_update on public.vitals
  for update to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and (
      public.has_any_role('super_admin', 'hospital_admin')
      or recorded_by = public.current_profile_id()
      or (public.current_user_role() = 'nurse' and public.nurse_can_access_patient(patient_id))
    )
  )
  with check (
    public.has_hospital_access(hospital_id)
    and (
      public.has_any_role('super_admin', 'hospital_admin')
      or recorded_by = public.current_profile_id()
      or (public.current_user_role() = 'nurse' and public.nurse_can_access_patient(patient_id))
    )
  );
comment on policy vitals_doctor_nurse_update on public.vitals is
  'Nurses can update vitals for assigned/admitted patients; creators can update their own entries.';

drop policy if exists diagnoses_select_clinical_access on public.diagnoses;
create policy diagnoses_select_clinical_access on public.diagnoses
  for select to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and (
      public.has_any_role('super_admin', 'hospital_admin', 'billing_staff')
      or doctor_id = public.current_doctor_id()
      or public.doctor_can_access_patient(patient_id)
      or (public.current_user_role() = 'nurse' and public.nurse_can_access_patient(patient_id))
    )
  );
comment on policy diagnoses_select_clinical_access on public.diagnoses is
  'Diagnoses are visible to assigned clinical staff and billing for coding.';

drop policy if exists diagnoses_doctor_manage on public.diagnoses;
create policy diagnoses_doctor_manage on public.diagnoses
  for all to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and (public.has_any_role('super_admin', 'hospital_admin') or doctor_id = public.current_doctor_id())
  )
  with check (
    public.has_hospital_access(hospital_id)
    and (public.has_any_role('super_admin', 'hospital_admin') or doctor_id = public.current_doctor_id())
  );
comment on policy diagnoses_doctor_manage on public.diagnoses is
  'Doctors manage diagnoses they authored; hospital_admin can manage all.';

drop policy if exists treatment_plans_select_clinical_access on public.treatment_plans;
create policy treatment_plans_select_clinical_access on public.treatment_plans
  for select to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and (
      public.has_any_role('super_admin', 'hospital_admin')
      or doctor_id = public.current_doctor_id()
      or public.doctor_can_access_patient(patient_id)
      or (public.current_user_role() = 'nurse' and public.nurse_can_access_patient(patient_id))
    )
  );
comment on policy treatment_plans_select_clinical_access on public.treatment_plans is
  'Treatment plans are visible to assigned doctors and nurses caring for the patient.';

drop policy if exists treatment_plans_doctor_manage on public.treatment_plans;
create policy treatment_plans_doctor_manage on public.treatment_plans
  for all to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and (public.has_any_role('super_admin', 'hospital_admin') or doctor_id = public.current_doctor_id())
  )
  with check (
    public.has_hospital_access(hospital_id)
    and (public.has_any_role('super_admin', 'hospital_admin') or doctor_id = public.current_doctor_id())
  );
comment on policy treatment_plans_doctor_manage on public.treatment_plans is
  'Doctors manage their treatment plans; hospital_admin can manage all.';

-- Pharmacy and inventory: pharmacists manage medications, prescriptions, stock, and suppliers; doctors can read medication catalog and own prescriptions.
drop policy if exists medications_select_clinical_pharmacy on public.medications;
create policy medications_select_clinical_pharmacy on public.medications
  for select to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'doctor', 'nurse', 'pharmacist')
  );
comment on policy medications_select_clinical_pharmacy on public.medications is
  'Clinical staff can read medication catalog; pharmacists/admins manage it.';

drop policy if exists medications_pharmacist_manage on public.medications;
create policy medications_pharmacist_manage on public.medications
  for all to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'pharmacist')
  )
  with check (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'pharmacist')
  );
comment on policy medications_pharmacist_manage on public.medications is
  'Pharmacists manage same-hospital medications.';

drop policy if exists prescriptions_select_assignment_pharmacy on public.prescriptions;
create policy prescriptions_select_assignment_pharmacy on public.prescriptions
  for select to authenticated
  using (public.can_access_prescription(id));
comment on policy prescriptions_select_assignment_pharmacy on public.prescriptions is
  'Prescriptions are visible to assigned doctors, nurses caring for the patient, pharmacists, and admins.';

drop policy if exists prescriptions_doctor_pharmacist_manage on public.prescriptions;
create policy prescriptions_doctor_pharmacist_manage on public.prescriptions
  for all to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and (
      public.has_any_role('super_admin', 'hospital_admin', 'pharmacist')
      or doctor_id = public.current_doctor_id()
    )
  )
  with check (
    public.has_hospital_access(hospital_id)
    and (
      public.has_any_role('super_admin', 'hospital_admin', 'pharmacist')
      or doctor_id = public.current_doctor_id()
    )
  );
comment on policy prescriptions_doctor_pharmacist_manage on public.prescriptions is
  'Doctors prescribe for their patients; pharmacists can manage fulfillment/status.';

drop policy if exists prescription_items_select_prescription_access on public.prescription_items;
create policy prescription_items_select_prescription_access on public.prescription_items
  for select to authenticated
  using (public.can_access_prescription(prescription_id));
comment on policy prescription_items_select_prescription_access on public.prescription_items is
  'Prescription items inherit access from the parent prescription.';

drop policy if exists prescription_items_doctor_pharmacist_manage on public.prescription_items;
create policy prescription_items_doctor_pharmacist_manage on public.prescription_items
  for all to authenticated
  using (
    exists (
      select 1 from public.prescriptions pr
      where pr.id = prescription_id
        and public.has_hospital_access(pr.hospital_id)
        and (
          public.has_any_role('super_admin', 'hospital_admin', 'pharmacist')
          or pr.doctor_id = public.current_doctor_id()
        )
    )
  )
  with check (
    exists (
      select 1 from public.prescriptions pr
      where pr.id = prescription_id
        and public.has_hospital_access(pr.hospital_id)
        and (
          public.has_any_role('super_admin', 'hospital_admin', 'pharmacist')
          or pr.doctor_id = public.current_doctor_id()
        )
    )
  );
comment on policy prescription_items_doctor_pharmacist_manage on public.prescription_items is
  'Prescription line items are managed by prescribing doctors, pharmacists, and admins.';

drop policy if exists suppliers_pharmacist_manage on public.suppliers;
create policy suppliers_pharmacist_manage on public.suppliers
  for all to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'pharmacist')
  )
  with check (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'pharmacist')
  );
comment on policy suppliers_pharmacist_manage on public.suppliers is
  'Pharmacists manage suppliers for their hospital.';

drop policy if exists medicine_inventory_pharmacist_manage on public.medicine_inventory;
create policy medicine_inventory_pharmacist_manage on public.medicine_inventory
  for all to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'pharmacist')
  )
  with check (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'pharmacist')
  );
comment on policy medicine_inventory_pharmacist_manage on public.medicine_inventory is
  'Pharmacists manage inventory, stock levels, cost, and expiry data.';

drop policy if exists stock_movements_pharmacist_manage on public.stock_movements;
create policy stock_movements_pharmacist_manage on public.stock_movements
  for all to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'pharmacist')
  )
  with check (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'pharmacist')
  );
comment on policy stock_movements_pharmacist_manage on public.stock_movements is
  'Pharmacists record and audit stock movements.';

-- Laboratory: lab technicians manage test catalog, orders, and results; doctors can view/order their own lab orders.
drop policy if exists lab_tests_select_clinical_lab on public.lab_tests;
create policy lab_tests_select_clinical_lab on public.lab_tests
  for select to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'doctor', 'nurse', 'lab_technician')
  );
comment on policy lab_tests_select_clinical_lab on public.lab_tests is
  'Clinical and lab users can read the same-hospital lab test catalog.';

drop policy if exists lab_tests_lab_manage on public.lab_tests;
create policy lab_tests_lab_manage on public.lab_tests
  for all to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'lab_technician')
  )
  with check (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'lab_technician')
  );
comment on policy lab_tests_lab_manage on public.lab_tests is
  'Lab technicians manage same-hospital test catalog.';

drop policy if exists lab_orders_select_assignment_lab on public.lab_orders;
create policy lab_orders_select_assignment_lab on public.lab_orders
  for select to authenticated
  using (public.can_access_lab_order(id));
comment on policy lab_orders_select_assignment_lab on public.lab_orders is
  'Lab orders are visible to lab staff, ordering doctors, and nurses caring for the patient.';

drop policy if exists lab_orders_doctor_lab_manage on public.lab_orders;
create policy lab_orders_doctor_lab_manage on public.lab_orders
  for all to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and (
      public.has_any_role('super_admin', 'hospital_admin', 'lab_technician')
      or doctor_id = public.current_doctor_id()
    )
  )
  with check (
    public.has_hospital_access(hospital_id)
    and (
      public.has_any_role('super_admin', 'hospital_admin', 'lab_technician')
      or doctor_id = public.current_doctor_id()
    )
  );
comment on policy lab_orders_doctor_lab_manage on public.lab_orders is
  'Doctors create/manage their orders; lab technicians manage processing and status.';

drop policy if exists lab_order_items_select_order_access on public.lab_order_items;
create policy lab_order_items_select_order_access on public.lab_order_items
  for select to authenticated
  using (public.can_access_lab_order(lab_order_id));
comment on policy lab_order_items_select_order_access on public.lab_order_items is
  'Lab order item/result access follows parent lab order.';

drop policy if exists lab_order_items_lab_manage on public.lab_order_items;
create policy lab_order_items_lab_manage on public.lab_order_items
  for all to authenticated
  using (
    exists (
      select 1 from public.lab_orders lo
      where lo.id = lab_order_id
        and public.has_hospital_access(lo.hospital_id)
        and public.has_any_role('super_admin', 'hospital_admin', 'lab_technician')
    )
  )
  with check (
    exists (
      select 1 from public.lab_orders lo
      where lo.id = lab_order_id
        and public.has_hospital_access(lo.hospital_id)
        and public.has_any_role('super_admin', 'hospital_admin', 'lab_technician')
    )
  );
comment on policy lab_order_items_lab_manage on public.lab_order_items is
  'Lab technicians manage lab results and item statuses.';

-- Billing: billing staff manage invoices, invoice items, and payments for their hospital.
drop policy if exists invoices_billing_manage on public.invoices;
create policy invoices_billing_manage on public.invoices
  for all to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'billing_staff')
  )
  with check (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'billing_staff')
  );
comment on policy invoices_billing_manage on public.invoices is
  'Billing staff and hospital_admin manage invoices in their hospital.';

drop policy if exists invoices_clinical_select_related on public.invoices;
create policy invoices_clinical_select_related on public.invoices
  for select to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and (
      public.has_any_role('super_admin', 'hospital_admin', 'billing_staff', 'receptionist')
      or public.doctor_can_access_patient(patient_id)
    )
  );
comment on policy invoices_clinical_select_related on public.invoices is
  'Receptionists and assigned doctors can read invoice status where needed for workflow context.';

drop policy if exists invoice_items_billing_manage on public.invoice_items;
create policy invoice_items_billing_manage on public.invoice_items
  for all to authenticated
  using (
    exists (
      select 1 from public.invoices inv
      where inv.id = invoice_id
        and public.has_hospital_access(inv.hospital_id)
        and public.has_any_role('super_admin', 'hospital_admin', 'billing_staff')
    )
  )
  with check (
    exists (
      select 1 from public.invoices inv
      where inv.id = invoice_id
        and public.has_hospital_access(inv.hospital_id)
        and public.has_any_role('super_admin', 'hospital_admin', 'billing_staff')
    )
  );
comment on policy invoice_items_billing_manage on public.invoice_items is
  'Invoice items inherit billing permissions from parent invoice.';

drop policy if exists invoice_items_clinical_select_related on public.invoice_items;
create policy invoice_items_clinical_select_related on public.invoice_items
  for select to authenticated
  using (
    exists (
      select 1 from public.invoices inv
      where inv.id = invoice_id
        and public.has_hospital_access(inv.hospital_id)
        and (
          public.has_any_role('super_admin', 'hospital_admin', 'billing_staff', 'receptionist')
          or public.doctor_can_access_patient(inv.patient_id)
        )
    )
  );
comment on policy invoice_items_clinical_select_related on public.invoice_items is
  'Invoice line item read access follows invoice read access.';

drop policy if exists payments_billing_manage on public.payments;
create policy payments_billing_manage on public.payments
  for all to authenticated
  using (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'billing_staff')
  )
  with check (
    public.has_hospital_access(hospital_id)
    and public.has_any_role('super_admin', 'hospital_admin', 'billing_staff')
  );
comment on policy payments_billing_manage on public.payments is
  'Billing staff and hospital_admin manage payments.';

-- Notifications: users manage their own notifications; hospital_admin can broadcast/read same-hospital notifications.
drop policy if exists notifications_select_own_or_admin on public.notifications;
create policy notifications_select_own_or_admin on public.notifications
  for select to authenticated
  using (
    profile_id = public.current_profile_id()
    or public.is_hospital_admin_for(hospital_id)
  );
comment on policy notifications_select_own_or_admin on public.notifications is
  'Users read their own notifications; hospital_admin can inspect hospital notifications.';

drop policy if exists notifications_insert_admin on public.notifications;
create policy notifications_insert_admin on public.notifications
  for insert to authenticated
  with check (public.is_hospital_admin_for(hospital_id));
comment on policy notifications_insert_admin on public.notifications is
  'hospital_admin creates same-hospital notifications.';

drop policy if exists notifications_update_own_read_state on public.notifications;
create policy notifications_update_own_read_state on public.notifications
  for update to authenticated
  using (profile_id = public.current_profile_id() or public.is_hospital_admin_for(hospital_id))
  with check (profile_id = public.current_profile_id() or public.is_hospital_admin_for(hospital_id));
comment on policy notifications_update_own_read_state on public.notifications is
  'Users can mark their notifications read; hospital_admin can update hospital notifications.';

-- Audit logs: authenticated users may read only as admins; inserts are reserved for service_role or a controlled SECURITY DEFINER server function.
drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_admin_select on public.audit_logs
  for select to authenticated
  using (
    public.is_super_admin()
    or (
      public.current_user_role() = 'hospital_admin'
      and public.current_hospital_id() = hospital_id
    )
  );
comment on policy audit_logs_admin_select on public.audit_logs is
  'super_admin reads all audit logs; hospital_admin reads logs for its hospital.';

drop policy if exists audit_logs_service_role_insert on public.audit_logs;
create policy audit_logs_service_role_insert on public.audit_logs
  for insert to service_role
  with check (true);
comment on policy audit_logs_service_role_insert on public.audit_logs is
  'Audit logs are insert-only from Supabase service_role or controlled SECURITY DEFINER server functions; no authenticated insert policy is granted.';

drop policy if exists audit_logs_no_authenticated_update on public.audit_logs;
create policy audit_logs_no_authenticated_update on public.audit_logs
  for update to authenticated
  using (false)
  with check (false);
comment on policy audit_logs_no_authenticated_update on public.audit_logs is
  'Audit logs are immutable for authenticated users.';

drop policy if exists audit_logs_no_authenticated_delete on public.audit_logs;
create policy audit_logs_no_authenticated_delete on public.audit_logs
  for delete to authenticated
  using (false);
comment on policy audit_logs_no_authenticated_delete on public.audit_logs is
  'Audit logs cannot be deleted by authenticated users.';
