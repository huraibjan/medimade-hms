import { applyListParams, parseListParams } from "@/lib/api/list";
import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { createStockMovement, listStockMovements } from "@/lib/services/inventory";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { stockMovementSchema } from "@/lib/validations/inventory";

export async function GET(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext("inventory:manage");
    const rows = await listStockMovements(hospitalId);
    const params = parseListParams(request, ["movement_type", "inventory_id"]);
    const data = applyListParams(rows, params, {
      searchFields: ["reference_number", "reason", "medicine_inventory.batch_no", "medicine_inventory.medications.name"],
      sortFields: ["movement_date", "movement_type", "quantity"],
      defaultSort: "movement_date"
    });

    return apiSuccess(data.items, { meta: data });
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function POST(request: Request) {
  try {
    const { hospitalId, profile } = await requireServiceContext("inventory:manage");
    const body = await request.json();
    const parsed = stockMovementSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

    const result = await createStockMovement(hospitalId, parsed.data, profile.id);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
