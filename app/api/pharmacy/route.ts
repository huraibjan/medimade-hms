import { applyListParams, parseListParams } from "@/lib/api/list";
import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { createMedicine, listMedicines } from "@/lib/services/pharmacy";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { medicineSchema } from "@/lib/validations/inventory";

export async function GET(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext("pharmacy:manage");
    const rows = await listMedicines(hospitalId);
    const params = parseListParams(request, ["dosage_form", "is_active"]);
    const data = applyListParams(rows, params, {
      searchFields: ["name", "generic_name", "brand_name", "strength", "manufacturer"],
      sortFields: ["name", "created_at"],
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
    const { hospitalId } = await requireServiceContext("pharmacy:manage");
    const body = await request.json();
    const parsed = medicineSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

    const result = await createMedicine(hospitalId, parsed.data);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
