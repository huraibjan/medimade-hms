import { applyListParams, parseListParams } from "@/lib/api/list";
import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { createAppointment, listAppointments } from "@/lib/services/appointments";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { appointmentSchema } from "@/lib/validations/appointment";

export async function GET(request: Request) {
  try {
    const { hospitalId, profile } = await requireServiceContext("appointments:manage");
    const rows = await listAppointments(hospitalId, profile.role, profile.id);
    const params = parseListParams(request, ["doctor_id", "department_id", "status"]);
    const data = applyListParams(rows, params, {
      searchFields: ["patient.mrn", "patient.first_name", "patient.last_name", "doctor.full_name", "reason"],
      sortFields: ["scheduled_start", "status", "created_at"],
      defaultSort: "scheduled_start"
    });

    return apiSuccess(data.items, { meta: data });
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function POST(request: Request) {
  try {
    const { hospitalId, profile } = await requireServiceContext("appointments:manage");
    const body = await request.json();
    const parsed = appointmentSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

    const result = await createAppointment(hospitalId, parsed.data, profile.id, profile.role);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
