import { applyListParams, parseListParams } from "@/lib/api/list";
import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { createLabOrder, listLabOrders } from "@/lib/services/lab";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { labOrderSchema } from "@/lib/validations/lab";

export async function GET(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext(["lab:read", "lab:manage"]);
    const rows = await listLabOrders(hospitalId);
    const params = parseListParams(request, ["status", "priority", "patient_id", "doctor_id"]);
    const data = applyListParams(rows, params, {
      searchFields: ["id", "patients.mrn", "patients.first_name", "patients.last_name", "doctors.staff.profiles.full_name"],
      sortFields: ["ordered_at", "status", "priority"],
      defaultSort: "ordered_at"
    });

    return apiSuccess(data.items, { meta: data });
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function POST(request: Request) {
  try {
    const { hospitalId, profile } = await requireServiceContext(["lab:order", "lab:manage"]);
    const body = await request.json();
    const parsed = labOrderSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

    const result = await createLabOrder(hospitalId, parsed.data, profile.id);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
