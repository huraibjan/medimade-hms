"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AppointmentsByDepartmentChart({
  data
}: {
  data: Array<{ name: string; scheduled: number; completed: number; cancelled: number }>;
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
          <Bar dataKey="scheduled" stackId="appointments" fill="#0891b2" />
          <Bar dataKey="completed" stackId="appointments" fill="#0f766e" />
          <Bar dataKey="cancelled" stackId="appointments" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
