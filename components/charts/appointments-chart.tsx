"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const data = [
  { name: "Mon", value: 42 },
  { name: "Tue", value: 51 },
  { name: "Wed", value: 48 },
  { name: "Thu", value: 57 },
  { name: "Fri", value: 46 }
];

export function AppointmentsChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
