import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { deactivateMedicine, getMedicine, updateMedicine } from "@/lib/services/pharmacy";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { medicineSchema } from "@/lib/validations/inventory";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("pharmacy:manage");
    const data = await getMedicine(id, hospitalId);
    if (!data) return apiError("Medicine not found", 404);
    return apiSuccess(data);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("pharmacy:manage");
    const body = await request.json();
    const parsed = medicineSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

    const result = await updateMedicine(id, hospitalId, parsed.data);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("pharmacy:manage");
    const result = await deactivateMedicine(id, hospitalId);

    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
