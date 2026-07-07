import { randomUUID } from "crypto";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";
import { admissionSchema, bedAssignmentSchema, dischargeSchema, type AdmissionInput } from "@/lib/validations/admission";
import { admissions as mockAdmissions, patients } from "./mock-data";
import { getBed, listAvailableBeds, type BedRecord } from "./rooms";
import { writeAuditLog } from "./service-context";

export type AdmissionStatus = "admitted" | "transferred" | "discharged" | "cancelled";

export type AdmissionRecord = {
  id: string;
  hospital_id: string;
  patient_id: string;
  admitting_doctor_id?: string | null;
  attending_doctor_id?: string | null;
  department_id?: string | null;
  admission_datetime?: string;
  admitted_at?: string;
  expected_discharge_datetime?: string | null;
  discharge_datetime?: string | null;
  discharged_at?: string | null;
  reason: string;
  diagnosis_summary?: string | null;
  status: AdmissionStatus;
  created_by?: string | null;
  created_at: string;
  updated_at?: string;
  patient?: {
    id: string;
    mrn: string;
    first_name: string;
    last_name: string;
    phone?: string | null;
  } | null;
  bed_allocations?: BedAllocationRecord[];
};

export type BedAllocationRecord = {
  id: string;
  hospital_id: string;
  admission_id: string;
  patient_id: string;
  bed_id: string;
  allocated_at: string;
  released_at?: string | null;
  allocated_by?: string | null;
  release_reason?: string | null;
  beds?: BedRecord | null;
};

export type AdmissionOption = { id: string; label: string };

export type AdmissionOptions = {
  patients: AdmissionOption[];
  doctors: AdmissionOption[];
  departments: AdmissionOption[];
  availableBeds: BedRecord[];
};

const mockDoctors: AdmissionOption[] = [
  { id: "doctor-chen", label: "Dr. Daniel Chen" },
  { id: "doctor-patel", label: "Dr. Serena Patel" },
  { id: "doctor-morgan", label: "Dr. Avery Morgan" }
];

const mockDepartments: AdmissionOption[] = [
  { id: "dept-emergency", label: "Emergency" },
  { id: "dept-cardiology", label: "Cardiology" },
  { id: "dept-neurology", label: "Neurology" },
  { id: "dept-orthopedics", label: "Orthopedics" }
];

const mockAllocations: BedAllocationRecord[] = [
  {
    id: "alloc-1001",
    hospital_id: DEFAULT_HOSPITAL_ID,
    admission_id: "ad-4001",
    patient_id: "p-1001",
    bed_id: "bed-icu-301-a",
    allocated_at: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
    released_at: null
  }
];

function normalizeAdmission(admission: AdmissionRecord): AdmissionRecord {
  const patient = patients.find((item) => item.id === admission.patient_id);
  return {
    ...admission,
    admission_datetime: admission.admission_datetime ?? admission.admitted_at ?? admission.created_at,
    discharge_datetime: admission.discharge_datetime ?? admission.discharged_at ?? null,
    patient: admission.patient ?? (patient ? {
      id: patient.id,
      mrn: patient.mrn,
      first_name: patient.first_name,
      last_name: patient.last_name,
      phone: patient.phone
    } : null)
  };
}

function mockAdmissionRows(): AdmissionRecord[] {
  return mockAdmissions.map((admission) =>
    normalizeAdmission({
      ...admission,
      status: admission.status === "transferred" ? "transferred" : admission.status,
      bed_allocations: mockAllocations.filter((allocation) => allocation.admission_id === admission.id)
    } as AdmissionRecord)
  );
}

async function audit(hospitalId: string, action: string, entityId: string, values: Record<string, unknown>) {
  await writeAuditLog({ hospitalId, action, entityType: "admission", entityId, values });
}

export async function listAdmissions(hospitalId?: string | null): Promise<AdmissionRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockAdmissionRows();

  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<AdmissionRecord>("admissions")
    .select("*, patients(id,mrn,first_name,last_name,phone), bed_allocations(*, beds(*, rooms(room_number,room_type,wards(name,floor))))")
    .eq("hospital_id", hospitalId)
    .order("admission_datetime", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizeAdmission);
}

export async function getAdmission(id: string, hospitalId?: string | null): Promise<AdmissionRecord | null> {
  const admissions = await listAdmissions(hospitalId);
  return admissions.find((admission) => admission.id === id) ?? null;
}

