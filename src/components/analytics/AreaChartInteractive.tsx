"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TrendingUp } from "lucide-react"

interface AreaChartInteractiveProps {
  title: string
  description?: string
  data: any[]
  config: ChartConfig
  dataKeys: string[]
  xAxisKey: string
  footerTrend?: number
  footerLabel?: string
  timeRanges?: { label: string; value: string; days: number }[]
}

export function AreaChartInteractive({
  title,
  description,
  data,
  config,
  dataKeys,
  xAxisKey,
  footerTrend,
  footerLabel,
  timeRanges = [
    { label: "Last 3 months", value: "90d", days: 90 },
    { label: "Last 30 days", value: "30d", days: 30 },
    { label: "Last 7 days", value: "7d", days: 7 }
  ]
}: AreaChartInteractiveProps) {
  const [timeRange, setTimeRange] = React.useState(timeRanges[0].value)

  const filteredData = React.useMemo(() => {
    const selectedRange = timeRanges.find(r => r.value === timeRange)
    if (!selectedRange) return data

    const referenceDate = new Date()
    const startDate = new Date()
    startDate.setDate(referenceDate.getDate() - selectedRange.days)

    return data.filter((item) => {
      const date = new Date(item[xAxisKey])
      return date >= startDate
    })
  }, [data, timeRange, timeRanges, xAxisKey])

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder={timeRanges[0].label} />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {timeRanges.map(range => (
              <SelectItem key={range.value} value={range.value} className="rounded-lg">
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={config}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              {dataKeys.map(key => (
                <linearGradient key={key} id={`fill${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.8} />
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
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            
            {dataKeys.map(key => (
              <Area
                key={key}
                dataKey={key}
                type="natural"
                fill={`url(#fill${key})`}
                stroke={`var(--color-${key})`}
                stackId="a"
              />
            ))}
            
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      {(footerLabel || footerTrend) && (
        <CardFooter className="flex-col items-start gap-2 text-sm pt-4 border-t mt-4">
          {footerTrend !== undefined && (
            <div className="flex items-center gap-2 leading-none font-medium">
              Trending {footerTrend >= 0 ? "up" : "down"} by {Math.abs(footerTrend)}% <TrendingUp className={footerTrend < 0 ? "rotate-180 h-4 w-4" : "h-4 w-4"} />
            </div>
          )}
          {footerLabel && (
            <div className="leading-none text-muted-foreground">
              {footerLabel}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
