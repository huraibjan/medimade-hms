import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { assignBedToAdmission, cancelAdmission, dischargeAdmission, getAdmission, transferAdmissionBed } from "@/lib/services/admissions";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("admissions:read");
    const data = await getAdmission(id, hospitalId);
    if (!data) return apiError("Admission not found", 404);

    return apiSuccess(data);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId, profile } = await requireServiceContext("admissions:manage");
    const body = await request.json();
    if (body.action === "assign_bed") {
      const result = await assignBedToAdmission({ admission_id: id, patient_id: body.patient_id, bed_id: body.bed_id }, hospitalId, profile.id);
      return apiServiceResult(result);
    }
    if (body.action === "transfer_bed") {
      const result = await transferAdmissionBed(id, body.patient_id, body.from_bed_id, body.to_bed_id, hospitalId, profile.id);
      return apiServiceResult(result);
    }
    if (body.action === "discharge") {
      const result = await dischargeAdmission({ admission_id: id, discharge_datetime: body.discharge_datetime, release_reason: body.release_reason }, hospitalId, profile.id);
      return apiServiceResult(result);
    }

    return apiError("Unsupported admission action", 400);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId, profile } = await requireServiceContext("admissions:manage");
    const result = await cancelAdmission(id, hospitalId, profile.id);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
