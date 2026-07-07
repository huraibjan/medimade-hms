import { applyListParams, parseListParams } from "@/lib/api/list";
import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { createLabTest, listLabTests } from "@/lib/services/lab";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { labTestSchema } from "@/lib/validations/lab";

export async function GET(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext(["lab:read", "lab:manage"]);
    const rows = await listLabTests(hospitalId);
    const params = parseListParams(request, ["category", "sample_type", "is_active"]);
    const data = applyListParams(rows, params, {
      searchFields: ["test_name", "test_code", "category", "sample_type", "reference_range"],
      sortFields: ["test_name", "test_code", "category", "price"],
      defaultSort: "test_name"
    });

    return apiSuccess(data.items, { meta: data });
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function POST(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext("lab:manage");
    const body = await request.json();
    const parsed = labTestSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

    const result = await createLabTest(hospitalId, parsed.data);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
