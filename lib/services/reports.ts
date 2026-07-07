import { format, isSameMonth, isToday, startOfMonth, subMonths } from "date-fns";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";
import { listAdmissions } from "./admissions";
import { listAppointments } from "./appointments";
import { listInvoices, listPayments } from "./billing";
import { listInventoryBatches, listExpiringSoon, listLowStock } from "./inventory";
import { listLabOrders } from "./lab";
import { listPatients } from "./patient-service";
import { listBeds, listRooms } from "./rooms";

export type ReportStats = {
  totalPatients: number;
  newPatientsThisMonth: number;
  activeAdmissions: number;
  dischargedThisMonth: number;
  availableBeds: number;
  occupiedBeds: number;
  occupancyPercentage: number;
  todaysAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  pendingLabOrders: number;
  criticalLabResults: number;
  lowStockMedicines: number;
  expiringMedicines: number;
  revenueThisMonth: number;
  outstandingInvoices: number;
};

export type ChartPoint = Record<string, string | number>;

export type RecentActivity = {
  id: string;
  type: "admission" | "appointment" | "lab" | "invoice" | "payment" | "inventory" | "patient";
  title: string;
  detail: string;
  occurredAt: string;
  status?: string;
};

export type ReportsAnalytics = {
  stats: ReportStats;
  charts: {
    bedOccupancyByWard: Array<{ name: string; occupied: number; available: number; occupancy: number }>;
    admissionsOverTime: Array<{ name: string; admissions: number; discharges: number }>;
    appointmentsByDepartment: Array<{ name: string; scheduled: number; completed: number; cancelled: number }>;
    appointmentStatuses: Array<{ name: string; value: number }>;
    revenueByMonth: Array<{ name: string; revenue: number; admissions: number; appointments: number }>;
    medicineStockStatus: Array<{ name: string; value: number }>;
    labOrdersByStatus: Array<{ name: string; value: number }>;
    patientRegistrationsByMonth: Array<{ name: string; patients: number }>;
  };
  tables: {
    lowStockMedicines: Array<{ id: string; medication_name: string; sku: string; batch_no: string; quantity_on_hand: number; reorder_level: number; expiry_date: string }>;
    expiringMedicines: Array<{ id: string; medication_name: string; sku: string; batch_no: string; quantity_on_hand: number; expiry_date: string; days_until_expiry: number }>;
  };
  recentActivity: RecentActivity[];
};

