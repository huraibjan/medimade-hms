import { apiError, apiSuccess } from "@/lib/api/response";
import { listInventoryAlerts } from "@/lib/services/inventory";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";

export async function GET() {
  try {
    const { hospitalId } = await requireServiceContext("inventory:manage");
    const data = await listInventoryAlerts(hospitalId);

    return apiSuccess(data);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
