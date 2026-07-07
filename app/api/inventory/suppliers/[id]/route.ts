import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { deactivateSupplier, getSupplier, updateSupplier } from "@/lib/services/suppliers";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { supplierSchema } from "@/lib/validations/inventory";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("inventory:manage");
    const data = await getSupplier(id, hospitalId);
    if (!data) return apiError("Supplier not found", 404);
    return apiSuccess(data);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("inventory:manage");
    const body = await request.json();
    const parsed = supplierSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());
    const result = await updateSupplier(id, hospitalId, parsed.data);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("inventory:manage");
    const result = await deactivateSupplier(id, hospitalId);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
