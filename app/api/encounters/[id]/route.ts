import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { completeEncounter, getEncounter, updateClinicalNotes } from "@/lib/services/encounters";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { clinicalNotesSchema } from "@/lib/validations/clinical";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext(["clinical:read", "clinical:manage"]);
    const data = await getEncounter(id, hospitalId);
    if (!data) return apiError("Encounter not found", 404);

    return apiSuccess(data);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId, profile } = await requireServiceContext("clinical:manage");
    const body = await request.json();
    if (body.action === "complete") {
      const result = await completeEncounter(id, hospitalId, profile.id);
      return apiServiceResult(result);
    }

    const parsed = clinicalNotesSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());
    const result = await updateClinicalNotes(id, hospitalId, parsed.data, profile.id);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
