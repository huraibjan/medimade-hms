import { addDays, format, isSameDay, isSameMonth, startOfDay, startOfMonth, subMonths } from "date-fns";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { admissions as mockAdmissions, invoices as mockInvoices, overviewSeries } from "./mock-data";
import { listAdmissions, type AdmissionRecord } from "./admissions";
import { listAppointments, type AppointmentRecord } from "./appointments";

export type DashboardOverview = {
  metrics: {
    patients: number;
    activeAdmissions: number;
    availableBeds: number;
    occupiedBeds: number;
    appointmentsToday: number;
    labPending: number;
    lowStock: number;
    monthlyRevenue: number;
    openInvoices: number;
  };
  appointments: AppointmentRecord[];
  admissions: AdmissionRecord[];
  revenue: Array<{ name: string; revenue: number; admissions: number; appointments: number }>;
  occupancy: Array<{ name: string; occupied: number; available: number }>;
  lowStockMedicines: Array<{
    id: string;
    name: string;
    sku: string;
    onHand: number;
    reorderLevel: number;
    expiresOn: string;
    status: "low_stock" | "near_expiry";
  }>;
  alerts: string[];
};

type DashboardStatsRow = {
  hospital_id: string;
  total_patients: number;
  appointments_today: number;
  active_admissions: number;
  available_beds: number;
  open_invoices: number;
  revenue_today: number;
  low_stock_items: number;
  pending_lab_orders: number;
};

type RoomOccupancyRow = {
  hospital_id: string;
  ward_name: string;
  occupied_beds: number;
  available_beds: number;
};

type DailyRevenueRow = {
  hospital_id: string;
  revenue_date: string;
  total_revenue: number;
};

type LowStockRow = {
  id: string;
  medication_name: string;
  sku: string;
  batch_no: string;
  quantity_on_hand: number;
  reorder_level: number;
  expiry_date: string;
};

type ExpiringRow = LowStockRow & { days_until_expiry: number };

const mockOccupancy = [
  { name: "ICU", occupied: 12, available: 4 },
  { name: "Emergency", occupied: 18, available: 7 },
  { name: "Medical", occupied: 28, available: 12 },
  { name: "Pediatrics", occupied: 10, available: 8 },
  { name: "Surgery", occupied: 16, available: 5 }
];

const mockLowStockMedicines: DashboardOverview["lowStockMedicines"] = [
  {
    id: "stock-atorvastatin",
    name: "Atorvastatin 20 mg",
    sku: "MED-ATV-20",
    onHand: 42,
    reorderLevel: 100,
    expiresOn: addDays(new Date(), 42).toISOString(),
    status: "low_stock"
  },
  {
    id: "stock-amoxicillin",
    name: "Amoxicillin 500 mg",
    sku: "MED-AMX-500",
    onHand: 88,
    reorderLevel: 150,
    expiresOn: addDays(new Date(), 18).toISOString(),
    status: "near_expiry"
  },
  {
    id: "stock-albuterol",
    name: "Albuterol Inhaler",
    sku: "MED-SAL-INH",
    onHand: 21,
    reorderLevel: 50,
    expiresOn: addDays(new Date(), 96).toISOString(),
    status: "low_stock"
  }
];

function monthlySeries(
  dailyRevenue: DailyRevenueRow[],
  admissions: AdmissionRecord[],
  appointments: AppointmentRecord[]
) {
  return Array.from({ length: 6 }, (_, index) => {
    const month = subMonths(startOfMonth(new Date()), 5 - index);
    return {
      name: format(month, "MMM"),
      revenue: dailyRevenue
        .filter((row) => isSameMonth(new Date(row.revenue_date), month))
        .reduce((total, row) => total + Number(row.total_revenue), 0),
      admissions: admissions.filter(
        (admission) => admission.admission_datetime && isSameMonth(new Date(admission.admission_datetime), month)
      ).length,
      appointments: appointments.filter((appointment) =>
        isSameMonth(new Date(appointment.scheduled_start), month)
      ).length
    };
  });
}

