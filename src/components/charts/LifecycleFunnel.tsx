"use client";

import React from "react";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  LabelList
} from "recharts";

interface FunnelData {
  stage: string;
  volume: number;
  fill?: string;
}

interface LifecycleFunnelProps {
  data: FunnelData[];
  height?: number | string;
}

const STAGE_COLORS: Record<string, string> = {
  "Confirmed": "hsl(var(--chart-3))",
  "Arrived": "hsl(var(--chart-2))",
  "In-Service": "hsl(var(--chart-1))",
  "Completed": "hsl(var(--chart-4))",
  "Paid": "hsl(var(--chart-5))",
};

export function LifecycleFunnel({ data, height = 300 }: LifecycleFunnelProps) {
  return (
    <div style={{ height }} className="w-full [&_.recharts-text]:fill-muted-foreground [&_.recharts-text]:font-medium">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="stage"
            axisLine={false}
            tickLine={false}
            style={{ fontSize: '11px', fontWeight: 600 }}
            width={80}
          />
          <Tooltip
            cursor={{ fill: "transparent" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover border border-border p-3 rounded-xl shadow-md">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      {payload[0].payload.stage}
                    </p>
                    <p className="text-sm font-bold text-foreground tabular-nums">
                      {payload[0].value} <span className="text-xs font-medium text-muted-foreground">Bookings</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="volume"
            radius={[0, 4, 4, 0]}
            barSize={24}
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={STAGE_COLORS[entry.stage] || "hsl(var(--primary))"} 
              />
            ))}
            <LabelList
              dataKey="volume"
              position="right"
              style={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
