import { randomUUID } from "crypto";
import { addHours, isSameDay, subHours } from "date-fns";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";
import { appointmentSchema, appointmentStatusSchema, type AppointmentInput, type AppointmentStatusValue } from "@/lib/validations/appointment";
import { appointments as mockAppointments, patients } from "./mock-data";
import { writeAuditLog } from "./service-context";
import type { UserRole } from "@/types/database";

export type AppointmentRecord = {
  id: string;
  hospital_id: string;
  patient_id: string;
  doctor_id: string;
  department_id?: string | null;
  scheduled_start: string;
  scheduled_end: string;
  reason?: string | null;
  status: AppointmentStatusValue;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  patient?: {
    id: string;
    mrn: string;
    first_name: string;
    last_name: string;
    phone?: string | null;
    email?: string | null;
  } | null;
  doctor?: {
    id: string;
    full_name: string;
    specialization?: string | null;
  } | null;
  department?: {
    id: string;
    name: string;
  } | null;
  clinical_encounters?: Array<{
    id: string;
    status: string;
    started_at: string;
  }>;
};

export type AppointmentOption = { id: string; label: string };
export type AppointmentOptions = {
  patients: AppointmentOption[];
  doctors: AppointmentOption[];
  departments: AppointmentOption[];
};

const mockDoctors: AppointmentOption[] = [
  { id: "s-2001", label: "Dr. Daniel Chen" },
  { id: "doctor-patel", label: "Dr. Serena Patel" },
  { id: "doctor-morgan", label: "Dr. Avery Morgan" }
];

const mockDepartments: AppointmentOption[] = [
  { id: "d-emergency", label: "Emergency" },
  { id: "d-cardiology", label: "Cardiology" },
  { id: "d-neurology", label: "Neurology" },
  { id: "d-orthopedics", label: "Orthopedics" },
  { id: "d-pediatrics", label: "Pediatrics" }
];

function normalizeAppointment(row: Partial<AppointmentRecord>): AppointmentRecord {
  const joinedPatient = (row as Partial<AppointmentRecord> & { patients?: AppointmentRecord["patient"] }).patients;
  const joinedDepartment = (row as Partial<AppointmentRecord> & { departments?: AppointmentRecord["department"] }).departments;
  const joinedDoctor = (row as Partial<AppointmentRecord> & { doctors?: { id: string; specialization?: string | null; staff?: { profiles?: { full_name?: string } | null } | null } | null }).doctors;
  const patient = patients.find((item) => item.id === row.patient_id);
  const doctor = mockDoctors.find((item) => item.id === row.doctor_id);
  const department = mockDepartments.find((item) => item.id === row.department_id);
  return {
    id: row.id ?? randomUUID(),
    hospital_id: row.hospital_id ?? DEFAULT_HOSPITAL_ID,
    patient_id: row.patient_id ?? "",
    doctor_id: row.doctor_id ?? "",
    department_id: row.department_id ?? null,
    scheduled_start: row.scheduled_start ?? new Date().toISOString(),
    scheduled_end: row.scheduled_end ?? addHours(new Date(), 1).toISOString(),
    reason: row.reason ?? null,
    status: row.status ?? "scheduled",
    notes: row.notes ?? null,
    created_by: row.created_by ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at,
    cancelled_at: row.cancelled_at ?? null,
    cancellation_reason: row.cancellation_reason ?? null,
    patient: row.patient ?? joinedPatient ?? (patient ? {
      id: patient.id,
      mrn: patient.mrn,
      first_name: patient.first_name,
      last_name: patient.last_name,
      phone: patient.phone,
      email: patient.email
    } : null),
    doctor: row.doctor ?? (joinedDoctor ? {
      id: joinedDoctor.id,
      full_name: joinedDoctor.staff?.profiles?.full_name ?? "Doctor",
      specialization: joinedDoctor.specialization ?? null
    } : doctor ? { id: doctor.id, full_name: doctor.label.replace(/^Dr\.?\s?/, "Dr. ") } : null),
    department: row.department ?? joinedDepartment ?? (department ? { id: department.id, name: department.label } : null),
    clinical_encounters: row.clinical_encounters ?? []
  };
}

