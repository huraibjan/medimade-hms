import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { getInvoice, updateInvoiceStatus } from "@/lib/services/billing";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { invoiceStatusSchema } from "@/lib/validations/billing";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("billing:manage");
    const data = await getInvoice(id, hospitalId);
    if (!data) return apiError("Invoice not found", 404);

    return apiSuccess(data);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId, profile } = await requireServiceContext("billing:manage");
    const body = await request.json();
    const parsed = invoiceStatusSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

    const result = await updateInvoiceStatus(id, hospitalId, parsed.data, profile.id);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId, profile } = await requireServiceContext("billing:manage");
    const result = await updateInvoiceStatus(id, hospitalId, { status: "cancelled" }, profile.id);
    return apiServiceResult(result);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
