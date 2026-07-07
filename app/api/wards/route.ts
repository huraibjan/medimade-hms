import { applyListParams, parseListParams } from "@/lib/api/list";
import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { createWard, listWards } from "@/lib/services/rooms";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { wardSchema } from "@/lib/validations/facilities";

export async function GET(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext("rooms:read");
    const rows = await listWards(hospitalId);
    const params = parseListParams(request, ["floor", "department_id"]);
    const data = applyListParams(rows, params, {
      searchFields: ["name", "floor", "department"],
      sortFields: ["name", "floor"],
      defaultSort: "name"
    });

    return apiSuccess(data.items, { meta: data });
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function POST(request: Request) {
  try {
    const { hospitalId, profile } = await requireServiceContext("admissions:manage");
    const body = await request.json();
    const parsed = wardSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());
    const result = await createWard(hospitalId, parsed.data, profile.id);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
