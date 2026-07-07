import { applyListParams, parseListParams } from "@/lib/api/list";
import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { listPayments, recordPayment } from "@/lib/services/billing";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { paymentSchema } from "@/lib/validations/billing";

export async function GET(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext("billing:manage");
    const rows = await listPayments(hospitalId);
    const params = parseListParams(request, ["payment_method", "payment_status", "invoice_id"]);
    const data = applyListParams(rows, params, {
      searchFields: ["transaction_reference", "invoices.invoice_number", "invoices.patients.mrn", "invoices.patients.first_name", "invoices.patients.last_name"],
      sortFields: ["created_at", "paid_at", "amount", "payment_method"],
      defaultSort: "created_at"
    });

    return apiSuccess(data.items, { meta: data });
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}

export async function POST(request: Request) {
  try {
    const { hospitalId, profile } = await requireServiceContext("billing:manage");
    const body = await request.json();
    const parsed = paymentSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

    const result = await recordPayment(hospitalId, parsed.data, profile.id);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
