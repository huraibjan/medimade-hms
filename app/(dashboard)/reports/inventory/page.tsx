import { AlertTriangle, PackageSearch } from "lucide-react";
import { InventoryStatusChart } from "@/components/charts/inventory-status-chart";
import { StatCard } from "@/components/cards/stat-card";
import { DateRangePicker } from "@/components/filters/date-range-picker";
import { PageTitle } from "@/components/layout/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getReportsAnalytics } from "@/lib/services/reports";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function InventoryReportPage() {
  const profile = await getCurrentProfile();
  const analytics = await getReportsAnalytics(profile?.hospital_id ?? DEFAULT_HOSPITAL_ID);

  return (
    <div className="space-y-6">
      <PageTitle title="Inventory report" description="Stock health, low-stock risk, and medicine expiry exposure." actions={<DateRangePicker />} />
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard icon={PackageSearch} title="Low-stock medicines" value={analytics.stats.lowStockMedicines} detail="At or below reorder" tone="warning" />
        <StatCard icon={AlertTriangle} title="Expiring medicines" value={analytics.stats.expiringMedicines} detail="Within expiry window" tone="danger" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Medicine stock status</CardTitle>
          <CardDescription>Healthy, low-stock, and expiring inventory batches.</CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryStatusChart data={analytics.charts.medicineStockStatus} />
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low-stock medicines</CardTitle>
            <CardDescription>From medicine_low_stock_view where available.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Reorder</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.tables.lowStockMedicines.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.medication_name}<p className="text-xs text-muted-foreground">{item.sku}</p></TableCell>
                    <TableCell>{item.batch_no}</TableCell>
                    <TableCell className="text-right">{item.quantity_on_hand}</TableCell>
                    <TableCell className="text-right">{item.reorder_level}</TableCell>
                    <TableCell><Badge variant="warning">low stock</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expiring medicines</CardTitle>
            <CardDescription>From expiring_medicines_view where available.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.tables.expiringMedicines.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.medication_name}<p className="text-xs text-muted-foreground">{item.sku}</p></TableCell>
                    <TableCell>{item.batch_no}</TableCell>
                    <TableCell className="text-right">{item.quantity_on_hand}</TableCell>
                    <TableCell className="text-right">{item.days_until_expiry}</TableCell>
                    <TableCell><Badge variant="danger">expiring</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
