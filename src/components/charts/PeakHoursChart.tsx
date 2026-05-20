"use client";

import * as React from "react";
import { Bar, CartesianGrid, XAxis, YAxis, Cell, Line, ComposedChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface BookingsPeakHour {
  hour?: number;
  label: string;
  count: number;
  target?: number;
  confidence?: number;
}

const chartConfig = {
  count: { label: "Actual Bookings", color: "hsl(var(--primary))" },
  target: { label: "Expected Target", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

interface Props {
  data: BookingsPeakHour[];
}

export default function PeakHoursChart({ data }: Props) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !data?.length) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        {!mounted ? "Loading peak hours..." : "No peak hour data available."}
      </div>
    );
  }

  // Check if target is present in data to determine if we should render composed chart
  const hasTarget = data.some(d => d.target !== undefined);

  return (
    <ChartContainer 
      config={chartConfig} 
      className="h-[220px] w-full aspect-auto [&_.recharts-cartesian-grid-horizontal_line]:stroke-border/50 [&_.recharts-cartesian-grid-vertical_line]:stroke-transparent [&_.recharts-text]:fill-muted-foreground [&_.recharts-text]:font-medium"
    >
      <ComposedChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        syncId="kpi-sparkline-sync"
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          style={{ fontSize: '10px' }}
        />
        <YAxis 
          tickLine={false} 
          axisLine={false} 
          tickMargin={8} 
          style={{ fontSize: '10px' }}
        />
        <ChartTooltip
          cursor={{ fill: "hsl(var(--primary))", opacity: 0.05 }}
          content={<ChartTooltipContent />}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={800}>
          {data.map((entry, index) => {
            const isOutperforming = hasTarget && entry.target !== undefined && entry.count >= entry.target;
            return (
              <Cell 
                key={`cell-${index}`} 
                fill={isOutperforming ? "hsl(var(--chart-2))" : "hsl(var(--primary))"}
              />
            );
          })}
        </Bar>
        {hasTarget && (
          <Line 
            type="monotone" 
            dataKey="target" 
            stroke="hsl(var(--chart-4))" 
            strokeWidth={2.5} 
            dot={{ r: 3, strokeWidth: 1.5, fill: "hsl(var(--background))" }}
            activeDot={{ r: 5 }}
            animationDuration={800}
          />
        )}
      </ComposedChart>
    </ChartContainer>
  );
}
