"use client";

import * as React from "react";
import { Area, CartesianGrid, XAxis, YAxis, ReferenceLine, ComposedChart, Line } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface BookingsTrendPoint {
  label: string;
  online?: number;
  walkin?: number;
  expected?: number;
}

const chartConfig = {
  online: { label: "Online", color: "#6366F1" },
  walkin: { label: "Walk-in", color: "#10B981" },
  expected: { label: "Expected", color: "#94A3B8" },
} satisfies ChartConfig;

interface Props {
  data: BookingsTrendPoint[];
  isToday?: boolean;
}

export default function BookingTrendChart({ data, isToday }: Props) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !data?.length) {
    return (
      <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
        {!mounted ? "Loading charts..." : "No trend data for this period."}
      </div>
    );
  }

  // Find "Now" index if it's today
  const currentHour = new Date().getHours();
  const labels2hr = [
    "12am", "2am", "4am", "6am", "8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm", "10pm"
  ];
  const nowLabel = labels2hr[Math.min(11, Math.max(0, Math.floor(currentHour / 2)))];

  return (
    <ChartContainer 
      config={chartConfig} 
      className="h-[320px] w-full aspect-auto [&_.recharts-cartesian-grid-horizontal_line]:stroke-border/50 [&_.recharts-cartesian-grid-vertical_line]:stroke-transparent [&_.recharts-text]:fill-muted-foreground [&_.recharts-text]:font-medium"
    >
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
        syncId="kpi-sparkline-sync"
      >
        <defs>
          <linearGradient id="fillOnline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillWalkin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          style={{ fontSize: '11px' }}
        />
        <YAxis 
          tickLine={false} 
          axisLine={false} 
          tickMargin={8} 
          style={{ fontSize: '11px' }}
        />
        <ChartTooltip
          cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1.5, strokeDasharray: "4 4" }}
          content={<ChartTooltipContent indicator="dot" />}
        />
        
        {isToday && (
          <ReferenceLine 
            x={nowLabel} 
            stroke="hsl(var(--destructive))" 
            strokeDasharray="3 3"
            label={{ position: 'top', value: 'NOW', fill: 'hsl(var(--destructive))', fontSize: 10, fontWeight: 700 }}
          />
        )}

        {/* Online Curve */}
        <Area
          type="monotone"
          dataKey="online"
          stroke="#6366F1"
          strokeWidth={2.5}
          fill="url(#fillOnline)"
          activeDot={{ r: 6, strokeWidth: 0 }}
          animationDuration={800}
        />

        {/* Walk-in Curve */}
        <Area
          type="monotone"
          dataKey="walkin"
          stroke="#10B981"
          strokeWidth={2.5}
          fill="url(#fillWalkin)"
          activeDot={{ r: 6, strokeWidth: 0 }}
          animationDuration={800}
        />

        {/* Merged Expected/Forecast Baseline Curve */}
        <Line
          type="monotone"
          dataKey="expected"
          stroke="#94A3B8"
          strokeWidth={2.2}
          strokeDasharray="4 4"
          dot={false}
          activeDot={{ r: 4 }}
          animationDuration={800}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
