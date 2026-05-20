"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface GradientAreaChartProps {
  data: any[]
  config: ChartConfig
  dataKeys: string[]
  xAxisKey: string
  height?: number
  tickFormatter?: (value: string) => string
  labelFormatter?: (value: any) => React.ReactNode
  stacked?: boolean
}

export function GradientAreaChart({
  data,
  config,
  dataKeys,
  xAxisKey,
  height = 250,
  tickFormatter,
  labelFormatter,
  stacked = true,
}: GradientAreaChartProps) {
  return (
    <ChartContainer config={config} style={{ height }} className="w-full">
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ left: 12, right: 12 }}
      >
        <defs>
          {dataKeys.map((key) => (
            <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={`var(--color-${key})`} stopOpacity={0.8} />
              <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xAxisKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={tickFormatter}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={labelFormatter}
            />
          }
        />
        {dataKeys.map((key) => (
          <Area
            key={key}
            dataKey={key}
            type="natural"
            fill={`url(#fill-${key})`}
            fillOpacity={0.4}
            stroke={`var(--color-${key})`}
            {...(stacked ? { stackId: "a" } : {})}
          />
        ))}
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  )
}
