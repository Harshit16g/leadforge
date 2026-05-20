"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

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
import { TrendingUp } from "lucide-react"

interface BarChartInteractiveProps {
  title: string
  description?: string
  data: any[]
  config: ChartConfig
  dataKeys: string[]
  xAxisKey: string
  variant?: "default" | "stacked"
  footerTrend?: number
  footerLabel?: string
  height?: string | number
}

export function BarChartInteractive({
  title,
  description,
  data,
  config,
  dataKeys,
  xAxisKey,
  variant = "default",
  footerTrend,
  footerLabel,
  height = 250
}: BarChartInteractiveProps) {
  const [activeChart, setActiveChart] = React.useState<string>(dataKeys[0])

  const totals = React.useMemo(() => {
    const res: Record<string, number> = {}
    dataKeys.forEach(key => {
      res[key] = data.reduce((acc, curr) => acc + (curr[key] || 0), 0)
    })
    return res
  }, [data, dataKeys])

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex">
          {dataKeys.map((key) => {
            return (
              <button
                key={key}
                data-active={activeChart === key}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
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
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
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
                />
              }
            />

            {variant === "stacked" ? (
              dataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={`var(--color-${key})`}
                  radius={index === dataKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  hide={activeChart !== key && dataKeys.length > 1}
                />
              ))
            ) : (
              <Bar
                dataKey={activeChart}
                fill={`var(--color-${activeChart})`}
                radius={[4, 4, 0, 0]}
              />
            )}

            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      {(footerLabel || footerTrend) && (
        <CardFooter className="flex-col items-start gap-2 text-sm pt-4 border-t px-6 py-4">
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
