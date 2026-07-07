import { addDays, addHours, formatISO, subDays } from "date-fns";
import type { Admission, Appointment, Invoice, Patient, Profile } from "@/types/database";

const hospitalId = "00000000-0000-4000-8000-000000000001";

export const currentProfile: Profile = {
  id: "00000000-0000-4000-8000-000000000010",
  auth_user_id: "00000000-0000-4000-8000-000000000110",
  hospital_id: hospitalId,
  role: "hospital_admin",
  full_name: "Aisha Rahman",
  email: "admin@medimade.local",
  phone: "+1 212 555 0100",
  avatar_url: null,
  is_active: true,
  last_login_at: new Date().toISOString(),
  created_at: subDays(new Date(), 90).toISOString(),
  updated_at: new Date().toISOString()
};

export const patients: Patient[] = [
  {
    id: "p-1001",
    hospital_id: hospitalId,
    mrn: "MC-240001",
    first_name: "Maya",
    last_name: "Bennett",
    date_of_birth: "1988-04-12",
    gender: "female",
    blood_group: "O+",
    phone: "+1 212 555 0171",
    email: "maya.bennett@example.com",
    address_line1: "144 Hudson St",
    address_line2: null,
    city: "New York",
    state: "NY",
    postal_code: "10013",
    country: "United States",
    allergies: "Penicillin",
    chronic_conditions: null,
    notes: null,
    created_at: subDays(new Date(), 14).toISOString(),
    updated_at: subDays(new Date(), 1).toISOString(),
    deleted_at: null
  },
  {
    id: "p-1002",
    hospital_id: hospitalId,
    mrn: "MC-240002",
    first_name: "Noah",
    last_name: "Singh",
    date_of_birth: "1975-11-03",
    gender: "male",
    blood_group: "A-",
    phone: "+1 212 555 0182",
    email: "noah.singh@example.com",
    address_line1: "25 Mercer St",
    address_line2: null,
    city: "New York",
    state: "NY",
    postal_code: "10012",
    country: "United States",
    allergies: null,
    chronic_conditions: "Hypertension",
    notes: null,
    created_at: subDays(new Date(), 8).toISOString(),
    updated_at: subDays(new Date(), 3).toISOString(),
    deleted_at: null
  },
  {
    id: "p-1003",
    hospital_id: hospitalId,
    mrn: "MC-240003",
    first_name: "Elena",
    last_name: "Morales",
    date_of_birth: "1992-02-20",
    gender: "female",
    blood_group: "B+",
    phone: "+1 212 555 0193",
    email: "elena.morales@example.com",
    address_line1: "88 Lafayette St",
    address_line2: null,
    city: "New York",
    state: "NY",
    postal_code: "10013",
    country: "United States",
    allergies: null,
    chronic_conditions: null,
    notes: null,
    created_at: subDays(new Date(), 2).toISOString(),
    updated_at: subDays(new Date(), 2).toISOString(),
    deleted_at: null
  }
];

export const staff: Array<Profile & { department: string; staff_type: string }> = [
  { ...currentProfile, department: "Administration", staff_type: "administrator" },
  {
    id: "s-2001",
    auth_user_id: "00000000-0000-4000-8000-000000000201",
    hospital_id: hospitalId,
    role: "doctor",
    full_name: "Dr. Daniel Chen",
    email: "daniel.chen@medimade.local",
    phone: "+1 212 555 0201",
    avatar_url: null,
    is_active: true,
    last_login_at: null,
    created_at: subDays(new Date(), 120).toISOString(),
    updated_at: new Date().toISOString(),
    department: "Cardiology",
    staff_type: "doctor"
  },
  {
    id: "s-2002",
    auth_user_id: "00000000-0000-4000-8000-000000000202",
    hospital_id: hospitalId,
    role: "nurse",
    full_name: "Nurse Priya Shah",
    email: "priya.shah@medimade.local",
    phone: "+1 212 555 0202",
    avatar_url: null,
    is_active: true,
    last_login_at: null,
    created_at: subDays(new Date(), 100).toISOString(),
    updated_at: new Date().toISOString(),
    department: "ICU",
    staff_type: "nurse"
  },
  {
    id: "s-2003",
    auth_user_id: "00000000-0000-4000-8000-000000000203",
    hospital_id: hospitalId,
    role: "pharmacist",
    full_name: "Omar Haddad",
    email: "omar.haddad@medimade.local",
    phone: "+1 212 555 0203",
    avatar_url: null,
    is_active: true,
    last_login_at: null,
    created_at: subDays(new Date(), 70).toISOString(),
    updated_at: new Date().toISOString(),
    department: "Pharmacy",
    staff_type: "pharmacist"
  }
];

