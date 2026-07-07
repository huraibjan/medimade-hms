import { MedicineForm } from "@/components/forms/medicine-form";
import { PageTitle } from "@/components/layout/page-title";
import { MedicineTable } from "@/components/tables/medicine-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listMedicines } from "@/lib/services/pharmacy";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function MedicinesPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const medicines = await listMedicines(hospitalId);

  return (
    <div className="space-y-6">
      <PageTitle title="Medicines" description="Manage the pharmacy catalog and formulary details." />
      <Card>
        <CardHeader>
          <CardTitle>Add medicine</CardTitle>
          <CardDescription>Create a medication record before receiving inventory batches.</CardDescription>
        </CardHeader>
        <CardContent>
          <MedicineForm hospitalId={hospitalId} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Medicine catalog</CardTitle>
          <CardDescription>Deactivate medicines that should no longer be dispensed.</CardDescription>
        </CardHeader>
        <CardContent>
          <MedicineTable data={medicines} hospitalId={hospitalId} />
        </CardContent>
      </Card>
    </div>
  );
}
