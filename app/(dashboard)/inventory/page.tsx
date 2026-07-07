import { Boxes, History, PackagePlus, Pill } from "lucide-react";
import Link from "next/link";
import { InventoryForm } from "@/components/forms/inventory-form";
import { PageTitle } from "@/components/layout/page-title";
import { RoleActionButton } from "@/components/layout/role-action-button";
import { ExpiringMedicineTable } from "@/components/tables/expiring-medicine-table";
import { InventoryTable } from "@/components/tables/inventory-table";
import { LowStockTable } from "@/components/tables/low-stock-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { can } from "@/lib/constants/rbac";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listExpiringSoon, listInventoryBatches, listLowStock } from "@/lib/services/inventory";
import { listMedicines } from "@/lib/services/pharmacy";
import { listSuppliers } from "@/lib/services/suppliers";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function InventoryPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const [inventory, medicines, suppliers, lowStock, expiring] = await Promise.all([
    listInventoryBatches(hospitalId),
    listMedicines(hospitalId),
    listSuppliers(hospitalId),
    listLowStock(hospitalId),
    listExpiringSoon(hospitalId)
  ]);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Medicine inventory"
        description="Batch-level stock, expiry tracking, reorder thresholds, and inventory controls."
        actions={
          <>
            <Button variant="outline" asChild><Link href="/inventory/medicines"><Pill className="h-4 w-4" />Medicines</Link></Button>
            <RoleActionButton role={profile?.role} permission="inventory:manage" href="/inventory/stock-movements" icon={History} variant="outline">
              Movements
            </RoleActionButton>
            {can(profile?.role, "inventory:manage") ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button><PackagePlus className="h-4 w-4" />Add batch</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Add inventory batch</SheetTitle>
                    <SheetDescription>Receive a medicine batch and create its opening stock movement.</SheetDescription>
                  </SheetHeader>
                  <SheetBody>
                    <InventoryForm hospitalId={hospitalId} actorProfileId={profile?.id} medicines={medicines} suppliers={suppliers} />
                  </SheetBody>
                </SheetContent>
              </Sheet>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <InventoryMetric icon={Boxes} title="Tracked batches" value={inventory.length.toString()} />
        <InventoryMetric icon={PackagePlus} title="Total on hand" value={inventory.reduce((total, batch) => total + batch.quantity_on_hand, 0).toLocaleString()} />
        <InventoryMetric icon={History} title="Alerts" value={(lowStock.length + expiring.length).toString()} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory batches</CardTitle>
          <CardDescription>Quantity, reorder level, supplier, cost, selling price, and expiry by batch.</CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryTable data={inventory} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
            <CardDescription>Restock these medicines before dispensing pressure builds.</CardDescription>
          </CardHeader>
          <CardContent>
            <LowStockTable data={lowStock} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expiring soon</CardTitle>
            <CardDescription>Prioritize dispensing or return workflows for these batches.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpiringMedicineTable data={expiring} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InventoryMetric({ icon: Icon, title, value }: { icon: typeof Boxes; title: string; value: string }) {
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