export const appointments: Appointment[] = [
  {
    id: "a-3001",
    hospital_id: hospitalId,
    patient_id: "p-1002",
    doctor_id: "s-2001",
    department_id: "d-cardiology",
    scheduled_start: formatISO(new Date()),
    scheduled_end: formatISO(addHours(new Date(), 1)),
    status: "checked_in",
    reason: "Chest pain follow-up",
    notes: null,
    created_by: null,
    created_at: subDays(new Date(), 5).toISOString(),
    updated_at: subDays(new Date(), 1).toISOString(),
    cancelled_at: null,
    cancellation_reason: null
  },
  {
    id: "a-3002",
    hospital_id: hospitalId,
    patient_id: "p-1003",
    doctor_id: "s-2001",
    department_id: "d-cardiology",
    scheduled_start: addDays(new Date(), 1).toISOString(),
    scheduled_end: addHours(addDays(new Date(), 1), 1).toISOString(),
    status: "scheduled",
    reason: "Hypertension consult",
    notes: null,
    created_by: null,
    created_at: subDays(new Date(), 1).toISOString(),
    updated_at: subDays(new Date(), 1).toISOString(),
    cancelled_at: null,
    cancellation_reason: null
  }
];

export const admissions: Admission[] = [
  {
    id: "ad-4001",
    hospital_id: hospitalId,
    patient_id: "p-1001",
    admitting_doctor_id: "s-2001",
    department_id: null,
    admission_datetime: subDays(new Date(), 2).toISOString(),
    expected_discharge_datetime: addDays(new Date(), 3).toISOString(),
    discharge_datetime: null,
    status: "admitted",
    reason: "Post-operative observation",
    diagnosis_summary: null,
    created_by: null,
    created_at: subDays(new Date(), 2).toISOString(),
    updated_at: subDays(new Date(), 2).toISOString()
  }
];

export const invoices: Invoice[] = [
  {
    id: "i-6001",
    hospital_id: hospitalId,
    patient_id: "p-1001",
    admission_id: null,
    appointment_id: null,
    invoice_number: "INV-2026-0001",
    status: "partially_paid",
    subtotal: 12800,
    tax_amount: 0,
    discount_amount: 500,
    total_amount: 12300,
    issued_at: subDays(new Date(), 1).toISOString(),
    due_at: addDays(new Date(), 14).toISOString(),
    created_by: null,
    created_at: subDays(new Date(), 1).toISOString(),
    updated_at: subDays(new Date(), 1).toISOString()
  },
  {
    id: "i-6002",
    hospital_id: hospitalId,
    patient_id: "p-1002",
    admission_id: null,
    appointment_id: null,
    invoice_number: "INV-2026-0002",
    status: "issued",
    subtotal: 420,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 420,
    issued_at: new Date().toISOString(),
    due_at: addDays(new Date(), 10).toISOString(),
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const overviewSeries = [
  { name: "Jan", revenue: 82000, admissions: 38, appointments: 420 },
  { name: "Feb", revenue: 91000, admissions: 44, appointments: 460 },
  { name: "Mar", revenue: 104000, admissions: 51, appointments: 510 },
  { name: "Apr", revenue: 99000, admissions: 47, appointments: 505 },
  { name: "May", revenue: 118000, admissions: 54, appointments: 548 },
  { name: "Jun", revenue: 126000, admissions: 59, appointments: 572 }
];
