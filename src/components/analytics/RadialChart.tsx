"use client"

import { TrendingUp } from "lucide-react"
import { 
  Label, 
  LabelList, 
  PolarGrid, 
  PolarRadiusAxis, 
  RadialBar, 
  RadialBarChart 
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface RadialChartProps {
  title: string
  description?: string
  data: any[]
  config: ChartConfig
  variant?: "label" | "stacked"
  dataKey: string
  nameKey?: string
  footerLabel?: string
  footerTrend?: number
}

export function RadialChart({
  title,
  description,
  data,
  config,
  variant = "label",
  dataKey,
  nameKey = "name",
  footerLabel,
  footerTrend
}: RadialChartProps) {
  
  const totalValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + (curr[dataKey] || 0), 0)
  }, [data, dataKey])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={data}
            {...(variant === "label" 
              ? { startAngle: -90, endAngle: 380, innerRadius: 30, outerRadius: 110 }
              : { endAngle: 180, innerRadius: 80, outerRadius: 110 }
            )}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey={nameKey} />}
            />
            
            {variant === "stacked" && <PolarGrid gridType="circle" radialLines={false} stroke="none" className="first:fill-muted last:fill-background" polarRadius={[86, 74]} />}
            
            <RadialBar 
              dataKey={dataKey} 
              background={variant === "label"}
              {...(variant === "stacked" ? { stackId: "a", cornerRadius: 5 } : {})}
            >
              {variant === "label" && (
                <LabelList
                  position="insideStart"
                  dataKey={nameKey}
                  className="fill-white capitalize mix-blend-luminosity"
                  fontSize={11}
                />
              )}
            </RadialBar>

            {variant === "stacked" && (
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 16}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {totalValue.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 4}
                            className="fill-muted-foreground"
                          >
                            Total
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </PolarRadiusAxis>
            )}
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      {(footerLabel || footerTrend) && (
        <CardFooter className="flex-col gap-2 text-sm">
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

import * as React from "react"
