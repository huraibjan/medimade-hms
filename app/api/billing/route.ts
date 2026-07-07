import { apiError, apiSuccess } from "@/lib/api/response";
import { getBillingSummary, listInvoices, listPayments } from "@/lib/services/billing";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";

export async function GET() {
  try {
    const { hospitalId } = await requireServiceContext("billing:manage");
    const [summary, invoices, payments] = await Promise.all([
      getBillingSummary(hospitalId),
      listInvoices(hospitalId),
      listPayments(hospitalId)
    ]);

    return apiSuccess({ summary, invoices, payments });
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
