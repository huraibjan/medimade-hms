import {
  Activity,
  AlertTriangle,
  Bed,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  ClipboardList,
  CreditCard,
  DoorOpen,
  FlaskConical,
  PackageSearch,
  ReceiptText,
  UserPlus,
  Users,
  WalletCards
} from "lucide-react";
import { AdmissionsChart } from "@/components/charts/admissions-chart";
import { AppointmentStatusChart } from "@/components/charts/appointment-status-chart";
import { InventoryStatusChart } from "@/components/charts/inventory-status-chart";
import { LabOrdersStatusChart } from "@/components/charts/lab-orders-status-chart";
import { OccupancyChart } from "@/components/charts/occupancy-chart";
import { PatientRegistrationsChart } from "@/components/charts/patient-registrations-chart";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { StatCard } from "@/components/cards/stat-card";
import { DashboardRecentActivity } from "@/components/dashboard/dashboard-recent-activity";
import { DateRangePicker } from "@/components/filters/date-range-picker";
import { PageTitle } from "@/components/layout/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getReportsAnalytics } from "@/lib/services/reports";
import { currency } from "@/lib/utils";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function ReportsPage() {
  const profile = await getCurrentProfile();
  const analytics = await getReportsAnalytics(profile?.hospital_id ?? DEFAULT_HOSPITAL_ID);
  const stats = analytics.stats;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Reports and analytics"
        description="Operational, clinical, pharmacy, lab, and revenue cycle performance."
        actions={<DateRangePicker />}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} title="Total patients" value={stats.totalPatients} detail="Registered patient records" tone="primary" />
        <StatCard icon={UserPlus} title="New patients this month" value={stats.newPatientsThisMonth} detail="Month-to-date registrations" tone="success" />
        <StatCard icon={Activity} title="Active admissions" value={stats.activeAdmissions} detail="Admitted or transferred" />
        <StatCard icon={ClipboardList} title="Discharged this month" value={stats.dischargedThisMonth} detail="Completed inpatient stays" />
        <StatCard icon={DoorOpen} title="Available beds" value={stats.availableBeds} detail="Ready for allocation" tone="success" />
        <StatCard icon={Bed} title="Occupied beds" value={stats.occupiedBeds} detail={`${stats.occupancyPercentage}% occupancy`} tone="warning" />
        <StatCard icon={CalendarClock} title="Today's appointments" value={stats.todaysAppointments} detail="Scheduled today" />
        <StatCard icon={CalendarCheck} title="Completed appointments" value={stats.completedAppointments} detail="Completed visits" tone="success" />
        <StatCard icon={CalendarX} title="Cancelled appointments" value={stats.cancelledAppointments} detail="Cancelled visits" tone="danger" />
        <StatCard icon={FlaskConical} title="Pending lab orders" value={stats.pendingLabOrders} detail="Awaiting completion" tone="warning" />
        <StatCard icon={AlertTriangle} title="Critical lab results" value={stats.criticalLabResults} detail="Needs review" tone="danger" />
        <StatCard icon={PackageSearch} title="Low-stock medicines" value={stats.lowStockMedicines} detail="At or below reorder" tone="warning" />
        <StatCard icon={AlertTriangle} title="Expiring medicines" value={stats.expiringMedicines} detail="Within expiry window" tone="danger" />
        <StatCard icon={CreditCard} title="Revenue this month" value={currency(stats.revenueThisMonth)} detail="Completed payments" tone="success" />
        <StatCard icon={WalletCards} title="Outstanding invoices" value={currency(stats.outstandingInvoices)} detail="Open receivables" tone="warning" />
        <StatCard icon={ReceiptText} title="Occupancy percentage" value={`${stats.occupancyPercentage}%`} detail="Occupied beds / active beds" tone="primary" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ReportChart title="Bed occupancy by ward" description="Occupied and available beds grouped by ward.">
          <OccupancyChart data={analytics.charts.bedOccupancyByWard} />
        </ReportChart>
        <ReportChart title="Revenue by month" description="Completed payment revenue over the last six months.">
          <RevenueChart data={analytics.charts.revenueByMonth} />
        </ReportChart>
        <ReportChart title="Admissions over time" description="Admissions and discharges by month.">
          <AdmissionsChart data={analytics.charts.admissionsOverTime} />
        </ReportChart>
        <ReportChart title="Appointment status mix" description="Scheduled, completed, cancelled, and no-show counts.">
          <AppointmentStatusChart data={analytics.charts.appointmentStatuses} />
        </ReportChart>
        <ReportChart title="Medicine stock status" description="Healthy, low-stock, and expiring medicine batches.">
          <InventoryStatusChart data={analytics.charts.medicineStockStatus} />
        </ReportChart>
        <ReportChart title="Lab orders by status" description="Ordered, collected, processing, completed, and cancelled lab orders.">
          <LabOrdersStatusChart data={analytics.charts.labOrdersByStatus} />
        </ReportChart>
        <ReportChart title="Patient registrations by month" description="New patient record creation trend.">
          <PatientRegistrationsChart data={analytics.charts.patientRegistrationsByMonth} />
        </ReportChart>
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest operational, clinical, billing, and pharmacy events.</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardRecentActivity data={analytics.recentActivity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReportChart({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
