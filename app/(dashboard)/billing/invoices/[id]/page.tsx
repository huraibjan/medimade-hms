import { notFound } from "next/navigation";
import { InvoiceDetail } from "@/components/billing/invoice-detail";
import { PageTitle } from "@/components/layout/page-title";
import { getCurrentProfile, getHospitalName } from "@/lib/services/auth-service";
import { getInvoice, listInvoices } from "@/lib/services/billing";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

type PageProps = { params: Promise<{ id: string }> };

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const [invoice, invoices, hospitalName] = await Promise.all([
    getInvoice(id, hospitalId),
    listInvoices(hospitalId),
    getHospitalName(hospitalId)
  ]);
  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      <PageTitle title="Invoice detail" description="Review itemized charges, print invoice, and record payments." className="print:hidden" />
      <InvoiceDetail invoice={invoice} invoices={invoices} hospitalId={hospitalId} actorProfileId={profile?.id} hospitalName={hospitalName} />
    </div>
  );
}
