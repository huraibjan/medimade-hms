import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { getPatientProfile, softDeletePatient, updatePatient } from "@/lib/services/patients";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { patientSchema } from "@/lib/validations/patient";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("patients:read");
    const data = await getPatientProfile(id, hospitalId);
    if (!data) return apiError("Patient not found", 404);

    return apiSuccess(data);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("patients:manage");
    const body = await request.json();
    const parsed = patientSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

    const result = await updatePatient(id, hospitalId, parsed.data);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("patients:manage");
    const result = await softDeletePatient(id, hospitalId);

    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
