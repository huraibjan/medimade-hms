import { applyListParams, parseListParams } from "@/lib/api/list";
import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { createSupplier, listSuppliers } from "@/lib/services/suppliers";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { supplierSchema } from "@/lib/validations/inventory";

export async function GET(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext("inventory:manage");
    const rows = await listSuppliers(hospitalId);
    const params = parseListParams(request, ["is_active"]);
    const data = applyListParams(rows, params, {
      searchFields: ["name", "contact_person", "phone", "email", "address"],
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
    const { hospitalId } = await requireServiceContext("inventory:manage");
    const body = await request.json();
    const parsed = supplierSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

    const result = await createSupplier(hospitalId, parsed.data);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
