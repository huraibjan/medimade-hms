import { apiError, apiServiceResult } from "@/lib/api/response";
import { createEncounter } from "@/lib/services/encounters";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { encounterSchema } from "@/lib/validations/clinical";

export async function POST(request: Request) {
  try {
    const { hospitalId, profile } = await requireServiceContext("clinical:manage");
    const body = await request.json();
    const parsed = encounterSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

    const result = await createEncounter(hospitalId, parsed.data, profile.id);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
