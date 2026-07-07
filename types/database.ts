export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enums — must stay in sync with supabase/migrations/0001_medimade_hms_schema.sql
export type UserRole =
  | "super_admin"
  | "hospital_admin"
  | "doctor"
  | "nurse"
  | "receptionist"
  | "pharmacist"
  | "lab_technician"
  | "billing_staff";

export type GenderType = "male" | "female" | "other" | "unknown";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "unknown";
export type StaffStatus = "active" | "on_leave" | "suspended" | "terminated";
export type RoomType = "general" | "private" | "semi_private" | "icu" | "emergency" | "operating" | "isolation";
export type RoomStatus = "available" | "occupied" | "reserved" | "cleaning" | "maintenance" | "inactive";
export type BedStatus = "available" | "occupied" | "reserved" | "cleaning" | "maintenance";
export type AdmissionStatus = "admitted" | "transferred" | "discharged" | "cancelled";
export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";
export type EncounterStatus = "draft" | "in_progress" | "completed" | "cancelled";
export type PrescriptionStatus = "active" | "completed" | "cancelled" | "expired";
export type LabOrderStatus =
  | "ordered"
  | "sample_collected"
  | "processing"
  | "completed"
  | "cancelled";
export type LabResultStatus = "pending" | "normal" | "abnormal" | "critical";
export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "cancelled";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "void";
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "insurance" | "online";
export type StockMovementType =
  | "purchase"
  | "dispense"
  | "adjustment"
  | "return"
  | "transfer_in"
  | "transfer_out"
  | "expired"
  | "damaged";

// Derived in the app (patients have no status column in the DB)
export type PatientStatus = "active" | "admitted" | "discharged" | "inactive";

