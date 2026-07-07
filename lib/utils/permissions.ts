import type { UserRole } from "@/types/database";
import { can, ROLE_LABELS } from "@/lib/constants/rbac";

export { can, ROLE_LABELS };

export const AUTH_PATHS = ["/login", "/register", "/forgot-password"] as const;

export function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function getRoleHomePath(role: UserRole | null | undefined) {
  switch (role) {
    case "doctor":
      return "/appointments";
    case "nurse":
      return "/admissions";
    case "receptionist":
      return "/patients";
    case "pharmacist":
      return "/pharmacy";
    case "lab_technician":
      return "/lab";
    case "billing_staff":
      return "/billing";
    case "super_admin":
    case "hospital_admin":
    default:
      return "/dashboard";
  }
}

export function getRoleLabel(role: UserRole | null | undefined) {
  return role ? ROLE_LABELS[role] : "Hospital User";
}
