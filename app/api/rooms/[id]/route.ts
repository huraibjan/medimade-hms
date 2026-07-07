import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { getRoom, softDeleteRoom, updateRoom } from "@/lib/services/rooms";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { roomSchema } from "@/lib/validations/facilities";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("rooms:read");
    const data = await getRoom(id, hospitalId);
    if (!data) return apiError("Room not found", 404);
    return apiSuccess(data);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId, profile } = await requireServiceContext("admissions:manage");
    const body = await request.json();
    const parsed = roomSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());
    const result = await updateRoom(id, hospitalId, parsed.data, profile.id);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId, profile } = await requireServiceContext("admissions:manage");
    const result = await softDeleteRoom(id, hospitalId, profile.id);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
