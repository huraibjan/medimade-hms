import { apiError, apiSuccess } from "@/lib/api/response";
import { getDashboardOverview } from "@/lib/services/dashboard";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";

export async function GET() {
  try {
    const { hospitalId } = await requireServiceContext("dashboard:read");
    const data = await getDashboardOverview(hospitalId);

    return apiSuccess(data);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
