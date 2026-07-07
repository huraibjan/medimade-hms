import { applyListParams, parseListParams } from "@/lib/api/list";
import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { createBed, listAvailableBeds, listBeds } from "@/lib/services/rooms";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { bedSchema } from "@/lib/validations/facilities";

export async function GET(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext("rooms:read");
    const url = new URL(request.url);
    const availableOnly = url.searchParams.get("available") === "true";
    const rows = availableOnly
      ? await listAvailableBeds(hospitalId)
      : await listBeds(hospitalId);
    const params = parseListParams(request, ["status", "room_id"]);
    const data = applyListParams(rows, params, {
      searchFields: ["bed_number", "rooms.room_number", "rooms.wards.name", "status"],
      sortFields: ["bed_number", "status"],
      defaultSort: "bed_number"
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
    const parsed = bedSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());
    const result = await createBed(hospitalId, parsed.data, profile.id);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
