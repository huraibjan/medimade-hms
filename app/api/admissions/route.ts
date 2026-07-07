import { applyListParams, parseListParams } from "@/lib/api/list";
import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { admitPatient, listAdmissions } from "@/lib/services/admissions";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { admissionSchema } from "@/lib/validations/admission";

export async function GET(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext("admissions:read");
    const rows = await listAdmissions(hospitalId);
    const params = parseListParams(request, ["status", "department_id", "patient_id"]);
    const data = applyListParams(rows, params, {
      searchFields: ["patient.mrn", "patient.first_name", "patient.last_name", "reason", "diagnosis_summary"],
      sortFields: ["admission_datetime", "status", "created_at"],
      defaultSort: "admission_datetime"
    });

    return apiSuccess(data.items, { meta: data });
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function POST(request: Request) {
  try {
    const { hospitalId, profile } = await requireServiceContext(["admissions:create", "admissions:manage"]);
    const body = await request.json();
    const parsed = admissionSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

    const result = await admitPatient(hospitalId, parsed.data, profile.id);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
