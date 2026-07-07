import { SupplierForm } from "@/components/forms/supplier-form";
import { PageTitle } from "@/components/layout/page-title";
import { SupplierTable } from "@/components/tables/supplier-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listSuppliers } from "@/lib/services/suppliers";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function SuppliersPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const suppliers = await listSuppliers(hospitalId);

  return (
    <div className="space-y-6">
      <PageTitle title="Suppliers" description="Manage pharmacy supplier contacts and purchase relationships." />
      <Card>
        <CardHeader>
          <CardTitle>Add supplier</CardTitle>
          <CardDescription>Create supplier records for inventory batch purchasing and receiving.</CardDescription>
        </CardHeader>
        <CardContent>
          <SupplierForm hospitalId={hospitalId} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Supplier directory</CardTitle>
          <CardDescription>Active and inactive pharmacy suppliers for this hospital.</CardDescription>
        </CardHeader>
        <CardContent>
          <SupplierTable data={suppliers} />
        </CardContent>
      </Card>
    </div>
  );
}
