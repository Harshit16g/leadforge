"use client"

import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

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

interface RadarChartProps {
  title: string
  description?: string
  data: any[]
  config: ChartConfig
  dataKeys: string[]
  angleKey: string
  gridFill?: boolean
  customLabel?: boolean
  footerLabel?: string
  footerTrend?: number
}

export function AnalyticsRadarChart({
  title,
  description,
  data,
  config,
  dataKeys,
  angleKey,
  gridFill = false,
  customLabel = false,
  footerLabel,
  footerTrend
}: RadarChartProps) {
  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart 
            data={data}
            margin={customLabel ? { top: 10, right: 10, bottom: 10, left: 10 } : {}}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" hideLabel={!customLabel} />}
            />
            
            <PolarGrid className={gridFill ? `fill-(--color-${dataKeys[0]}) opacity-20` : ""} />
            
            <PolarAngleAxis 
              dataKey={angleKey} 
              tick={customLabel ? ({ x, y, textAnchor, index, ...props }: any) => {
                const item = data[index]
                const yValue = typeof y === "number" ? y : 0

                return (
                  <text
                    x={x}
                    y={yValue + (index === 0 ? -10 : 0)}
                    textAnchor={textAnchor}
                    fontSize={13}
                    fontWeight={500}
                    {...props}
                  >
                    <tspan className="fill-foreground">{item[dataKeys[0]]}</tspan>
                    {dataKeys[1] && (
                      <>
                        <tspan className="fill-muted-foreground">/</tspan>
                        <tspan className="fill-foreground">{item[dataKeys[1]]}</tspan>
                      </>
                    )}
                    <tspan
                      x={x}
                      dy={"1rem"}
                      fontSize={12}
                      className="fill-muted-foreground"
                    >
                      {item[angleKey]}
                    </tspan>
                  </text>
                )
              } : undefined}
            />

            {dataKeys.map((key, index) => (
              <Radar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                fillOpacity={index === 0 ? 0.6 : 0.4}
                stroke={`var(--color-${key})`}
              />
            ))}
          </RadarChart>
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
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {footerLabel}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
