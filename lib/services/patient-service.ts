import { addDays, subDays } from "date-fns";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { patientSchema, type PatientFormValues } from "@/lib/validations/patient";
import { admissions, appointments, invoices, patients } from "./mock-data";
import type { DiagnosisRecord } from "./diagnosis";
import type { EncounterRecord } from "./encounters";
import type { TreatmentPlanRecord } from "./treatment-plans";
import type { VitalsRecord } from "./vitals";
import type { Admission, Appointment, Invoice, Patient, PatientStatus } from "@/types/database";

export type PatientRecord = Patient & {
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  allergies?: string | null;
  chronic_conditions?: string | null;
  notes?: string | null;
  deleted_at?: string | null;
  computed_status?: PatientStatus;
  admissions?: PatientAdmission[];
};

export type EmergencyContact = {
  id: string;
  patient_id: string;
  full_name: string;
  relationship: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  is_primary: boolean;
  created_at: string;
};

export type InsuranceProvider = {
  id: string;
  name: string;
  payer_code?: string | null;
  phone?: string | null;
};

export type PatientInsurance = {
  id: string;
  patient_id: string;
  policy_number: string;
  group_number?: string | null;
  subscriber_name?: string | null;
  relationship_to_patient?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  is_primary: boolean;
  insurance_providers?: InsuranceProvider | null;
};

export type PatientAdmission = Partial<Admission> & {
  admission_datetime?: string;
  discharge_datetime?: string | null;
  diagnosis_summary?: string | null;
  bed_allocations?: PatientBedAllocation[];
};

export type PatientAppointment = Partial<Appointment> & {
  scheduled_start?: string;
  scheduled_end?: string;
  notes?: string | null;
};

export type PrescriptionItem = {
  id: string;
  dosage: string;
  frequency: string;
  duration?: string | null;
  route?: string | null;
  instructions?: string | null;
  quantity: number;
  medications?: {
    name: string;
    strength?: string | null;
    dosage_form?: string | null;
  } | null;
};

export type PatientPrescription = {
  id: string;
  patient_id: string;
  status: string;
  prescribed_at: string;
  notes?: string | null;
  prescription_items?: PrescriptionItem[];
};

export type PatientLabOrder = {
  id: string;
  patient_id: string;
  status: string;
  priority: string;
  ordered_at: string;
  completed_at?: string | null;
  notes?: string | null;
  lab_order_items?: Array<{
    id: string;
    result_value?: string | null;
    result_unit?: string | null;
    result_status: string;
    lab_tests?: {
      test_name: string;
      test_code: string;
      category?: string | null;
    } | null;
  }>;
};

export type PatientInvoice = Partial<Invoice> & {
  invoice_number?: string;
  total_amount?: number;
  tax_amount?: number;
  discount_amount?: number;
  payments?: PatientPayment[];
};

export type PatientPayment = {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  paid_at?: string | null;
  created_at: string;
};

export type PatientBedAllocation = {
  id: string;
  admission_id: string;
  patient_id: string;
  bed_id: string;
  allocated_at: string;
  released_at?: string | null;
  release_reason?: string | null;
  beds?: {
    bed_number: string;
    rooms?: {
      room_number: string;
      wards?: { name: string } | null;
    } | null;
  } | null;
};

export type TimelineEvent = {
  id: string;
  type:
    | "registration"
    | "admission"
    | "bed_allocation"
    | "appointment"
    | "encounter"
    | "vitals"
    | "diagnosis"
    | "treatment_plan"
    | "prescription"
    | "lab"
    | "invoice"
    | "payment";
  title: string;
  description: string;
  date: string;
  status?: string;
};

export type PatientProfile = {
  patient: PatientRecord;
  emergency_contacts: EmergencyContact[];
  insurance: PatientInsurance[];
  admissions: PatientAdmission[];
  appointments: PatientAppointment[];
  clinical_encounters: EncounterRecord[];
  vitals: VitalsRecord[];
  diagnoses: DiagnosisRecord[];
  treatment_plans: TreatmentPlanRecord[];
  prescriptions: PatientPrescription[];
  lab_orders: PatientLabOrder[];
  invoices: PatientInvoice[];
  timeline: TimelineEvent[];
};

