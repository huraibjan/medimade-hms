import { DispensePrescriptionForm } from "@/components/forms/dispense-prescription-form";
import { StockMovementForm } from "@/components/forms/stock-movement-form";
import { PageTitle } from "@/components/layout/page-title";
import { StockMovementTable } from "@/components/tables/stock-movement-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listInventoryBatches, listStockMovements } from "@/lib/services/inventory";
import { listMedicines } from "@/lib/services/pharmacy";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function StockMovementsPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const [inventory, movements, medicines] = await Promise.all([
    listInventoryBatches(hospitalId),
    listStockMovements(hospitalId),
    listMedicines(hospitalId)
  ]);

  return (
    <div className="space-y-6">
      <PageTitle title="Stock movements" description="Receive, dispense, return, expire, damage, and adjust medicine stock." />
      <Card>
        <CardHeader>
          <CardTitle>Record stock movement</CardTitle>
          <CardDescription>Every inventory change creates a traceable movement record and validates available stock.</CardDescription>
        </CardHeader>
        <CardContent>
          <StockMovementForm hospitalId={hospitalId} actorProfileId={profile?.id} inventory={inventory} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Dispense prescription</CardTitle>
          <CardDescription>Dispensing reduces stock from earliest-expiry batches first and blocks over-dispensing.</CardDescription>
        </CardHeader>
        <CardContent>
          <DispensePrescriptionForm hospitalId={hospitalId} actorProfileId={profile?.id} medicines={medicines} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Movement history</CardTitle>
          <CardDescription>Audit trail of purchases, dispensing, adjustments, returns, expired stock, and damaged stock.</CardDescription>
        </CardHeader>
        <CardContent>
          <StockMovementTable data={movements} />
        </CardContent>
      </Card>
    </div>
  );
}
