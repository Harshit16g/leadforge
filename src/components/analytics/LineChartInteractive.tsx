"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, Area, AreaChart } from "recharts"

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
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
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

interface LineChartInteractiveProps {
  title: string
  description?: string
  data: any[]
  config: ChartConfig
  dataKeys: string[]
  xAxisKey: string
  footerTrend?: number
  footerLabel?: string
  variant?: "line" | "area" | "gradient"
  height?: string | number
}

export function LineChartInteractive({
  title,
  description,
  data,
  config,
  dataKeys,
  xAxisKey,
  footerTrend,
  footerLabel,
  variant = "line",
  height = 250
}: LineChartInteractiveProps) {
  const [activeChart, setActiveChart] = React.useState<string>(dataKeys[0])

  const totals = React.useMemo(() => {
    const res: Record<string, number> = {}
    dataKeys.forEach(key => {
      res[key] = data.reduce((acc, curr) => acc + (curr[key] || 0), 0)
    })
    return res
  }, [data, dataKeys])

  const ChartPrimitive = variant === "line" ? LineChart : AreaChart

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex">
          {dataKeys.map((key) => {
            return (
              <button
                key={key}
                data-active={activeChart === key}
                className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(key)}
              >
                <span className="text-xs text-muted-foreground">
                  {config[key]?.label || key}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {totals[key].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6 pt-6!">
        <ChartContainer
          config={config}
          className="aspect-auto w-full"
          style={{ height }}
        >
          <ChartPrimitive
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
            {...(variant === "gradient" ? { stackOffset: "expand" } : {})}
          >
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
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  indicator={variant === "line" ? "dot" : "line"}
                />
              }
            />
            
            {variant === "line" ? (
              <Line
                dataKey={activeChart}
                type="monotone"
                stroke={`var(--color-${activeChart})`}
                strokeWidth={2}
                dot={false}
              />
            ) : (
              dataKeys.map(key => (
                <Area
                  key={key}
                  dataKey={key}
                  type="natural"
                  fill={variant === "gradient" ? `url(#fill${key})` : `var(--color-${key})`}
                  fillOpacity={variant === "gradient" ? 0.4 : 0.1}
                  stroke={`var(--color-${key})`}
                  stackId="a"
                  hide={activeChart !== key && dataKeys.length > 1}
                />
              ))
            )}
            
            <ChartLegend content={<ChartLegendContent />} />
          </ChartPrimitive>
        </ChartContainer>
      </CardContent>
      {(footerLabel || footerTrend) && (
        <CardFooter className="flex-col items-start gap-2 text-sm pt-4">
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