type DashboardStatsView = {
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

type RoomOccupancyView = {
  hospital_id: string;
  ward_name: string;
  occupied_beds: number;
  available_beds: number;
  occupancy_percent: number;
};

type DailyRevenueView = {
  hospital_id: string;
  revenue_date: string;
  payment_count: number;
  total_revenue: number;
};

type LowStockView = {
  id: string;
  hospital_id: string;
  medication_name: string;
  sku: string;
  batch_no: string;
  quantity_on_hand: number;
  reorder_level: number;
  expiry_date: string;
};

type ExpiringMedicineView = {
  id: string;
  hospital_id: string;
  medication_name: string;
  sku: string;
  batch_no: string;
  quantity_on_hand: number;
  expiry_date: string;
  days_until_expiry: number;
};

export async function getReportsAnalytics(hospitalId?: string | null): Promise<ReportsAnalytics> {
  const effectiveHospitalId = hospitalId ?? DEFAULT_HOSPITAL_ID;
  const [
    patients,
    admissions,
    appointments,
    beds,
    rooms,
    inventory,
    lowStock,
    expiring,
    labOrders,
    invoices,
    payments,
    viewData
  ] = await Promise.all([
    listPatients(effectiveHospitalId),
    listAdmissions(effectiveHospitalId),
    listAppointments(effectiveHospitalId),
    listBeds(effectiveHospitalId),
    listRooms(effectiveHospitalId),
    listInventoryBatches(effectiveHospitalId),
    listLowStock(effectiveHospitalId),
    listExpiringSoon(effectiveHospitalId),
    listLabOrders(effectiveHospitalId),
    listInvoices(effectiveHospitalId),
    listPayments(effectiveHospitalId),
    getViewData(effectiveHospitalId)
  ]);

  const now = new Date();
  const availableBeds = viewData.dashboard?.available_beds ?? beds.filter((bed) => bed.status === "available").length;
  const occupiedBeds = beds.filter((bed) => bed.status === "occupied").length;
  const totalBeds = Math.max(availableBeds + occupiedBeds, beds.length);
  const revenueThisMonth = payments
    .filter((payment) => payment.payment_status === "completed" && payment.paid_at && isSameMonth(new Date(payment.paid_at), now))
    .reduce((sum, payment) => sum + payment.amount, 0);
  const criticalLabResults = labOrders.reduce(
    (sum, order) => sum + (order.lab_order_items ?? []).filter((item) => item.result_status === "critical").length,
    0
  );
  const outstandingInvoices = invoices.reduce((sum, invoice) => sum + invoice.balance_due, 0);

  const stats: ReportStats = {
    totalPatients: viewData.dashboard?.total_patients ?? patients.length,
    newPatientsThisMonth: patients.filter((patient) => isSameMonth(new Date(patient.created_at), now)).length,
    activeAdmissions: viewData.dashboard?.active_admissions ?? admissions.filter((admission) => admission.status === "admitted" || admission.status === "transferred").length,
    dischargedThisMonth: admissions.filter((admission) => admission.status === "discharged" && admission.discharge_datetime && isSameMonth(new Date(admission.discharge_datetime), now)).length,
    availableBeds,
    occupiedBeds,
    occupancyPercentage: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    todaysAppointments: viewData.dashboard?.appointments_today ?? appointments.filter((appointment) => isToday(new Date(appointment.scheduled_start))).length,
    completedAppointments: appointments.filter((appointment) => appointment.status === "completed").length,
    cancelledAppointments: appointments.filter((appointment) => appointment.status === "cancelled").length,
    pendingLabOrders: viewData.dashboard?.pending_lab_orders ?? labOrders.filter((order) => ["ordered", "sample_collected", "processing"].includes(order.status)).length,
    criticalLabResults,
    lowStockMedicines: viewData.dashboard?.low_stock_items ?? lowStock.length,
    expiringMedicines: viewData.expiringMedicines.length || expiring.length,
    revenueThisMonth,
    outstandingInvoices
  };

  return {
    stats,
    charts: {
      bedOccupancyByWard: viewData.roomOccupancy.length ? viewData.roomOccupancy : occupancyFromRooms(rooms),
      admissionsOverTime: admissionsOverTime(admissions),
      appointmentsByDepartment: appointmentsByDepartment(appointments),
      appointmentStatuses: statusCounts(appointments.map((appointment) => appointment.status)),
      revenueByMonth: revenueByMonth(viewData.dailyRevenue, payments),
      medicineStockStatus: medicineStockStatus(inventory, lowStock, expiring),
      labOrdersByStatus: statusCounts(labOrders.map((order) => order.status)),
      patientRegistrationsByMonth: patientRegistrationsByMonth(patients)
    },
    tables: {
      lowStockMedicines: viewData.lowStockMedicines.length ? viewData.lowStockMedicines : lowStock.map((batch) => ({
        id: batch.id,
        medication_name: batch.medications?.name ?? batch.sku,
        sku: batch.sku,
        batch_no: batch.batch_no,
        quantity_on_hand: batch.quantity_on_hand,
        reorder_level: batch.reorder_level,
        expiry_date: batch.expiry_date
      })),
      expiringMedicines: viewData.expiringMedicines.length ? viewData.expiringMedicines : expiring.map((batch) => ({
        id: batch.id,
        medication_name: batch.medications?.name ?? batch.sku,
        sku: batch.sku,
        batch_no: batch.batch_no,
        quantity_on_hand: batch.quantity_on_hand,
        expiry_date: batch.expiry_date,
        days_until_expiry: Math.ceil((new Date(batch.expiry_date).getTime() - Date.now()) / 86_400_000)
      }))
    },
    recentActivity: recentActivity({ patients, admissions, appointments, labOrders, invoices, payments })
  };
}

async function getViewData(hospitalId: string) {
  if (!hasSupabaseEnv()) {
    return {
      dashboard: null as DashboardStatsView | null,
      roomOccupancy: [] as ReportsAnalytics["charts"]["bedOccupancyByWard"],
      dailyRevenue: [] as DailyRevenueView[],
      lowStockMedicines: [] as ReportsAnalytics["tables"]["lowStockMedicines"],
      expiringMedicines: [] as ReportsAnalytics["tables"]["expiringMedicines"]
    };
  }

  const supabase = asQueryClient(await createServerSupabaseClient());
  const [dashboard, roomOccupancy, dailyRevenue, lowStock, expiring] = await Promise.all([
    supabase.from<DashboardStatsView>("dashboard_stats_view").select("*").eq("hospital_id", hospitalId).limit(1),
    supabase.from<RoomOccupancyView>("room_occupancy_view").select("*").eq("hospital_id", hospitalId),
    supabase.from<DailyRevenueView>("daily_revenue_view").select("*").eq("hospital_id", hospitalId).order("revenue_date", { ascending: true }),
    supabase.from<LowStockView>("medicine_low_stock_view").select("*").eq("hospital_id", hospitalId),
    supabase.from<ExpiringMedicineView>("expiring_medicines_view").select("*").eq("hospital_id", hospitalId)
  ]);

  return {
    dashboard: dashboard.data?.[0] ?? null,
    roomOccupancy: groupOccupancy(roomOccupancy.data ?? []),
    dailyRevenue: dailyRevenue.data ?? [],
    lowStockMedicines: (lowStock.data ?? []).map((item) => ({ ...item, quantity_on_hand: Number(item.quantity_on_hand), reorder_level: Number(item.reorder_level) })),
    expiringMedicines: (expiring.data ?? []).map((item) => ({ ...item, quantity_on_hand: Number(item.quantity_on_hand), days_until_expiry: Number(item.days_until_expiry) }))
  };
}

function monthsBack(count = 6) {
  return Array.from({ length: count }, (_, index) => subMonths(startOfMonth(new Date()), count - index - 1));
}

function admissionsOverTime(admissions: Awaited<ReturnType<typeof listAdmissions>>) {
  return monthsBack().map((month) => ({
    name: format(month, "MMM"),
    admissions: admissions.filter((admission) => admission.admission_datetime && isSameMonth(new Date(admission.admission_datetime), month)).length,
    discharges: admissions.filter((admission) => admission.discharge_datetime && isSameMonth(new Date(admission.discharge_datetime), month)).length
  }));
}

function patientRegistrationsByMonth(patients: Awaited<ReturnType<typeof listPatients>>) {
  return monthsBack().map((month) => ({
    name: format(month, "MMM"),
    patients: patients.filter((patient) => isSameMonth(new Date(patient.created_at), month)).length
  }));
}

function appointmentsByDepartment(appointments: Awaited<ReturnType<typeof listAppointments>>) {
  const map = new Map<string, { name: string; scheduled: number; completed: number; cancelled: number }>();
  for (const appointment of appointments) {
    const name = appointment.department?.name ?? "Unassigned";
    const row = map.get(name) ?? { name, scheduled: 0, completed: 0, cancelled: 0 };
    if (appointment.status === "completed") row.completed += 1;
    else if (appointment.status === "cancelled") row.cancelled += 1;
    else row.scheduled += 1;
    map.set(name, row);
  }
  return [...map.values()].slice(0, 8);
}

function revenueByMonth(dailyRevenue: DailyRevenueView[], payments: Awaited<ReturnType<typeof listPayments>>) {
  return monthsBack().map((month) => {
    const revenue = dailyRevenue.length
      ? dailyRevenue.filter((row) => isSameMonth(new Date(row.revenue_date), month)).reduce((sum, row) => sum + Number(row.total_revenue), 0)
      : payments.filter((payment) => payment.paid_at && isSameMonth(new Date(payment.paid_at), month)).reduce((sum, payment) => sum + payment.amount, 0);
    return { name: format(month, "MMM"), revenue, admissions: 0, appointments: 0 };
  });
}

function statusCounts(statuses: string[]) {
  const map = new Map<string, number>();
  for (const status of statuses) map.set(status, (map.get(status) ?? 0) + 1);
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

function medicineStockStatus(
  inventory: Awaited<ReturnType<typeof listInventoryBatches>>,
  lowStock: Awaited<ReturnType<typeof listLowStock>>,
  expiring: Awaited<ReturnType<typeof listExpiringSoon>>
) {
  const lowIds = new Set(lowStock.map((item) => item.id));
  const expiringIds = new Set(expiring.map((item) => item.id));
  return [
    { name: "Healthy", value: inventory.filter((item) => !lowIds.has(item.id) && !expiringIds.has(item.id)).length },
    { name: "Low stock", value: lowStock.length },
    { name: "Expiring", value: expiring.length }
  ];
}

function occupancyFromRooms(rooms: Awaited<ReturnType<typeof listRooms>>) {
  const map = new Map<string, { name: string; occupied: number; available: number; occupancy: number }>();
  for (const room of rooms) {
    const name = room.wards?.name ?? "Unassigned";
    const row = map.get(name) ?? { name, occupied: 0, available: 0, occupancy: 0 };
    row.occupied += room.occupied_beds ?? 0;
    row.available += room.available_beds ?? 0;
    map.set(name, row);
  }
  return [...map.values()].map((row) => ({
    ...row,
    occupancy: row.occupied + row.available ? Math.round((row.occupied / (row.occupied + row.available)) * 100) : 0
  }));
}

function groupOccupancy(rows: RoomOccupancyView[]) {
  const map = new Map<string, { name: string; occupied: number; available: number; occupancy: number }>();
  for (const row of rows) {
    const item = map.get(row.ward_name) ?? { name: row.ward_name, occupied: 0, available: 0, occupancy: 0 };
    item.occupied += Number(row.occupied_beds);
    item.available += Number(row.available_beds);
    map.set(row.ward_name, item);
  }
  return [...map.values()].map((row) => ({
    ...row,
    occupancy: row.occupied + row.available ? Math.round((row.occupied / (row.occupied + row.available)) * 100) : 0
  }));
}

function recentActivity({
  patients,
  admissions,
  appointments,
  labOrders,
  invoices,
  payments
}: {
  patients: Awaited<ReturnType<typeof listPatients>>;
  admissions: Awaited<ReturnType<typeof listAdmissions>>;
  appointments: Awaited<ReturnType<typeof listAppointments>>;
  labOrders: Awaited<ReturnType<typeof listLabOrders>>;
  invoices: Awaited<ReturnType<typeof listInvoices>>;
  payments: Awaited<ReturnType<typeof listPayments>>;
}): RecentActivity[] {
  return [
    ...patients.map((patient) => ({
      id: `patient-${patient.id}`,
      type: "patient" as const,
      title: `${patient.first_name} ${patient.last_name}`,
      detail: `Registered ${patient.mrn}`,
      occurredAt: patient.created_at,
      status: patient.computed_status
    })),
    ...admissions.map((admission) => ({
      id: `admission-${admission.id}`,
      type: "admission" as const,
      title: admission.patient ? `${admission.patient.first_name} ${admission.patient.last_name}` : "Admission",
      detail: admission.reason,
      occurredAt: admission.admission_datetime ?? admission.created_at,
      status: admission.status
    })),
    ...appointments.map((appointment) => ({
      id: `appointment-${appointment.id}`,
      type: "appointment" as const,
      title: appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : "Appointment",
      detail: appointment.reason ?? "Scheduled visit",
      occurredAt: appointment.scheduled_start,
      status: appointment.status
    })),
    ...labOrders.map((order) => ({
      id: `lab-${order.id}`,
      type: "lab" as const,
      title: order.patients ? `${order.patients.first_name} ${order.patients.last_name}` : "Lab order",
      detail: `${order.priority} priority`,
      occurredAt: order.ordered_at,
      status: order.status
    })),
    ...invoices.map((invoice) => ({
      id: `invoice-${invoice.id}`,
      type: "invoice" as const,
      title: invoice.invoice_number,
      detail: invoice.patients ? `${invoice.patients.first_name} ${invoice.patients.last_name}` : "Invoice",
      occurredAt: invoice.created_at,
      status: invoice.status
    })),
    ...payments.map((payment) => ({
      id: `payment-${payment.id}`,
      type: "payment" as const,
      title: payment.invoices?.invoice_number ?? "Payment",
      detail: `$${payment.amount.toLocaleString()} via ${payment.payment_method}`,
      occurredAt: payment.paid_at ?? payment.created_at,
      status: payment.payment_status
    }))
  ]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 10);
}
