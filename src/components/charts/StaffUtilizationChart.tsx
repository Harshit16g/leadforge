"use client";

import React from "react";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend
} from "recharts";

interface UtilizationData {
  name: string;
  booked: number;
  idle: number;
}

interface StaffUtilizationChartProps {
  data: UtilizationData[];
  height?: number | string;
}

export function StaffUtilizationChart({ data, height = 300 }: StaffUtilizationChartProps) {
  return (
    <div style={{ height }} className="w-full [&_.recharts-text]:fill-muted-foreground [&_.recharts-text]:font-medium">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          syncId="kpi-sparkline-sync"
        >
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            style={{ fontSize: '11px' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            style={{ fontSize: '11px' }}
            unit="h"
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--primary))", opacity: 0.05 }}
            contentStyle={{ 
              borderRadius: "12px", 
              border: "1px solid hsl(var(--border))", 
              background: "hsl(var(--popover))",
              fontSize: "12px"
            }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ paddingBottom: "20px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}
          />
          <Bar 
            dataKey="booked" 
            name="Booked Hours" 
            stackId="a" 
            fill="hsl(var(--chart-3))" 
            radius={[0, 0, 0, 0]} 
            animationDuration={800}
          />
          <Bar 
            dataKey="idle" 
            name="Idle Hours" 
            stackId="a" 
            fill="hsl(var(--muted))" 
            radius={[4, 4, 0, 0]} 
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
