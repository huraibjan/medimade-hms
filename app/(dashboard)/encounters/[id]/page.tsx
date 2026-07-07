import { notFound } from "next/navigation";
import { EncounterDetail } from "@/components/clinical/encounter-detail";
import { PageTitle } from "@/components/layout/page-title";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getEncounter } from "@/lib/services/encounters";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

type PageProps = { params: Promise<{ id: string }> };

export default async function EncounterPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const encounter = await getEncounter(id, hospitalId);
  if (!encounter) notFound();

  return (
    <div className="space-y-6">
      <PageTitle title="Clinical encounter" description="Vitals, diagnoses, treatment plans, notes, prescriptions, and lab links." />
      <EncounterDetail encounter={encounter} hospitalId={hospitalId} actorProfileId={profile?.id} />
    </div>
  );
}
