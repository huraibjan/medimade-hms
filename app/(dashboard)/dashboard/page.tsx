import {
  AlertTriangle,
  Bed,
  BedDouble,
  CalendarClock,
  CreditCard,
  FlaskConical,
  PackageSearch,
  UsersRound
} from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { OccupancyChart } from "@/components/charts/occupancy-chart";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { MetricCard } from "@/components/dashboard/metric-card";
import { EmptyState } from "@/components/empty-state";
import { DateRangePicker } from "@/components/filters/date-range-picker";
import { PageTitle } from "@/components/layout/page-title";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getDashboardOverview } from "@/lib/services/operations-service";
import { currency } from "@/lib/utils";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const overview = await getDashboardOverview(profile?.hospital_id);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Operations dashboard"
        description={`${format(new Date(), "EEEE, MMMM d, yyyy")} - live hospital operations overview`}
        actions={<DateRangePicker />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total patients" value={overview.metrics.patients} icon={UsersRound} detail="Registered patient records" accent="primary" />
        <MetricCard title="Active admissions" value={overview.metrics.activeAdmissions} icon={Bed} detail="Currently admitted patients" />
        <MetricCard title="Available beds" value={overview.metrics.availableBeds} icon={BedDouble} detail="Ready for assignment" accent="success" />
        <MetricCard title="Occupied beds" value={overview.metrics.occupiedBeds} icon={Bed} detail="Assigned across wards" />
        <MetricCard title="Today's appointments" value={overview.metrics.appointmentsToday} icon={CalendarClock} detail="Scheduled and checked in" />
        <MetricCard title="Pending lab orders" value={overview.metrics.labPending} icon={FlaskConical} detail="Awaiting processing/results" accent="warning" />
        <MetricCard title="Low stock medicines" value={overview.metrics.lowStock} icon={PackageSearch} detail="Below threshold or near expiry" accent="warning" />
        <MetricCard title="Monthly revenue" value={currency(overview.metrics.monthlyRevenue)} icon={CreditCard} detail="Issued invoice total" accent="primary" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Room occupancy</CardTitle>
            <CardDescription>Occupied and available beds by hospital area.</CardDescription>
          </CardHeader>
          <CardContent>
            <OccupancyChart data={overview.occupancy} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
            <CardDescription>Monthly billing performance across departments.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={overview.revenue} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent admissions</CardTitle>
            <CardDescription>Newest active inpatient movements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.admissions.length ? (
              overview.admissions.slice(0, 5).map((admission) => (
                <div key={admission.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">Patient {admission.patient_id}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{admission.reason ?? "Admission review"}</p>
                  </div>
                  <Badge variant="success">{admission.status}</Badge>
                </div>
              ))
            ) : (
              <EmptyState title="No active admissions" description="Admissions created today will appear here." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming appointments</CardTitle>
            <CardDescription>Next scheduled consultations and check-ins.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.appointments.length ? (
              overview.appointments.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{appointment.reason ?? "Clinical appointment"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(appointment.scheduled_start), "MMM d, h:mm a")} - {appointment.status.replaceAll("_", " ")}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {formatDistanceToNowStrict(new Date(appointment.scheduled_start), { addSuffix: true })}
                  </Badge>
                </div>
              ))
            ) : (
              <EmptyState title="No upcoming appointments" description="Scheduled appointments will appear here." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational alerts</CardTitle>
            <CardDescription>Clinical, pharmacy, and billing items needing review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.alerts.length ? (
              overview.alerts.map((alert) => (
                <div key={alert} className="rounded-md border p-3 text-sm">
                  <Badge variant="warning" className="mb-2">
                    Action needed
                  </Badge>
                  <p>{alert}</p>
                </div>
              ))
            ) : (
              <EmptyState icon={AlertTriangle} title="No urgent alerts" description="Critical lab, stock, and billing alerts will appear here." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medicine low-stock table</CardTitle>
          <CardDescription>Inventory items below reorder level or nearing expiry.</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.lowStockMedicines.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Reorder level</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.lowStockMedicines.map((medicine) => (
                  <TableRow key={medicine.id}>
                    <TableCell className="font-medium">{medicine.name}</TableCell>
                    <TableCell>{medicine.sku}</TableCell>
                    <TableCell className="text-right">{medicine.onHand}</TableCell>
                    <TableCell className="text-right">{medicine.reorderLevel}</TableCell>
                    <TableCell>{format(new Date(medicine.expiresOn), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant={medicine.status === "near_expiry" ? "warning" : "danger"}>
                        {medicine.status === "near_expiry" ? "Near expiry" : "Low stock"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="Inventory is healthy" description="Low-stock and near-expiry medicine alerts will appear here." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
