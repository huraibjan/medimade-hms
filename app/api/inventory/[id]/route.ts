import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { deactivateInventoryBatch, getInventoryBatch, updateInventoryBatch } from "@/lib/services/inventory";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { inventoryBatchSchema } from "@/lib/validations/inventory";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("inventory:manage");
    const data = await getInventoryBatch(id, hospitalId);
    if (!data) return apiError("Inventory batch not found", 404);
    return apiSuccess(data);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId, profile } = await requireServiceContext("inventory:manage");
    const body = await request.json();
    const parsed = inventoryBatchSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());
    const result = await updateInventoryBatch(id, hospitalId, parsed.data, profile.id);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId, profile } = await requireServiceContext("inventory:manage");
    const result = await deactivateInventoryBatch(id, hospitalId, profile.id);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
