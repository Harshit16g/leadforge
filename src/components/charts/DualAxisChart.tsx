"use client";

import { Bar, BarChart, CartesianGrid, Line, ComposedChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  bookings: number;
}

const chartConfig = {
  revenue:  { label: "Revenue (₹)", color: "var(--chart-1)" },
  bookings: { label: "Bookings",    color: "var(--chart-3)" },
} satisfies ChartConfig;

const MOCK: RevenueTrendPoint[] = [
  { date: "Jan", revenue: 42000, bookings: 88 },
  { date: "Feb", revenue: 55000, bookings: 112 },
  { date: "Mar", revenue: 48000, bookings: 97 },
  { date: "Apr", revenue: 71000, bookings: 145 },
  { date: "May", revenue: 63000, bookings: 130 },
  { date: "Jun", revenue: 80000, bookings: 162 },
];

interface Props {
  data?: RevenueTrendPoint[];
}

export default function DualAxisChart({ data }: Props) {
  const chartData = data?.length ? data : MOCK;

  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <ComposedChart 
        data={chartData} 
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        syncId="kpi-sparkline-sync"
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          yAxisId="left"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10 }}
          tickMargin={4}
          tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10 }}
          tickMargin={4}
        />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <Bar
          yAxisId="left"
          dataKey="revenue"
          fill="var(--color-revenue)"
          fillOpacity={0.2}
          stroke="var(--color-revenue)"
          strokeWidth={1}
          radius={[4, 4, 0, 0]}
          animationDuration={800}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="bookings"
          stroke="var(--color-bookings)"
          strokeWidth={2.5}
          dot={false}
          animationDuration={800}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