function normalizePatient(patient: PatientRecord): PatientRecord {
  const activeAdmission = patient.admissions?.some((admission) => admission.status === "admitted");
  return {
    ...patient,
    country: patient.country ?? "United States",
    computed_status: patient.deleted_at ? "inactive" : activeAdmission ? "admitted" : "active"
  };
}

function nextMrn() {
  return `MRN-2026-${Date.now().toString().slice(-4)}`;
}

function patientPayload(hospitalId: string, values: PatientFormValues) {
  return {
    hospital_id: hospitalId,
    mrn: values.mrn || nextMrn(),
    first_name: values.first_name,
    last_name: values.last_name,
    date_of_birth: values.date_of_birth,
    gender: values.gender,
    blood_group: values.blood_group || "unknown",
    phone: values.phone || null,
    email: values.email || null,
    address_line1: values.address_line1 || null,
    address_line2: values.address_line2 || null,
    city: values.city || null,
    state: values.state || null,
    postal_code: values.postal_code || null,
    country: values.country || "United States",
    allergies: values.allergies || null,
    chronic_conditions: values.chronic_conditions || null,
    notes: values.notes || null
  };
}

function buildTimeline(profile: Omit<PatientProfile, "timeline">): TimelineEvent[] {
  return [
    {
      id: `registration-${profile.patient.id}`,
      type: "registration" as const,
      title: "Patient registered",
      description: `MRN ${profile.patient.mrn}`,
      date: profile.patient.created_at,
      status: profile.patient.computed_status
    },
    ...profile.admissions.map((admission) => ({
      id: `admission-${admission.id}`,
      type: "admission" as const,
      title: "Admission",
      description: admission.reason ?? admission.diagnosis_summary ?? "Patient admitted",
      date: admission.admission_datetime ?? admission.created_at ?? new Date().toISOString(),
      status: admission.status
    })),
    ...profile.admissions.flatMap((admission) =>
      (admission.bed_allocations ?? []).map((allocation) => ({
        id: `bed-allocation-${allocation.id}`,
        type: "bed_allocation" as const,
        title: allocation.released_at ? "Bed released" : "Bed allocated",
        description: [
          allocation.beds?.rooms?.wards?.name,
          allocation.beds?.rooms?.room_number,
          allocation.beds?.bed_number ? `Bed ${allocation.beds.bed_number}` : allocation.bed_id
        ].filter(Boolean).join(" / "),
        date: allocation.released_at ?? allocation.allocated_at,
        status: allocation.released_at ? "released" : "active"
      }))
    ),
    ...profile.appointments.map((appointment) => ({
      id: `appointment-${appointment.id}`,
      type: "appointment" as const,
      title: "Appointment",
      description: appointment.reason ?? "Scheduled consultation",
      date: appointment.scheduled_start ?? appointment.created_at ?? new Date().toISOString(),
      status: appointment.status
    })),
    ...profile.clinical_encounters.map((encounter) => ({
      id: `encounter-${encounter.id}`,
      type: "encounter" as const,
      title: "Clinical encounter",
      description: encounter.chief_complaint ?? encounter.encounter_type,
      date: encounter.started_at,
      status: encounter.status
    })),
    ...profile.vitals.map((vital) => ({
      id: `vitals-${vital.id}`,
      type: "vitals" as const,
      title: "Vitals recorded",
      description: `BP ${vital.blood_pressure_systolic ?? "-"} / ${vital.blood_pressure_diastolic ?? "-"}, pulse ${vital.pulse ?? "-"}`,
      date: vital.recorded_at,
      status: "recorded"
    })),
    ...profile.diagnoses.map((diagnosis) => ({
      id: `diagnosis-${diagnosis.id}`,
      type: "diagnosis" as const,
      title: diagnosis.is_primary ? "Primary diagnosis" : "Diagnosis",
      description: diagnosis.diagnosis_name,
      date: diagnosis.created_at,
      status: diagnosis.diagnosis_code ?? undefined
    })),
    ...profile.treatment_plans.map((plan) => ({
      id: `treatment-plan-${plan.id}`,
      type: "treatment_plan" as const,
      title: "Treatment plan",
      description: plan.plan_title,
      date: plan.created_at,
      status: plan.status
    })),
    ...profile.prescriptions.map((prescription) => ({
      id: `prescription-${prescription.id}`,
      type: "prescription" as const,
      title: "Prescription",
      description: prescription.notes ?? `${prescription.prescription_items?.length ?? 0} medication item(s)`,
      date: prescription.prescribed_at,
      status: prescription.status
    })),
    ...profile.lab_orders.map((order) => ({
      id: `lab-${order.id}`,
      type: "lab" as const,
      title: "Lab order",
      description: `${order.priority} priority - ${order.lab_order_items?.length ?? 0} test(s)`,
      date: order.ordered_at,
      status: order.status
    })),
    ...profile.invoices.map((invoice) => ({
      id: `invoice-${invoice.id}`,
      type: "invoice" as const,
      title: "Invoice",
      description: invoice.invoice_number ?? "Patient invoice",
      date: invoice.issued_at ?? invoice.created_at ?? new Date().toISOString(),
      status: invoice.status
    })),
    ...profile.invoices.flatMap((invoice) =>
      (invoice.payments ?? []).map((payment) => ({
        id: `payment-${payment.id}`,
        type: "payment" as const,
        title: "Payment received",
        description: `${payment.payment_method} payment`,
        date: payment.paid_at ?? payment.created_at,
        status: payment.payment_status
      }))
    )
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function getMockProfile(patientId: string): PatientProfile | null {
  const patient = patients.find((record) => record.id === patientId);
  if (!patient) return null;
  const hospitalId = patient.hospital_id;

  const patientAdmissions = admissions.filter((admission) => admission.patient_id === patientId);
  const patientAppointments = appointments.filter((appointment) => appointment.patient_id === patientId);
  const patientInvoices: PatientInvoice[] = invoices
    .filter((invoice) => invoice.patient_id === patientId)
    .map((invoice) => ({
      ...invoice,
      payments: invoice.status === "paid" || invoice.status === "partially_paid"
        ? [{
            id: `pay-${invoice.id}`,
            invoice_id: invoice.id,
            amount: invoice.status === "paid" ? (invoice.total_amount ?? 0) : Math.round((invoice.total_amount ?? 0) / 2),
            payment_method: "card",
            payment_status: "completed",
            paid_at: invoice.issued_at,
            created_at: invoice.created_at
          }]
        : []
    }));
  const clinical_encounters: EncounterRecord[] = [
    {
      id: "enc-1001",
      hospital_id: hospitalId,
      patient_id: patientId,
      appointment_id: patientAppointments[0]?.id,
      encounter_type: "outpatient",
      chief_complaint: "Chest pain follow-up and medication review",
      notes: "Symptoms improved. Patient stable.",
      status: "in_progress",
      started_at: subDays(new Date(), 1).toISOString(),
      created_at: subDays(new Date(), 1).toISOString()
    }
  ];
  const vitals: VitalsRecord[] = [
    {
      id: "vitals-1001",
      hospital_id: hospitalId,
      patient_id: patientId,
      encounter_id: "enc-1001",
      temperature_c: 37.1,
      blood_pressure_systolic: 124,
      blood_pressure_diastolic: 78,
      pulse: 82,
      respiratory_rate: 16,
      oxygen_saturation: 98,
      pain_score: 2,
      recorded_at: subDays(new Date(), 1).toISOString(),
      created_at: subDays(new Date(), 1).toISOString()
    }
  ];
  const diagnoses: DiagnosisRecord[] = [
    {
      id: "dx-1001",
      hospital_id: hospitalId,
      patient_id: patientId,
      encounter_id: "enc-1001",
      diagnosis_code: "I10",
      diagnosis_name: "Essential hypertension",
      description: "Stable on current medication regimen.",
      is_primary: true,
      created_at: subDays(new Date(), 1).toISOString()
    }
  ];
  const treatment_plans: TreatmentPlanRecord[] = [
    {
      id: "plan-1001",
      hospital_id: hospitalId,
      patient_id: patientId,
      encounter_id: "enc-1001",
      plan_title: "Cardiology follow-up plan",
      plan_details: "Continue medication and repeat labs.",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: null,
      status: "active",
      created_at: subDays(new Date(), 1).toISOString()
    }
  ];
  const emergency_contacts: EmergencyContact[] = [
    {
      id: "ec-1001",
      patient_id: patientId,
      full_name: "Jordan Bennett",
      relationship: "Spouse",
      phone: "+1 212 555 0199",
      email: "jordan.bennett@example.com",
      address: "144 Hudson St, New York, NY",
      is_primary: true,
      created_at: subDays(new Date(), 14).toISOString()
    }
  ];
  const insurance: PatientInsurance[] = [
    {
      id: "ins-1001",
      patient_id: patientId,
      policy_number: "UHC-88421093",
      group_number: "NYC-EMP-42",
      subscriber_name: `${patient.first_name} ${patient.last_name}`,
      relationship_to_patient: "self",
      valid_from: "2026-01-01",
      valid_until: "2026-12-31",
      is_primary: true,
      insurance_providers: {
        id: "payer-uhc",
        name: "United Healthcare",
        payer_code: "UHC-NY",
        phone: "+1 800 555 1200"
      }
    }
  ];
  const prescriptions: PatientPrescription[] = [
    {
      id: "rx-1001",
      patient_id: patientId,
      status: "active",
      prescribed_at: subDays(new Date(), 1).toISOString(),
      notes: "Continue medication and review in 14 days.",
      prescription_items: [
        {
          id: "rxi-1001",
          dosage: "20 mg",
          frequency: "Once daily",
          duration: "30 days",
          route: "Oral",
          instructions: "Take in the evening.",
          quantity: 30,
          medications: { name: "Atorvastatin", strength: "20 mg", dosage_form: "Tablet" }
        }
      ]
    }
  ];
  const lab_orders: PatientLabOrder[] = [
    {
      id: "lab-1001",
      patient_id: patientId,
      status: "processing",
      priority: "routine",
      ordered_at: subDays(new Date(), 2).toISOString(),
      completed_at: null,
      notes: "Baseline metabolic review.",
      lab_order_items: [
        {
          id: "labi-1001",
          result_status: "pending",
          lab_tests: { test_name: "Complete Blood Count", test_code: "CBC", category: "Hematology" }
        },
        {
          id: "labi-1002",
          result_status: "pending",
          lab_tests: { test_name: "Basic Metabolic Panel", test_code: "BMP", category: "Chemistry" }
        }
      ]
    }
  ];
  const profile = {
    patient: normalizePatient({ ...patient, admissions: patientAdmissions }),
    emergency_contacts,
    insurance,
    admissions: patientAdmissions,
    appointments: patientAppointments,
    clinical_encounters,
    vitals,
    diagnoses,
    treatment_plans,
    prescriptions,
    lab_orders,
    invoices: patientInvoices
  };

  return { ...profile, timeline: buildTimeline(profile) };
}

export async function listPatients(hospitalId?: string | null): Promise<PatientRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) {
    return patients.map((patient) =>
      normalizePatient({
        ...patient,
        admissions: admissions.filter((admission) => admission.patient_id === patient.id)
      })
    );
  }

  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<PatientRecord>("patients")
    .select("*, admissions(id,status,admission_datetime,discharge_datetime,reason)")
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(normalizePatient);
}

