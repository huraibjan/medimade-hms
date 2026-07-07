import {
  Activity,
  Bed,
  BedDouble,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FlaskConical,
  Hospital,
  LayoutDashboard,
  PackageSearch,
  Pill,
  Settings,
  ShieldCheck,
  Stethoscope,
  Syringe,
  UsersRound
} from "lucide-react";
import type { UserRole } from "@/types/database";
import { can } from "./rbac";

export const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, permission: "dashboard:read" },
  { href: "/patients", label: "Patients", icon: UsersRound, permission: "patients:read" },
  { href: "/appointments", label: "Appointments", icon: CalendarClock, permission: "appointments:manage" },
  { href: "/admissions", label: "Admissions", icon: Bed, permission: "admissions:read" },
  { href: "/rooms", label: "Rooms & Beds", icon: BedDouble, permission: "rooms:read" },
  { href: "/staff", label: "Staff", icon: ShieldCheck, permission: "staff:manage" },
  { href: "/doctors", label: "Doctors", icon: Stethoscope, permission: "doctors:read" },
  { href: "/nurses", label: "Nurses", icon: Syringe, permission: "nurses:read" },
  { href: "/pharmacy", label: "Pharmacy", icon: Pill, permission: "pharmacy:manage" },
  { href: "/inventory", label: "Inventory", icon: PackageSearch, permission: "inventory:manage" },
  { href: "/lab", label: "Lab", icon: FlaskConical, permission: "lab:read" },
  { href: "/billing", label: "Billing", icon: CreditCard, permission: "billing:manage" },
  { href: "/reports", label: "Reports", icon: Activity, permission: "reports:read" },
  { href: "/settings", label: "Settings", icon: Settings, permission: "settings:manage" },
  { href: "/dashboard", label: "Clinical", icon: Hospital, permission: "clinical:manage" },
  { href: "/dashboard", label: "Audit Logs", icon: ClipboardList, permission: "audit:read" }
];

export function getNavigationForRole(role: UserRole | undefined) {
  return navigation.filter((item) => can(role, item.permission));
}