export async function getDashboardOverview(hospitalId?: string | null): Promise<DashboardOverview> {
  if (!hasSupabaseEnv() || !hospitalId) {
    const [appointments, admissions] = await Promise.all([listAppointments(null), listAdmissions(null)]);
    const monthlyRevenue = mockInvoices.reduce((total, invoice) => total + invoice.total_amount, 0);
    return {
      metrics: {
        patients: 3,
        activeAdmissions: mockAdmissions.length,
        availableBeds: mockOccupancy.reduce((total, ward) => total + ward.available, 0),
        occupiedBeds: mockOccupancy.reduce((total, ward) => total + ward.occupied, 0),
        appointmentsToday: appointments.filter((appointment) => isSameDay(new Date(appointment.scheduled_start), new Date())).length,
        monthlyRevenue,
        openInvoices: mockInvoices.filter((invoice) => invoice.status === "issued" || invoice.status === "partially_paid").length,
        lowStock: mockLowStockMedicines.length,
        labPending: 7
      },
      appointments,
      admissions,
      revenue: overviewSeries,
      occupancy: mockOccupancy,
      lowStockMedicines: mockLowStockMedicines,
      alerts: [
        "Atorvastatin 20 mg is below reorder threshold",
        "Amoxicillin batch AMX-042 expires within 30 days",
        "7 lab orders are waiting for result verification"
      ]
    };
  }

  const supabase = asQueryClient(await createServerSupabaseClient());
  const [stats, occupancyRows, lowStockRows, expiringRows, dailyRevenue, appointments, admissions] =
    await Promise.all([
      supabase.from<DashboardStatsRow>("dashboard_stats_view").select("*").eq("hospital_id", hospitalId).limit(1),
      supabase.from<RoomOccupancyRow>("room_occupancy_view").select("*").eq("hospital_id", hospitalId),
      supabase.from<LowStockRow>("medicine_low_stock_view").select("*").eq("hospital_id", hospitalId),
      supabase.from<ExpiringRow>("expiring_medicines_view").select("*").eq("hospital_id", hospitalId),
      supabase
        .from<DailyRevenueRow>("daily_revenue_view")
        .select("*")
        .eq("hospital_id", hospitalId)
        .gte("revenue_date", subMonths(startOfMonth(new Date()), 5).toISOString().slice(0, 10))
        .order("revenue_date", { ascending: true }),
      listAppointments(hospitalId),
      listAdmissions(hospitalId)
    ]);

  const statsRow = stats.data?.[0] ?? null;
  const occupancy = (occupancyRows.data ?? []).map((row) => ({
    name: row.ward_name,
    occupied: Number(row.occupied_beds),
    available: Number(row.available_beds)
  }));

  const lowStockMedicines: DashboardOverview["lowStockMedicines"] = [
    ...(lowStockRows.data ?? []).map((row) => ({
      id: row.id,
      name: row.medication_name,
      sku: row.sku,
      onHand: Number(row.quantity_on_hand),
      reorderLevel: Number(row.reorder_level),
      expiresOn: row.expiry_date,
      status: "low_stock" as const
    })),
    ...(expiringRows.data ?? [])
      .filter((row) => !(lowStockRows.data ?? []).some((lowStock) => lowStock.id === row.id))
      .map((row) => ({
        id: row.id,
        name: row.medication_name,
        sku: row.sku,
        onHand: Number(row.quantity_on_hand),
        reorderLevel: Number(row.reorder_level ?? 0),
        expiresOn: row.expiry_date,
        status: "near_expiry" as const
      }))
  ];

  const today = new Date();
  const upcomingAppointments = appointments
    .filter(
      (appointment) =>
        !["cancelled", "no_show"].includes(appointment.status) &&
        new Date(appointment.scheduled_start) >= startOfDay(today)
    )
    .slice(0, 8);
  const recentAdmissions = admissions.filter((admission) => admission.status === "admitted").slice(0, 8);

  const monthRevenue = (dailyRevenue.data ?? [])
    .filter((row) => isSameMonth(new Date(row.revenue_date), today))
    .reduce((total, row) => total + Number(row.total_revenue), 0);

  const pendingLabs = Number(statsRow?.pending_lab_orders ?? 0);
  const alerts = [
    ...lowStockMedicines
      .filter((item) => item.status === "low_stock")
      .slice(0, 2)
      .map((item) => `${item.name} is below its reorder level (${item.onHand}/${item.reorderLevel}).`),
    ...lowStockMedicines
      .filter((item) => item.status === "near_expiry")
      .slice(0, 2)
      .map((item) => `${item.name} (batch ${item.sku}) is nearing expiry on ${format(new Date(item.expiresOn), "MMM d, yyyy")}.`),
    ...(pendingLabs > 0 ? [`${pendingLabs} lab order${pendingLabs === 1 ? " is" : "s are"} awaiting processing.`] : [])
  ];

  return {
    metrics: {
      patients: Number(statsRow?.total_patients ?? 0),
      activeAdmissions: Number(statsRow?.active_admissions ?? recentAdmissions.length),
      availableBeds: Number(statsRow?.available_beds ?? occupancy.reduce((total, ward) => total + ward.available, 0)),
      occupiedBeds: occupancy.reduce((total, ward) => total + ward.occupied, 0),
      appointmentsToday: Number(
        statsRow?.appointments_today ??
          appointments.filter((appointment) => isSameDay(new Date(appointment.scheduled_start), today)).length
      ),
      monthlyRevenue: monthRevenue,
      openInvoices: Number(statsRow?.open_invoices ?? 0),
      lowStock: lowStockMedicines.length,
      labPending: pendingLabs
    },
    appointments: upcomingAppointments,
    admissions: recentAdmissions,
    revenue: monthlySeries(dailyRevenue.data ?? [], admissions, appointments),
    occupancy,
    lowStockMedicines,
    alerts
  };
}
