"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { Users, TrendingUp, Target, Calendar, AlertCircle, Sparkles } from "lucide-react";

/**
 * [AUDIT] Unified KPI Card Component
 * Supports both simple summary views and advanced metric views with sparklines.
 */

interface KpiCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  prefix?: string;
  suffix?: string;
  icon?: any;
  iconColor?: string;
  trend?: number | { value: number; label?: string };
  data?: { value: number; label?: string }[];
  color?: "blue" | "green" | "amber" | "purple" | "red" | "teal";
  href?: string;
  range?: string;
  isToday?: boolean;
  compact?: boolean;
  variant?: "simple" | "metric";
  footnote?: string;
  className?: string;
}

export function KpiCard({
  title,
  value,
  subValue,
  prefix,
  suffix,
  icon,
  iconColor = "text-primary",
  trend,
  data,
  color = "blue",
  href,
  range,
  isToday,
  compact,
  variant = "simple",
  footnote,
  className,
}: KpiCardProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ─── Metric Variant Logic ──────────────────────────────────────────────────

  const themeColor = (token: string, alpha?: number) =>
    alpha === undefined ? `hsl(var(${token}))` : `hsl(var(${token}) / ${alpha})`;

  // Hex fill ensures SVG standard compliance for Recharts SVG vector engines
  const colorStyles = {
    blue: { boxBg: themeColor("--primary", 0.12), boxFg: themeColor("--primary"), bars: "#3b82f6" },
    green: { boxBg: themeColor("--secondary", 0.14), boxFg: themeColor("--secondary"), bars: "#10b981" },
    amber: { boxBg: themeColor("--chart-4", 0.14), boxFg: themeColor("--chart-4"), bars: "#f59e0b" },
    purple: { boxBg: themeColor("--chart-3", 0.14), boxFg: themeColor("--chart-3"), bars: "#8b5cf6" },
    red: { boxBg: themeColor("--destructive", 0.12), boxFg: themeColor("--destructive"), bars: "#ef4444" },
    teal: { boxBg: themeColor("--chart-2", 0.14), boxFg: themeColor("--chart-2"), bars: "#14b8a6" },
  } as const;

  const titleKey = title.toLowerCase();
  const trendValue = typeof trend === "number" ? trend : trend?.value;
  const isUp = (trendValue ?? 0) >= 0;
  const isGood = titleKey.includes("expense") ? !isUp : isUp;

  // Resolve Lucide React Vector Icons dynamically to prevent Tailwind CSS dynamic key parsing omissions
  const IconComponent = icon || (() => {
    if (titleKey.includes("leads") || titleKey.includes("intake")) return Users;
    if (titleKey.includes("conversion") || titleKey.includes("rate")) return TrendingUp;
    if (titleKey.includes("roi") || titleKey.includes("revenue") || titleKey.includes("estimated")) return Target;
    if (titleKey.includes("test") || titleKey.includes("logs") || titleKey.includes("drive")) return Calendar;
    return AlertCircle;
  })();

  const ariaValue = `${prefix ?? ""}${value}${suffix ?? ""}`;
  
  const formatTooltip = (input: number) => {
    if (titleKey.includes("revenue") || titleKey.includes("expense")) return `₹${input.toLocaleString("en-IN")}`;
    if (titleKey.includes("repeat")) return `${input}%`;
    return input.toLocaleString("en-IN");
  };

  const standardizedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const maxBars = 12;
    const rawData = data.length <= maxBars ? data : (() => {
      const binSize = data.length / maxBars;
      const result = [];
      for (let i = 0; i < maxBars; i++) {
        const slice = data.slice(Math.floor(i * binSize), Math.min(data.length, Math.floor((i + 1) * binSize)));
        if (slice.length === 0) continue;
        result.push({
          label: slice[Math.floor(slice.length / 2)]?.label || "",
          value: Math.round(slice.reduce((acc, curr) => acc + curr.value, 0) / slice.length),
        });
      }
      return result;
    })();

    const maxVal = Math.max(...rawData.map(d => d.value || 0));
    const visualFloor = maxVal > 0 ? maxVal * 0.08 : 1;

    return rawData.map(d => ({
      ...d,
      originalValue: d.value || 0,
      value: (d.value || 0) === 0 ? visualFloor : (d.value || 0),
    }));
  }, [data]);

  const chartWidth = compact ? 96 : 112; 
  const chartHeight = compact ? 40 : 56; 
  const barCount = standardizedData.length || 1;
  const computedBarSize = Math.max(3, Math.min(12, Math.floor(chartWidth / (barCount * 1.5))));
  const maxOriginalVal = Math.max(0, ...standardizedData.map(d => (d as any).originalValue ?? 0));

  const rangeText = (() => {
    if (range === "today") return "vs yesterday";
    if (range === "week") return "vs last week";
    if (range === "month") return "vs last month";
    return "vs last period";
  })();

  // ─── Rendering ─────────────────────────────────────────────────────────────

  if (variant === "metric") {
    return (
      <button
        onClick={() => href && router.push(href)}
        className={cn(
          "group relative flex flex-col justify-between w-full rounded-[24px] border border-border bg-card text-left shadow-[inset_0_0_20px_rgba(0,0,0,0.035),0_12px_24px_-4px_rgba(0,0,0,0.06)] hover:shadow-[inset_0_0_20px_rgba(0,0,0,0.035),0_20px_35px_-5px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 overflow-visible",
          compact ? "p-4 aspect-[2.4]" : "p-6 aspect-[1.78]",
          className
        )}
      >
        <div className="flex h-full flex-col justify-between w-full">
          <div className="flex items-center justify-between w-full">
            <span
              className={cn("flex shrink-0 items-center justify-center rounded-[12px] transition-transform group-hover:scale-105", compact ? "h-9 w-9" : "h-11 w-11")}
              style={{ backgroundColor: colorStyles[color].boxBg, color: colorStyles[color].boxFg }}
            >
              <IconComponent className={compact ? "size-4" : "size-5"} />
            </span>
            {trendValue !== undefined && (
              <span className={cn("inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold tabular-nums transition-colors", isGood ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400")}>
                {isUp ? "↑" : "↓"} {Math.abs(trendValue)}% {rangeText}
              </span>
            )}
          </div>
          <div className={cn("mt-auto", compact ? "pt-2" : "pt-4")}>
            <p className="text-[11px] font-semibold text-muted-foreground/80 tracking-wide uppercase">{title}</p>
          </div>
          <div className={cn("flex items-end justify-between gap-4 w-full min-w-0", compact ? "mt-0.5" : "mt-1")}>
            <div className="min-w-0 flex-1">
              <p className={cn("font-bold leading-none tracking-tight text-card-foreground tabular-nums", compact ? "text-[24px]" : "text-[32px]")}>
                {prefix}{value}{suffix}
              </p>
              {subValue && !compact && <p className="mt-2 truncate text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wide">{subValue}</p>}
            </div>
            <div className={cn("shrink-0 pb-1 min-w-[60px] flex items-end justify-end", compact ? "h-10 w-24" : "h-14 w-28")}>
              {mounted && standardizedData.length > 0 ? (
                <BarChart width={chartWidth} height={chartHeight} data={standardizedData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="label" hide />
                  <YAxis domain={[0, maxOriginalVal > 0 ? "auto" : 10]} hide />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const origVal = (payload[0].payload as any).originalValue ?? payload[0].value;
                        const label = payload[0].payload.label;
                        return (
                          <div className="z-50 whitespace-nowrap rounded-lg border border-border/80 bg-background/95 backdrop-blur-sm px-2.5 py-1.5 text-[10px] font-bold text-foreground shadow-lg transition-all duration-150">
                            {label && <span className="block text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</span>}
                            <span className="block text-card-foreground">{formatTooltip(origVal as number)}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.15 }}
                    allowEscapeViewBox={{ x: true, y: true }}
                    wrapperStyle={{ zIndex: 100 }}
                  />
                  <Bar dataKey="value" fill={colorStyles[color].bars} radius={[2, 2, 0, 0]} animationDuration={800} barSize={computedBarSize} />
                </BarChart>
              ) : (
                <div className="w-full h-full flex items-center justify-end gap-1 opacity-20">
                  <div className="w-1.5 h-6 bg-slate-400 rounded animate-pulse" />
                  <div className="w-1.5 h-8 bg-slate-400 rounded animate-pulse" />
                  <div className="w-1.5 h-10 bg-slate-400 rounded animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Simple Variant (Standard)
  const isPositiveTrend = typeof trend === "object" && trend.value >= 0;
  return (
    <div className={cn("bg-card border border-border rounded-3xl shadow-sm p-6 flex flex-col gap-4 transition-shadow hover:shadow-md", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
          <div className="flex items-baseline gap-1">
            {prefix && <span className="text-xl font-semibold text-muted-foreground">{prefix}</span>}
            <span className="text-3xl font-bold tabular-nums text-foreground">{value}</span>
            {suffix && <span className="text-base font-semibold text-muted-foreground">{suffix}</span>}
          </div>
        </div>
        {IconComponent && (
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", 
            iconColor.includes("primary") ? "bg-primary/10" : 
            iconColor.includes("success") ? "bg-success/10" : 
            iconColor.includes("warning") ? "bg-warning/10" : 
            iconColor.includes("destructive") ? "bg-destructive/10" : "bg-muted")}>
            <IconComponent className={cn("size-5", iconColor)} />
          </div>
        )}
      </div>
      {(trend || footnote) && (
        <div className="flex flex-col gap-1">
          {typeof trend === "object" && (
            <div className="flex items-center gap-1.5">
              <div className={cn("flex items-center gap-0.5 text-xs font-semibold", isPositiveTrend ? "text-success" : "text-destructive")}>
                <span className={cn(isPositiveTrend ? "icon-[solar--graph-up-bold-duotone]" : "icon-[solar--graph-down-bold-duotone]", "size-4")} />
                {isPositiveTrend ? "+" : ""}{trend.value}%
              </div>
              {trend.label && <span className="text-xs text-muted-foreground">{trend.label}</span>}
            </div>
          )}
          {footnote && <p className="text-xs text-muted-foreground">{footnote}</p>}
        </div>
      )}
    </div>
  );
}