function mockRows() {
  const now = new Date();
  return [
    ...mockAppointments.map((appointment) => normalizeAppointment(appointment as Partial<AppointmentRecord>)),
    normalizeAppointment({
      id: "appt-9001",
      hospital_id: DEFAULT_HOSPITAL_ID,
      patient_id: "p-1001",
      doctor_id: "s-2001",
      department_id: "d-cardiology",
      scheduled_start: subHours(now, 2).toISOString(),
      scheduled_end: subHours(now, 1).toISOString(),
      status: "completed",
      reason: "Post-operative review",
      created_at: subHours(now, 30).toISOString()
    }),
    normalizeAppointment({
      id: "appt-9002",
      hospital_id: DEFAULT_HOSPITAL_ID,
      patient_id: "p-1003",
      doctor_id: "doctor-patel",
      department_id: "d-neurology",
      scheduled_start: addHours(now, 3).toISOString(),
      scheduled_end: addHours(now, 4).toISOString(),
      status: "scheduled",
      reason: "Headache evaluation",
      created_at: subHours(now, 5).toISOString()
    })
  ];
}

function canCreateAppointment(role?: UserRole | null) {
  return role === "super_admin" || role === "hospital_admin" || role === "receptionist";
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart);
}

async function hasDoctorOverlap(hospitalId: string, doctorId: string, start: string, end: string, excludeId?: string) {
  const rows = await listAppointments(hospitalId);
  return rows.some((appointment) =>
    appointment.doctor_id === doctorId &&
    appointment.id !== excludeId &&
    !["cancelled", "no_show"].includes(appointment.status) &&
    overlaps(start, end, appointment.scheduled_start, appointment.scheduled_end)
  );
}

async function audit(hospitalId: string, action: string, entityId: string, values: Record<string, unknown>) {
  await writeAuditLog({ hospitalId, action, entityType: "appointment", entityId, values });
}

async function getDoctorIdForProfile(hospitalId: string, profileId: string): Promise<string | null> {
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data: staffRows } = await supabase
    .from<{ id: string }>("staff")
    .select("id")
    .eq("hospital_id", hospitalId)
    .eq("profile_id", profileId)
    .limit(1);
  const staffId = staffRows?.[0]?.id;
  if (!staffId) return null;
  const { data: doctorRows } = await supabase
    .from<{ id: string }>("doctors")
    .select("id")
    .eq("staff_id", staffId)
    .limit(1);
  return doctorRows?.[0]?.id ?? null;
}

