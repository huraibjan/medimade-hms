"use client";

import { OverviewChart } from "@/components/dashboard/overview-chart";

export function RevenueChart({
  data
}: {
  data: Array<{ name: string; revenue: number; appointments?: number; admissions?: number }>;
}) {
  return <OverviewChart data={data.map((item) => ({ admissions: 0, appointments: 0, ...item }))} />;
}