export type Hospital = {
  id: string;
  name: string;
  legal_name: string | null;
  license_number: string | null;
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Department = {
  id: string;
  hospital_id: string;
  name: string;
  code: string;
  description: string | null;
  floor: string | null;
  phone_extension: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Profile = {
  id: string;
  auth_user_id: string;
  hospital_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Staff = {
  id: string;
  profile_id: string;
  hospital_id: string;
  department_id: string | null;
  employee_code: string;
  job_title: string;
  employment_type: string | null;
  shift: string | null;
  status: StaffStatus;
  hire_date: string | null;
  termination_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Doctor = {
  id: string;
  staff_id: string;
  specialization: string | null;
  license_number: string;
  consultation_fee: number;
  years_experience: number;
  availability_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Nurse = {
  id: string;
  staff_id: string;
  nursing_license_number: string;
  assigned_ward_id: string | null;
  shift: string | null;
  created_at: string;
  updated_at: string;
};

export type Ward = {
  id: string;
  hospital_id: string;
  department_id: string | null;
  name: string;
  floor: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Room = {
  id: string;
  hospital_id: string;
  ward_id: string;
  room_number: string;
  room_type: RoomType;
  status: RoomStatus;
  daily_rate: number;
  created_at: string;
  updated_at: string;
};

export type Bed = {
  id: string;
  hospital_id: string;
  room_id: string;
  bed_number: string;
  status: BedStatus;
  current_patient_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Patient = {
  id: string;
  hospital_id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: GenderType;
  blood_group: BloodGroup;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  allergies: string | null;
  chronic_conditions: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Admission = {
  id: string;
  hospital_id: string;
  patient_id: string;
  admitting_doctor_id: string | null;
  department_id: string | null;
  admission_datetime: string;
  expected_discharge_datetime: string | null;
  discharge_datetime: string | null;
  reason: string;
  diagnosis_summary: string | null;
  status: AdmissionStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type BedAllocation = {
  id: string;
  hospital_id: string;
  admission_id: string;
  patient_id: string;
  bed_id: string;
  allocated_at: string;
  released_at: string | null;
  allocated_by: string | null;
  release_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type Appointment = {
  id: string;
  hospital_id: string;
  patient_id: string;
  doctor_id: string;
  department_id: string | null;
  scheduled_start: string;
  scheduled_end: string;
  reason: string | null;
  status: AppointmentStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
};

export type ClinicalEncounter = {
  id: string;
  hospital_id: string;
  patient_id: string;
  admission_id: string | null;
  appointment_id: string | null;
  doctor_id: string | null;
  nurse_id: string | null;
  encounter_type: string;
  chief_complaint: string | null;
  notes: string | null;
  status: EncounterStatus;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Medication = {
  id: string;
  hospital_id: string;
  name: string;
  generic_name: string | null;
  brand_name: string | null;
  strength: string | null;
  dosage_form: string | null;
  manufacturer: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MedicineInventory = {
  id: string;
  hospital_id: string;
  medication_id: string;
  supplier_id: string | null;
  sku: string;
  batch_no: string;
  expiry_date: string;
  quantity_on_hand: number;
  reorder_level: number;
  unit_cost: number;
  selling_price: number;
  storage_location: string | null;
  created_at: string;
  updated_at: string;
};

export type LabOrder = {
  id: string;
  hospital_id: string;
  patient_id: string;
  doctor_id: string | null;
  encounter_id: string | null;
  status: LabOrderStatus;
  priority: string;
  ordered_at: string;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  hospital_id: string;
  patient_id: string;
  admission_id: string | null;
  appointment_id: string | null;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  issued_at: string | null;
  due_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  hospital_id: string;
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_reference: string | null;
  paid_at: string | null;
  received_by: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  hospital_id: string | null;
  actor_profile_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

type TableShape<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
};

export type Database = {
  public: {
    Tables: {
      hospitals: TableShape<Hospital, "name">;
      departments: TableShape<Department, "hospital_id" | "name" | "code">;
      profiles: TableShape<Profile, "auth_user_id" | "full_name" | "email" | "role">;
      staff: TableShape<Staff, "profile_id" | "hospital_id" | "employee_code" | "job_title">;
      doctors: TableShape<Doctor, "staff_id" | "license_number">;
      nurses: TableShape<Nurse, "staff_id" | "nursing_license_number">;
      wards: TableShape<Ward, "hospital_id" | "name">;
      rooms: TableShape<Room, "hospital_id" | "ward_id" | "room_number">;
      beds: TableShape<Bed, "hospital_id" | "room_id" | "bed_number">;
      patients: TableShape<
        Patient,
        "hospital_id" | "mrn" | "first_name" | "last_name" | "date_of_birth"
      >;
      admissions: TableShape<Admission, "hospital_id" | "patient_id" | "reason">;
      bed_allocations: TableShape<
        BedAllocation,
        "hospital_id" | "admission_id" | "patient_id" | "bed_id"
      >;
      appointments: TableShape<
        Appointment,
        "hospital_id" | "patient_id" | "doctor_id" | "scheduled_start" | "scheduled_end"
      >;
      clinical_encounters: TableShape<
        ClinicalEncounter,
        "hospital_id" | "patient_id" | "encounter_type"
      >;
      medications: TableShape<Medication, "hospital_id" | "name">;
      medicine_inventory: TableShape<
        MedicineInventory,
        "hospital_id" | "medication_id" | "sku" | "batch_no" | "expiry_date"
      >;
      lab_orders: TableShape<LabOrder, "hospital_id" | "patient_id">;
      invoices: TableShape<Invoice, "hospital_id" | "patient_id" | "invoice_number">;
      payments: TableShape<Payment, "hospital_id" | "invoice_id" | "amount" | "payment_method">;
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog> & Pick<AuditLog, "action" | "entity_type">;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      gender_type: GenderType;
      blood_group: BloodGroup;
      staff_status: StaffStatus;
      room_type: RoomType;
      room_status: RoomStatus;
      bed_status: BedStatus;
      admission_status: AdmissionStatus;
      appointment_status: AppointmentStatus;
      encounter_status: EncounterStatus;
      prescription_status: PrescriptionStatus;
      lab_order_status: LabOrderStatus;
      lab_result_status: LabResultStatus;
      invoice_status: InvoiceStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      stock_movement_type: StockMovementType;
    };
  };
};
