import { AlertTriangle, Boxes, PackagePlus, Pill, Truck } from "lucide-react";
import Link from "next/link";
import { PageTitle } from "@/components/layout/page-title";
import { ExpiringMedicineTable } from "@/components/tables/expiring-medicine-table";
import { LowStockTable } from "@/components/tables/low-stock-table";
import { MedicineTable } from "@/components/tables/medicine-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listExpiringSoon, listInventoryBatches, listLowStock } from "@/lib/services/inventory";
import { listMedicines } from "@/lib/services/pharmacy";
import { listSuppliers } from "@/lib/services/suppliers";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function PharmacyPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const [medicines, inventory, lowStock, expiring, suppliers] = await Promise.all([
    listMedicines(hospitalId),
    listInventoryBatches(hospitalId),
    listLowStock(hospitalId),
    listExpiringSoon(hospitalId),
    listSuppliers(hospitalId)
  ]);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Pharmacy"
        description="Medicine catalog, dispensing readiness, stock alerts, suppliers, and batch inventory."
        actions={
          <>
            <Button variant="outline" asChild><Link href="/inventory/medicines"><Pill className="h-4 w-4" />Add medicine</Link></Button>
            <Button asChild><Link href="/inventory/stock-movements"><PackagePlus className="h-4 w-4" />Receive stock</Link></Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <PharmacyMetric icon={Pill} title="Active medicines" value={medicines.filter((medicine) => medicine.is_active).length.toString()} />
        <PharmacyMetric icon={Boxes} title="Inventory batches" value={inventory.length.toString()} />
        <PharmacyMetric icon={AlertTriangle} title="Low stock" value={lowStock.length.toString()} />
        <PharmacyMetric icon={Truck} title="Suppliers" value={suppliers.length.toString()} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low-stock alerts</CardTitle>
            <CardDescription>Medicines at or below reorder level.</CardDescription>
          </CardHeader>
          <CardContent>
            <LowStockTable data={lowStock} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expiring soon</CardTitle>
            <CardDescription>Batches expiring within the next 60 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpiringMedicineTable data={expiring} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medicine catalog</CardTitle>
          <CardDescription>Active and inactive formulary medicines for this hospital.</CardDescription>
        </CardHeader>
        <CardContent>
          <MedicineTable data={medicines} hospitalId={hospitalId} />
        </CardContent>
      </Card>
    </div>
  );
}

function PharmacyMetric({ icon: Icon, title, value }: { icon: typeof Pill; title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <CardDescription>{title}</CardDescription>
        </div>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
