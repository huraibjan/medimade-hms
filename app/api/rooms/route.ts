import { applyListParams, parseListParams } from "@/lib/api/list";
import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { createRoom, listRooms } from "@/lib/services/rooms";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { roomSchema } from "@/lib/validations/facilities";

export async function GET(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext("rooms:read");
    const rows = await listRooms(hospitalId);
    const params = parseListParams(request, ["status", "room_type", "ward_id"]);
    const data = applyListParams(rows, params, {
      searchFields: ["room_number", "wards.name", "room_type", "status"],
      sortFields: ["room_number", "room_type", "status"],
      defaultSort: "room_number"
    });

    return apiSuccess(data.items, { meta: data });
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function POST(request: Request) {
  try {
    const { hospitalId, profile } = await requireServiceContext("admissions:manage");
    const body = await request.json();
    const parsed = roomSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());
    const result = await createRoom(hospitalId, parsed.data, profile.id);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
