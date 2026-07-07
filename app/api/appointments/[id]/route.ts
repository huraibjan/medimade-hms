import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { getAppointment, updateAppointment, updateAppointmentStatus } from "@/lib/services/appointments";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { appointmentSchema, appointmentStatusSchema } from "@/lib/validations/appointment";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("appointments:manage");
    const data = await getAppointment(id, hospitalId);
    if (!data) return apiError("Appointment not found", 404);

    return apiSuccess(data);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId, profile } = await requireServiceContext("appointments:manage");
    const body = await request.json();
    if (body.action === "status") {
      const parsed = appointmentStatusSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());
      const result = await updateAppointmentStatus(id, hospitalId, parsed.data, profile.id);
      return apiServiceResult(result);
    }

    const parsed = appointmentSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());
    const result = await updateAppointment(id, hospitalId, parsed.data, profile.role);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId, profile } = await requireServiceContext("appointments:manage");
    const result = await updateAppointmentStatus(id, hospitalId, { status: "cancelled", cancellation_reason: "Deleted from API" }, profile.id);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
