import { applyListParams, parseListParams } from "@/lib/api/list";
import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { createInventoryBatch, listInventoryAlerts, listInventoryBatches } from "@/lib/services/inventory";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { inventoryBatchSchema } from "@/lib/validations/inventory";

export async function GET(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext("inventory:manage");
    const [rows, alerts] = await Promise.all([
      listInventoryBatches(hospitalId),
      listInventoryAlerts(hospitalId)
    ]);
    const params = parseListParams(request, ["medication_id", "supplier_id"]);
    const data = applyListParams(rows, params, {
      searchFields: ["sku", "batch_no", "medications.name", "suppliers.name"],
      sortFields: ["expiry_date", "quantity_on_hand", "sku"],
      defaultSort: "expiry_date"
    });

    return apiSuccess({ batches: data.items, alerts }, { meta: data });
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function POST(request: Request) {
  try {
    const { hospitalId, profile } = await requireServiceContext("inventory:manage");
    const body = await request.json();
    const parsed = inventoryBatchSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

    const result = await createInventoryBatch(hospitalId, parsed.data, profile.id);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
