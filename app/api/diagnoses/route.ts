import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { addDiagnosis, listDiagnoses } from "@/lib/services/diagnosis";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { diagnosisSchema } from "@/lib/validations/clinical";

export async function GET(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext("patients:read");
    const patientId = new URL(request.url).searchParams.get("patient_id");
    if (!patientId) return apiError("patient_id is required", 400);
    const data = await listDiagnoses(patientId, hospitalId);
    return apiSuccess(data);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function POST(request: Request) {
  try {
    const { hospitalId, profile } = await requireServiceContext("clinical:manage");
    const body = await request.json();
    const parsed = diagnosisSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());
    const result = await addDiagnosis(hospitalId, parsed.data, profile.id);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