export async function getPatient(patientId: string, hospitalId?: string | null): Promise<PatientRecord | null> {
  const profile = await getPatientProfile(patientId, hospitalId);
  return profile?.patient ?? null;
}

export async function getPatientProfile(patientId: string, hospitalId?: string | null): Promise<PatientProfile | null> {
  if (!hasSupabaseEnv() || !hospitalId) return getMockProfile(patientId);

  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<
      PatientRecord & {
        emergency_contacts?: EmergencyContact[];
        patient_insurance?: PatientInsurance[];
        appointments?: PatientAppointment[];
        clinical_encounters?: EncounterRecord[];
        vitals?: VitalsRecord[];
        diagnoses?: DiagnosisRecord[];
        treatment_plans?: TreatmentPlanRecord[];
        prescriptions?: PatientPrescription[];
        lab_orders?: PatientLabOrder[];
        invoices?: PatientInvoice[];
      }
    >("patients")
    .select(`
      *,
      emergency_contacts(*),
      patient_insurance(*, insurance_providers(*)),
      admissions(*, bed_allocations(*, beds(bed_number, rooms(room_number, wards(name))))),
      appointments(*),
      clinical_encounters(*),
      vitals(*),
      diagnoses(*),
      treatment_plans(*),
      prescriptions(*, prescription_items(*, medications(*))),
      lab_orders(*, lab_order_items(*, lab_tests(*))),
      invoices(*, payments(*))
    `)
    .eq("hospital_id", hospitalId)
    .eq("id", patientId)
    .is("deleted_at", null)
    .limit(1);

  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;

  const profile = {
    patient: normalizePatient(row),
    emergency_contacts: row.emergency_contacts ?? [],
    insurance: row.patient_insurance ?? [],
    admissions: row.admissions ?? [],
    appointments: row.appointments ?? [],
    clinical_encounters: row.clinical_encounters ?? [],
    vitals: row.vitals ?? [],
    diagnoses: row.diagnoses ?? [],
    treatment_plans: row.treatment_plans ?? [],
    prescriptions: row.prescriptions ?? [],
    lab_orders: row.lab_orders ?? [],
    invoices: row.invoices ?? []
  };

  return { ...profile, timeline: buildTimeline(profile) };
}

