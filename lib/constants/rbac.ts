import type { UserRole } from "@/types/database";

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  hospital_admin: "Hospital Admin",
  doctor: "Doctor",
  nurse: "Nurse",
  receptionist: "Receptionist",
  pharmacist: "Pharmacist",
  lab_technician: "Lab Technician",
  billing_staff: "Billing Staff"
};

export const ROLE_PERMISSIONS = {
  super_admin: ["*"],
  hospital_admin: [
    "dashboard:read",
    "hospital:manage",
    "departments:manage",
    "staff:manage",
    "doctors:read",
    "nurses:read",
    "patients:manage",
    "patients:read",
    "appointments:manage",
    "admissions:manage",
    "rooms:read",
    "clinical:read",
    "pharmacy:manage",
    "inventory:manage",
    "lab:manage",
    "billing:manage",
    "reports:read",
    "audit:read",
    "settings:manage"
  ],
  doctor: [
    "dashboard:read",
    "patients:read",
    "appointments:manage",
    "clinical:manage",
    "prescriptions:manage",
    "lab:order",
    "lab:read"
  ],
  nurse: [
    "dashboard:read",
    "patients:read",
    "admissions:read",
    "rooms:read",
    "vitals:manage",
    "nursing_notes:manage"
  ],
  receptionist: [
    "dashboard:read",
    "patients:manage",
    "rooms:read",
    "appointments:manage",
    "admissions:create"
  ],
  pharmacist: [
    "dashboard:read",
    "pharmacy:manage",
    "prescriptions:read",
    "inventory:manage"
  ],
  lab_technician: ["dashboard:read", "lab:manage", "patients:read"],
  billing_staff: ["dashboard:read", "billing:manage", "patients:read"]
} satisfies Record<UserRole, string[]>;

export function can(role: UserRole | undefined, permission: string) {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  const [resource, action] = permission.split(":");
  return (
    permissions.includes("*") ||
    permissions.includes(permission) ||
    permissions.includes(`${resource}:manage`) ||
    (action === "read" && permissions.includes(`${resource}:read`))
  );
}
