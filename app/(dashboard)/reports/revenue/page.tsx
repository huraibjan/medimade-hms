import { CreditCard, WalletCards } from "lucide-react";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { StatCard } from "@/components/cards/stat-card";
import { DateRangePicker } from "@/components/filters/date-range-picker";
import { PageTitle } from "@/components/layout/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getReportsAnalytics } from "@/lib/services/reports";
import { currency } from "@/lib/utils";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function RevenueReportPage() {
  const profile = await getCurrentProfile();
  const analytics = await getReportsAnalytics(profile?.hospital_id ?? DEFAULT_HOSPITAL_ID);

  return (
    <div className="space-y-6">
      <PageTitle title="Revenue report" description="Billing performance, completed payments, and outstanding invoices." actions={<DateRangePicker />} />
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard icon={CreditCard} title="Revenue this month" value={currency(analytics.stats.revenueThisMonth)} detail="Completed payments" tone="success" />
        <StatCard icon={WalletCards} title="Outstanding invoices" value={currency(analytics.stats.outstandingInvoices)} detail="Open receivables" tone="warning" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Revenue by month</CardTitle>
          <CardDescription>Revenue trend using daily_revenue_view where available.</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={analytics.charts.revenueByMonth} />
        </CardContent>
      </Card>
    </div>
  );
}
