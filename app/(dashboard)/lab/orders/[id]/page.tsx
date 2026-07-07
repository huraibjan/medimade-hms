import { notFound } from "next/navigation";
import { LabOrderDetail } from "@/components/lab/lab-order-detail";
import { PageTitle } from "@/components/layout/page-title";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getLabOrder, listLabTechnicians } from "@/lib/services/lab";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

type PageProps = { params: Promise<{ id: string }> };

export default async function LabOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const [order, technicians] = await Promise.all([
    getLabOrder(id, hospitalId),
    listLabTechnicians(hospitalId)
  ]);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <PageTitle title="Lab order detail" description="Result entry, technician assignment, reference ranges, and order completion." />
      <LabOrderDetail order={order} hospitalId={hospitalId} actorProfileId={profile?.id} technicians={technicians} />
    </div>
  );
}
