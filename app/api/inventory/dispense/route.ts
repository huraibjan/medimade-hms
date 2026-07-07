import { apiError, apiServiceResult } from "@/lib/api/response";
import { dispensePrescription } from "@/lib/services/inventory";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { dispensePrescriptionSchema } from "@/lib/validations/inventory";

export async function POST(request: Request) {
  try {
    const { hospitalId, profile } = await requireServiceContext("inventory:manage");
    const body = await request.json();
    const parsed = dispensePrescriptionSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

    const result = await dispensePrescription(hospitalId, parsed.data, profile.id);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