export async function getAdmissionOptions(hospitalId?: string | null): Promise<AdmissionOptions> {
  if (!hasSupabaseEnv() || !hospitalId) {
    return {
      patients: patients.map((patient) => ({ id: patient.id, label: `${patient.mrn} - ${patient.first_name} ${patient.last_name}` })),
      doctors: mockDoctors,
      departments: mockDepartments,
      availableBeds: await listAvailableBeds(hospitalId)
    };
  }

  const supabase = asQueryClient(await createServerSupabaseClient());
  const [patientRows, doctorRows, departmentRows, availableBeds] = await Promise.all([
    supabase.from<{ id: string; mrn: string; first_name: string; last_name: string }>("patients").select("id,mrn,first_name,last_name").eq("hospital_id", hospitalId).is("deleted_at", null).order("last_name"),
    supabase.from<{ id: string; staff?: { profiles?: { full_name?: string } | null } | null }>("doctors").select("id, staff!inner(hospital_id, profiles(full_name))").eq("staff.hospital_id", hospitalId),
    supabase.from<{ id: string; name: string }>("departments").select("id,name").eq("hospital_id", hospitalId).order("name"),
    listAvailableBeds(hospitalId)
  ]);

  return {
    patients: (patientRows.data ?? []).map((patient) => ({ id: patient.id, label: `${patient.mrn} - ${patient.first_name} ${patient.last_name}` })),
    doctors: (doctorRows.data ?? []).map((doctor) => ({ id: doctor.id, label: doctor.staff?.profiles?.full_name ?? "Doctor" })),
    departments: (departmentRows.data ?? []).map((department) => ({ id: department.id, label: department.name })),
    availableBeds
  };
}

export async function admitPatient(hospitalId: string, values: AdmissionInput, actorProfileId?: string | null) {
  const parsed = admissionSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix admission details." };

  if (parsed.data.bed_id) {
    const bed = await getBed(parsed.data.bed_id, hospitalId);
    if (!bed || bed.status !== "available" || bed.current_patient_id) {
      return { ok: false, message: "Selected bed is no longer available." };
    }
  }

  if (!hasSupabaseEnv()) {
    return { ok: true, message: "Admission validated. Connect Supabase to persist records." };
  }

  const supabase = asQueryClient(await createServerSupabaseClient());
  const admissionId = randomUUID();
  const now = new Date().toISOString();
  const admissionPayload = {
    id: admissionId,
    hospital_id: hospitalId,
    patient_id: parsed.data.patient_id,
    admitting_doctor_id: parsed.data.admitting_doctor_id || null,
    department_id: parsed.data.department_id || null,
    admission_datetime: parsed.data.admission_datetime || now,
    expected_discharge_datetime: parsed.data.expected_discharge_datetime || null,
    reason: parsed.data.reason,
    diagnosis_summary: parsed.data.diagnosis_summary || null,
    status: "admitted",
    created_by: actorProfileId ?? null
  };

  const admissionInsert = await supabase.from("admissions").insert(admissionPayload);
  if (admissionInsert.error) return { ok: false, message: admissionInsert.error.message };

  if (parsed.data.bed_id) {
    const assignResult = await assignBedToAdmission({
      admission_id: admissionId,
      patient_id: parsed.data.patient_id,
      bed_id: parsed.data.bed_id
    }, hospitalId, actorProfileId);
    if (!assignResult.ok) return assignResult;
  }

  await audit(hospitalId, "admission.created", admissionId, admissionPayload);
  return { ok: true, message: "Patient admitted successfully.", admissionId };
}

export async function assignBedToAdmission(
  values: { admission_id: string; patient_id: string; bed_id: string; release_current?: boolean },
  hospitalId: string,
  actorProfileId?: string | null
) {
  const parsed = bedAssignmentSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Select an available bed." };

  const bed = await getBed(parsed.data.bed_id, hospitalId);
  if (!bed || bed.status !== "available" || bed.current_patient_id) {
    return { ok: false, message: "Selected bed is no longer available." };
  }

  if (!hasSupabaseEnv()) {
    return { ok: true, message: "Bed assignment validated. Connect Supabase to persist records." };
  }

  const supabase = asQueryClient(await createServerSupabaseClient());
  const now = new Date().toISOString();

  if (parsed.data.release_current) {
    await supabase
      .from("bed_allocations")
      .update({ released_at: now, release_reason: "transfer" })
      .eq("hospital_id", hospitalId)
      .eq("admission_id", parsed.data.admission_id)
      .is("released_at", null);
  }

  const allocationId = randomUUID();
  const allocationPayload = {
    id: allocationId,
    hospital_id: hospitalId,
    admission_id: parsed.data.admission_id,
    patient_id: parsed.data.patient_id,
    bed_id: parsed.data.bed_id,
    allocated_at: now,
    allocated_by: actorProfileId ?? null
  };
  const allocationInsert = await supabase.from("bed_allocations").insert(allocationPayload);
  if (allocationInsert.error) return { ok: false, message: allocationInsert.error.message };

  const bedUpdate = await supabase
    .from("beds")
    .update({ status: "occupied", current_patient_id: parsed.data.patient_id, updated_at: now })
    .eq("hospital_id", hospitalId)
    .eq("id", parsed.data.bed_id)
    .eq("status", "available");
  if (bedUpdate.error) return { ok: false, message: bedUpdate.error.message };

  await audit(hospitalId, "bed.assigned", parsed.data.admission_id, allocationPayload);
  return { ok: true, message: "Bed assigned successfully." };
}

