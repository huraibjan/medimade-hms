import { applyListParams, parseListParams } from "@/lib/api/list";
import { apiError, apiServiceResult, apiSuccess } from "@/lib/api/response";
import { createInvoice, listInvoices } from "@/lib/services/billing";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";
import { invoiceSchema } from "@/lib/validations/billing";

export async function GET(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext("billing:manage");
    const rows = await listInvoices(hospitalId);
    const params = parseListParams(request, ["status", "patient_id"]);
    const data = applyListParams(rows, params, {
      searchFields: ["invoice_number", "patients.mrn", "patients.first_name", "patients.last_name"],
      sortFields: ["created_at", "issued_at", "total_amount", "status"],
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
    const parsed = invoiceSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten());

    const result = await createInvoice(hospitalId, parsed.data, profile.id);
    return apiServiceResult(result, 201);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
