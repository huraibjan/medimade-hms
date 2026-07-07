import { applyListParams, parseListParams } from "@/lib/api/list";
import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { createStaff, listStaff } from "@/lib/services/staff";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { staffSchema } from "@/lib/validations/staff";

export async function GET(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext("staff:manage");
    const rows = await listStaff(hospitalId);
    const params = parseListParams(request, ["role", "department_id", "status"]);
    const data = applyListParams(rows, params, {
      searchFields: ["profiles.full_name", "profiles.email", "employee_code", "job_title"],
      filterFields: { role: "profiles.role" },
      sortFields: ["created_at", "profiles.full_name", "employee_code"],
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
    const { hospitalId, profile } = await requireServiceContext("staff:manage");
    const body = await request.json();
    const parsed = staffSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());
    const result = await createStaff(hospitalId, parsed.data, profile.id);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
