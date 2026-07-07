import { CreditCard, FileText, Receipt, WalletCards } from "lucide-react";
import type { BillingSummary } from "@/lib/services/billing";
import { currency } from "@/lib/utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function BillingSummaryCards({ summary }: { summary: BillingSummary }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <BillingMetric icon={FileText} title="Invoices" value={summary.totalInvoices.toString()} />
      <BillingMetric icon={WalletCards} title="Outstanding" value={currency(summary.outstanding)} />
      <BillingMetric icon={CreditCard} title="Collected" value={currency(summary.collected)} />
      <BillingMetric icon={Receipt} title="Paid invoices" value={summary.paid.toString()} />
    </div>
  );
}

function BillingMetric({ icon: Icon, title, value }: { icon: typeof FileText; title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <CardDescription>{title}</CardDescription>
        </div>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
