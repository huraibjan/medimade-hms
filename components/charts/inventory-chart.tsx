"use client";

import { Pie, PieChart, ResponsiveContainer } from "recharts";

const data = [
  { name: "In stock", value: 72 },
  { name: "Low stock", value: 18 },
  { name: "Expiring", value: 10 }
];

export function InventoryChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" fill="#0891b2" outerRadius={86} label />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
