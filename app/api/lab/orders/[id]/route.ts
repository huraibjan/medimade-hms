import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { getLabOrder, updateLabOrderStatus, updateLabResult } from "@/lib/services/lab";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { labOrderStatusSchema, labResultSchema } from "@/lib/validations/lab";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext(["lab:read", "lab:manage"]);
    const data = await getLabOrder(id, hospitalId);
    if (!data) return apiError("Lab order not found", 404);

    return apiSuccess(data);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId, profile } = await requireServiceContext("lab:manage");
    const body = await request.json();
    if (body.action === "result") {
      if (!body.item_id) return apiError("Lab order item id is required", 422);
      const parsed = labResultSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());
      const result = await updateLabResult(body.item_id, hospitalId, parsed.data, profile.id);
      return apiServiceResult(result);
    }

    const parsed = labOrderStatusSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());
    const result = await updateLabOrderStatus(id, hospitalId, parsed.data, profile.id);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId, profile } = await requireServiceContext("lab:manage");
    const result = await updateLabOrderStatus(id, hospitalId, { status: "cancelled" }, profile.id);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
