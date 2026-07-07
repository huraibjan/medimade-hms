import { apiError, apiSuccess } from "@/lib/api/response";
import { getLabSummary, listCriticalResults, listLabOrders, listLabTests } from "@/lib/services/lab";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";

export async function GET() {
  try {
    const { hospitalId } = await requireServiceContext(["lab:read", "lab:manage"]);
    const [summary, orders, tests, critical] = await Promise.all([
      getLabSummary(hospitalId),
      listLabOrders(hospitalId),
      listLabTests(hospitalId),
      listCriticalResults(hospitalId)
    ]);

    return apiSuccess({ summary, orders, tests, critical });
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
