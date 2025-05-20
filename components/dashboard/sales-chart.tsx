"use client"

import { useTheme } from "next-themes"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  {
    name: "Jan",
    total: 4000,
    target: 4400,
  },
  {
    name: "Feb",
    total: 4200,
    target: 4400,
  },
  {
    name: "Mar",
    total: 8000,
    target: 6000,
  },
  {
    name: "Apr",
    total: 5500,
    target: 5000,
  },
  {
    name: "May",
    total: 6500,
    target: 5000,
  },
  {
    name: "Jun",
    total: 7800,
    target: 7000,
  },
]

export function SalesChart() {
  const { theme } = useTheme()

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
        <XAxis
          dataKey="name"
          stroke={theme === "dark" ? "#888888" : "#888888"}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={theme === "dark" ? "#888888" : "#888888"}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          cursor={{ fill: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
          contentStyle={{
            backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
            borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
          }}
        />
        <Legend />
        <Bar dataKey="total" name="Actual Sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
        <Bar dataKey="target" name="Target" fill="#64748b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

