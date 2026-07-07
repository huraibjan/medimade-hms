"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const defaultData = [
  { name: "ICU", occupied: 12, available: 4 },
  { name: "Medical", occupied: 28, available: 12 },
  { name: "Surgery", occupied: 16, available: 5 }
];

export function OccupancyChart({
  data = defaultData
}: {
  data?: Array<{ name: string; occupied: number; available: number; occupancy?: number }>;
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="occupied" stackId="beds" fill="#0891b2" radius={[4, 4, 0, 0]} />
          <Bar dataKey="available" stackId="beds" fill="#99f6e4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
