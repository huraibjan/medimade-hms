import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { getStaff, softDeleteStaff, updateStaff } from "@/lib/services/staff";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { staffSchema } from "@/lib/validations/staff";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("staff:manage");
    const data = await getStaff(id, hospitalId);
    if (!data) return apiError("Staff member not found", 404);
    return apiSuccess(data);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId, profile } = await requireServiceContext("staff:manage");
    const body = await request.json();
    const parsed = staffSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());
    const result = await updateStaff(id, hospitalId, parsed.data, profile.id);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId, profile } = await requireServiceContext("staff:manage");
    const result = await softDeleteStaff(id, hospitalId, profile.id);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
