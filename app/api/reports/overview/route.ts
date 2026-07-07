import { apiError, apiSuccess } from "@/lib/api/response";
import { getReportsAnalytics } from "@/lib/services/reports";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";

export async function GET() {
  try {
    const { hospitalId } = await requireServiceContext("reports:read");
    const analytics = await getReportsAnalytics(hospitalId);

    return apiSuccess(analytics);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