export async function listAppointments(hospitalId?: string | null, role?: UserRole | null, profileId?: string | null): Promise<AppointmentRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockRows().sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());

  const supabase = asQueryClient(await createServerSupabaseClient());
  let query = supabase
    .from<AppointmentRecord>("appointments")
    .select("*, patients(id,mrn,first_name,last_name,phone,email), doctors(id, specialization, staff(profiles(full_name))), departments(id,name), clinical_encounters(id,status,started_at)")
    .eq("hospital_id", hospitalId)
    .order("scheduled_start", { ascending: true });

  if (role === "doctor" && profileId) {
    const doctorId = await getDoctorIdForProfile(hospitalId, profileId);
    if (!doctorId) return [];
    query = query.eq("doctor_id", doctorId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(normalizeAppointment);
}

export async function getAppointment(id: string, hospitalId?: string | null) {
  const rows = await listAppointments(hospitalId);
  return rows.find((appointment) => appointment.id === id) ?? null;
}

export async function getAppointmentOptions(hospitalId?: string | null): Promise<AppointmentOptions> {
  if (!hasSupabaseEnv() || !hospitalId) {
    return {
      patients: patients.map((patient) => ({ id: patient.id, label: `${patient.mrn} - ${patient.first_name} ${patient.last_name}` })),
      doctors: mockDoctors,
      departments: mockDepartments
    };
  }

  const supabase = asQueryClient(await createServerSupabaseClient());
  const [patientRows, doctorRows, departmentRows] = await Promise.all([
    supabase.from<{ id: string; mrn: string; first_name: string; last_name: string }>("patients").select("id,mrn,first_name,last_name").eq("hospital_id", hospitalId).is("deleted_at", null).order("last_name"),
    supabase.from<{ id: string; specialization?: string | null; staff?: { profiles?: { full_name?: string } | null } | null }>("doctors").select("id, specialization, staff!inner(hospital_id, profiles(full_name))").eq("staff.hospital_id", hospitalId),
    supabase.from<{ id: string; name: string }>("departments").select("id,name").eq("hospital_id", hospitalId).order("name")
  ]);

  return {
    patients: (patientRows.data ?? []).map((patient) => ({ id: patient.id, label: `${patient.mrn} - ${patient.first_name} ${patient.last_name}` })),
    doctors: (doctorRows.data ?? []).map((doctor) => ({ id: doctor.id, label: doctor.staff?.profiles?.full_name ?? "Doctor" })),
    departments: (departmentRows.data ?? []).map((department) => ({ id: department.id, label: department.name }))
  };
}

export async function createAppointment(hospitalId: string, values: AppointmentInput, actorProfileId?: string | null, actorRole?: UserRole | null) {
  if (!canCreateAppointment(actorRole)) return { ok: false, message: "Only receptionists and hospital administrators can create appointments." };
  const parsed = appointmentSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix appointment details." };

  if (await hasDoctorOverlap(hospitalId, parsed.data.doctor_id, parsed.data.scheduled_start, parsed.data.scheduled_end)) {
    return { ok: false, message: "Doctor already has an appointment during that time." };
  }

  if (!hasSupabaseEnv()) return { ok: true, message: "Appointment validated. Connect Supabase to persist records." };

  const supabase = asQueryClient(await createServerSupabaseClient());
  const appointmentId = randomUUID();
  const payload = { id: appointmentId, hospital_id: hospitalId, ...parsed.data, status: "scheduled", created_by: actorProfileId ?? null };
  const { error } = await supabase.from("appointments").insert(payload);
  if (error) return { ok: false, message: error.message };
  await audit(hospitalId, "appointment.created", appointmentId, payload);
  return { ok: true, message: "Appointment scheduled successfully.", appointmentId };
}

export async function updateAppointment(id: string, hospitalId: string, values: AppointmentInput, actorRole?: UserRole | null) {
  if (!canCreateAppointment(actorRole)) return { ok: false, message: "Only receptionists and hospital administrators can edit appointments." };
  const parsed = appointmentSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix appointment details." };

  if (await hasDoctorOverlap(hospitalId, parsed.data.doctor_id, parsed.data.scheduled_start, parsed.data.scheduled_end, id)) {
    return { ok: false, message: "Doctor already has an appointment during that time." };
  }

  if (!hasSupabaseEnv()) return { ok: true, message: "Appointment changes validated. Connect Supabase to persist records." };

  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = { ...parsed.data, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("appointments").update(payload).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await audit(hospitalId, "appointment.updated", id, payload);
  return { ok: true, message: "Appointment updated successfully." };
}

export async function updateAppointmentStatus(
  id: string,
  hospitalId: string,
  values: { status: AppointmentStatusValue; cancellation_reason?: string; create_encounter?: boolean },
  actorProfileId?: string | null
) {
  const parsed = appointmentStatusSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Invalid appointment status." };
  const appointment = await getAppointment(id, hospitalId);
  if (!appointment) return { ok: false, message: "Appointment not found." };

  if (!hasSupabaseEnv()) return { ok: true, message: "Appointment status validated. Connect Supabase to persist records." };

  const supabase = asQueryClient(await createServerSupabaseClient());
  const now = new Date().toISOString();
  const payload = {
    status: parsed.data.status,
    updated_at: now,
    cancelled_at: parsed.data.status === "cancelled" ? now : null,
    cancellation_reason: parsed.data.status === "cancelled" ? parsed.data.cancellation_reason ?? "Cancelled" : null
  };
  const { error } = await supabase.from("appointments").update(payload).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };

  if (parsed.data.create_encounter || parsed.data.status === "in_progress") {
    const encounterId = randomUUID();
    await supabase.from("clinical_encounters").insert({
      id: encounterId,
      hospital_id: hospitalId,
      patient_id: appointment.patient_id,
      appointment_id: appointment.id,
      doctor_id: appointment.doctor_id,
      encounter_type: "outpatient",
      chief_complaint: appointment.reason,
      status: "in_progress",
      started_at: now
    });
  }

  await audit(hospitalId, `appointment.${parsed.data.status}`, id, { ...payload, actorProfileId });
  return { ok: true, message: "Appointment status updated." };
}

export function getTodayAppointments(rows: AppointmentRecord[], day = new Date()) {
  return rows.filter((appointment) => isSameDay(new Date(appointment.scheduled_start), day));
}
