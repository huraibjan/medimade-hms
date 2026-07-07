import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { deactivateLabTest, getLabTest, updateLabTest } from "@/lib/services/lab";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { labTestSchema } from "@/lib/validations/lab";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext(["lab:read", "lab:manage"]);
    const data = await getLabTest(id, hospitalId);
    if (!data) return apiError("Lab test not found", 404);
    return apiSuccess(data);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("lab:manage");
    const body = await request.json();
    const parsed = labTestSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());
    const result = await updateLabTest(id, hospitalId, parsed.data);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("lab:manage");
    const result = await deactivateLabTest(id, hospitalId);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
