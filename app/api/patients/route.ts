import { applyListParams, parseListParams } from "@/lib/api/list";
import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { createPatient, listPatients } from "@/lib/services/patient-service";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { patientSchema } from "@/lib/validations/patient";

export async function GET(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext("patients:read");
    const rows = await listPatients(hospitalId);
    const params = parseListParams(request, ["gender", "blood_group", "city", "status"]);
    const data = applyListParams(rows, params, {
      searchFields: ["mrn", "first_name", "last_name", "phone", "email"],
      filterFields: { status: "computed_status" },
      sortFields: ["created_at", "last_name", "mrn"],
      defaultSort: "created_at"
    });

    return apiSuccess(data.items, { meta: data });
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function POST(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext("patients:manage");
    const body = await request.json();
    const parsed = patientSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

    const result = await createPatient(hospitalId, parsed.data);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
