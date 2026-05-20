"use client"
import React, { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts"

type TimeRange = 'today' | 'week' | 'month' | 'quarter'

interface Metric {
  label: string
  key: string
  icon: string
  color: string
}

export function CustomerPulseCard({
  metrics: sourceMetrics,
  range
}: {
  metrics?: {
    online: Record<TimeRange, number>
    customers: Record<TimeRange, number>
    repeat_rate: Record<TimeRange, number>
    waitlist: Record<TimeRange, number>
    sparklines?: {
      today: Record<string, { value: number }[]>
      daily: Record<string, { value: number }[]>
    }
  }
  range: TimeRange
}) {
  const metrics: Metric[] = [
    {
      label: "ONLINE",
      key: "online",
      icon: "solar--wifi-router-bold",
      color: "primary"
    },
    {
      label: "CUSTOMERS",
      key: "customers",
      icon: "solar--users-group-two-rounded-bold",
      color: "chart-2"
    },
    {
      label: "REPEAT RATE",
      key: "repeat_rate",
      icon: "solar--refresh-circle-bold",
      color: "chart-1"
    },
    {
      label: "WAITLIST",
      key: "waitlist",
      icon: "solar--list-check-bold",
      color: "chart-4"
    },
  ]

  const trendDataMap = useMemo(() => {
    const sparklines = (sourceMetrics as any)?.sparklines
    if (!sparklines) return {}

    const rangeData = range === 'today' ? sparklines.today : sparklines.daily
    const slice = range === 'week' ? -7 : range === 'month' ? -30 : undefined

    return {
      online: (rangeData?.online || []).slice(slice),
      customers: (rangeData?.customers || []).slice(slice),
      repeat_rate: (rangeData?.repeat_rate || []).slice(slice),
      waitlist: (rangeData?.waitlist || []).slice(slice),
    }
  }, [sourceMetrics, range])

  const getColor = (color: string) => {
    const map: Record<string, string> = {
      primary: 'var(--primary)',
      'chart-1': 'var(--chart-1)',
      'chart-2': 'var(--chart-2)',
      'chart-4': 'var(--chart-4)',
    }
    const val = map[color] || 'var(--muted-foreground)'
    return val.startsWith('var') ? `hsl(${val})` : val
  }

  return (
    <div className="bg-card text-card-foreground rounded-2xl border border-border overflow-hidden h-full flex flex-col transition-all duration-500 shadow-sm dark:shadow-none">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Pulse</h3>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col divide-y divide-border">
        {metrics.map((m) => {
          const val = (sourceMetrics as any)?.[m.key]?.[range] ?? 0
          const trendData = (trendDataMap as any)[m.key] || []
          const color = getColor(m.color)
          
          return (
            <div key={m.label} className="flex-1 p-5 flex items-center gap-6 hover:bg-muted/10 transition-all group relative overflow-hidden">
              {/* Left Info */}
              <div className="flex flex-col justify-center min-w-[80px] z-10">
                <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
                  {m.key === 'repeat_rate' ? `${val}%` : val}
                </p>
                <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground mt-1.5">
                  {m.label}
                </p>
              </div>

              {/* Chart - takes remaining space */}
              <div className="flex-1 h-12 relative group-hover:scale-y-110 transition-transform duration-500">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={trendData.length > 0 ? trendData : Array(12).fill(0).map((_, i) => ({ value: 0 }))}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover border border-border px-2 py-1 rounded-md shadow-md">
                              <p className="text-[10px] font-bold tabular-nums">{payload[0].value}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                      cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={color} 
                      strokeWidth={2.5} 
                      dot={false} 
                      isAnimationActive={false}
                      strokeLinecap="round"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Icon - absolute background-ish */}
              <div className="absolute right-[-4px] bottom-[-4px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                 <span className={cn("size-24", `icon-[${m.icon}]`)} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
