import { getReportsAnalytics } from "./reports";
import { getDashboardOverview as getLegacyDashboardOverview } from "./operations-service";

export async function getDashboardAnalytics(hospitalId?: string | null) {
  return getReportsAnalytics(hospitalId);
}

export const getDashboardOverview = getLegacyDashboardOverview;