export async function transferAdmissionBed(
  admissionId: string,
  patientId: string,
  fromBedId: string | null | undefined,
  toBedId: string,
  hospitalId: string,
  actorProfileId?: string | null
) {
  const targetBed = await getBed(toBedId, hospitalId);
  if (!targetBed || targetBed.status !== "available" || targetBed.current_patient_id) {
    return { ok: false, message: "Transfer bed is no longer available." };
  }

  if (!hasSupabaseEnv()) return { ok: true, message: "Transfer validated. Connect Supabase to persist records." };

  const supabase = asQueryClient(await createServerSupabaseClient());
  const now = new Date().toISOString();

  if (fromBedId) {
    const release = await supabase
      .from("beds")
      .update({ status: "available", current_patient_id: null, updated_at: now })
      .eq("hospital_id", hospitalId)
      .eq("id", fromBedId);
    if (release.error) return { ok: false, message: release.error.message };
  }

  const assignment = await assignBedToAdmission({ admission_id: admissionId, patient_id: patientId, bed_id: toBedId, release_current: true }, hospitalId, actorProfileId);
  if (!assignment.ok) return assignment;

  const admissionUpdate = await supabase
    .from("admissions")
    .update({ status: "transferred", updated_at: now })
    .eq("hospital_id", hospitalId)
    .eq("id", admissionId);
  if (admissionUpdate.error) return { ok: false, message: admissionUpdate.error.message };

  await audit(hospitalId, "bed.transferred", admissionId, { fromBedId, toBedId });
  return { ok: true, message: "Patient transferred successfully." };
}

export async function dischargeAdmission(
  values: { admission_id: string; discharge_datetime?: string; release_reason?: string },
  hospitalId: string,
  actorProfileId?: string | null
) {
  const parsed = dischargeSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Invalid discharge request." };

  if (!hasSupabaseEnv()) return { ok: true, message: "Discharge validated. Connect Supabase to persist records." };

  const admission = await getAdmission(parsed.data.admission_id, hospitalId);
  const activeAllocation = admission?.bed_allocations?.find((allocation) => !allocation.released_at);
  const now = parsed.data.discharge_datetime || new Date().toISOString();
  const supabase = asQueryClient(await createServerSupabaseClient());

  const admissionUpdate = await supabase
    .from("admissions")
    .update({ status: "discharged", discharge_datetime: now, updated_at: new Date().toISOString() })
    .eq("hospital_id", hospitalId)
    .eq("id", parsed.data.admission_id);
  if (admissionUpdate.error) return { ok: false, message: admissionUpdate.error.message };

  if (activeAllocation) {
    const allocationUpdate = await supabase
      .from("bed_allocations")
      .update({ released_at: now, release_reason: parsed.data.release_reason || "discharged" })
      .eq("hospital_id", hospitalId)
      .eq("id", activeAllocation.id);
    if (allocationUpdate.error) return { ok: false, message: allocationUpdate.error.message };

    const bedUpdate = await supabase
      .from("beds")
      .update({ status: "available", current_patient_id: null, updated_at: new Date().toISOString() })
      .eq("hospital_id", hospitalId)
      .eq("id", activeAllocation.bed_id);
    if (bedUpdate.error) return { ok: false, message: bedUpdate.error.message };
  }

  await audit(hospitalId, "admission.discharged", parsed.data.admission_id, {
    discharge_datetime: now,
    release_reason: parsed.data.release_reason,
    actorProfileId
  });
  return { ok: true, message: "Patient discharged and bed released." };
}

export async function cancelAdmission(admissionId: string, hospitalId: string, actorProfileId?: string | null) {
  const admission = await getAdmission(admissionId, hospitalId);
  if (!admission) return { ok: false, message: "Admission not found." };
  if (admission.status === "discharged") return { ok: false, message: "Discharged admissions cannot be cancelled." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Admission cancellation validated. Connect Supabase to persist records." };

  const supabase = asQueryClient(await createServerSupabaseClient());
  const now = new Date().toISOString();
  const update = await supabase
    .from("admissions")
    .update({ status: "cancelled", updated_at: now })
    .eq("hospital_id", hospitalId)
    .eq("id", admissionId);
  if (update.error) return { ok: false, message: update.error.message };

  const activeAllocation = admission.bed_allocations?.find((allocation) => !allocation.released_at);
  if (activeAllocation) {
    await supabase
      .from("bed_allocations")
      .update({ released_at: now, release_reason: "cancelled" })
      .eq("hospital_id", hospitalId)
      .eq("id", activeAllocation.id);
    await supabase
      .from("beds")
      .update({ status: "available", current_patient_id: null, updated_at: now })
      .eq("hospital_id", hospitalId)
      .eq("id", activeAllocation.bed_id);
  }

  await audit(hospitalId, "admission.cancelled", admissionId, { actorProfileId });
  return { ok: true, message: "Admission cancelled." };
}