export async function createPatient(hospitalId: string, values: PatientFormValues) {
  const parsed = patientSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the patient details.", patient: null };
  }

  if (!hasSupabaseEnv()) {
    return { ok: true, message: "Patient validated. Connect Supabase to persist records.", patient: null };
  }

  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = patientPayload(hospitalId, parsed.data);
  const { error } = await supabase.from("patients").insert(payload);

  if (error) return { ok: false, message: error.message, patient: null };

  await supabase.from("audit_logs").insert({
    hospital_id: hospitalId,
    action: "patient.created",
    entity_type: "patient",
    new_values: payload
  });

  return { ok: true, message: "Patient registered successfully.", patient: null };
}

export async function updatePatient(patientId: string, hospitalId: string, values: PatientFormValues) {
  const parsed = patientSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the patient details." };
  }

  if (!hasSupabaseEnv()) {
    return { ok: true, message: "Patient changes validated. Connect Supabase to persist updates." };
  }

  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = {
    ...patientPayload(hospitalId, parsed.data),
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase
    .from("patients")
    .update(payload)
    .eq("hospital_id", hospitalId)
    .eq("id", patientId)
    .is("deleted_at", null);

  if (error) return { ok: false, message: error.message };

  await supabase.from("audit_logs").insert({
    hospital_id: hospitalId,
    action: "patient.updated",
    entity_type: "patient",
    entity_id: patientId,
    new_values: payload
  });

  return { ok: true, message: "Patient updated successfully." };
}

export async function softDeletePatient(patientId: string, hospitalId: string) {
  if (!hasSupabaseEnv()) {
    return { ok: true, message: "Patient deletion validated. Connect Supabase to persist updates." };
  }

  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = { deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const { error } = await supabase
    .from("patients")
    .update(payload)
    .eq("hospital_id", hospitalId)
    .eq("id", patientId)
    .is("deleted_at", null);

  if (error) return { ok: false, message: error.message };

  await supabase.from("audit_logs").insert({
    hospital_id: hospitalId,
    action: "patient.deleted",
    entity_type: "patient",
    entity_id: patientId,
    new_values: payload
  });

  return { ok: true, message: "Patient archived successfully." };
}

export const patientFollowUpDate = addDays(new Date(), 14);
