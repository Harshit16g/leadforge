"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import React, { useEffect, useRef, useState } from "react";

// ai-elements
import {
  Message, MessageContent, MessageResponse,
  MessageActions, MessageAction, MessageToolbar,
} from "@/components/ai-elements/message";
import {
  Reasoning, ReasoningTrigger, ReasoningContent,
} from "@/components/ai-elements/reasoning";
import {
  Queue, QueueList, QueueSection, QueueSectionContent,
  QueueSectionLabel, QueueSectionTrigger, QueueItem,
  QueueItemContent, QueueItemIndicator,
} from "@/components/ai-elements/queue";

// Recharts
import {
  AreaChart, Area,
  BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

import type { AIMessage, AIToolTask, BusinessResult } from "./types";
import { getBaseUrl } from "@/lib/urls";

// ── Typewriter hook ───────────────────────────────────────────────────────────
// Reveals targetContent character-by-character using rAF.
// When isAnimating=false, snaps immediately to full content.
// Handles rapid content updates (streaming chunks) by continuing from current pos.
function useTypewriter(targetContent: string, isAnimating: boolean) {
  const [displayed, setDisplayed] = useState(isAnimating ? "" : targetContent);
  const [isTyping, setIsTyping] = useState(isAnimating && targetContent.length > 0);
  const posRef = useRef(isAnimating ? 0 : targetContent.length);
  const targetRef = useRef(targetContent);
  const rafRef = useRef<number | null>(null);
  // ~60 chars/sec when streaming, ~200 chars/sec for instant reveal
  const CHARS_PER_MS = 0.06;

  useEffect(() => {
    targetRef.current = targetContent;

    if (!isAnimating) {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      setDisplayed(targetContent);
      setIsTyping(false);
      posRef.current = targetContent.length;
      return;
    }

    // If we already caught up, nothing to do
    if (posRef.current >= targetContent.length) return;

    // Start loop if not already running
    if (rafRef.current) return;

    let lastTime = performance.now();
    const animate = (time: number) => {
      const elapsed = time - lastTime;
      lastTime = time;
      const add = Math.max(1, Math.ceil(elapsed * CHARS_PER_MS));
      posRef.current = Math.min(posRef.current + add, targetRef.current.length);
      setDisplayed(targetRef.current.slice(0, posRef.current));
      if (posRef.current < targetRef.current.length) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rafRef.current = null;
        setIsTyping(false);
      }
    };
    setIsTyping(true);
    rafRef.current = requestAnimationFrame(animate);
  }, [targetContent, isAnimating]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return { displayed, isTyping };
}

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, trigger: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let raf: number;
    const start = performance.now();
    const DURATION = 1100;
    const step = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, trigger]);
  return value;
}

// ── Card entrance wrapper ─────────────────────────────────────────────────────
const CARD_SPRING = { type: "spring", stiffness: 280, damping: 28, mass: 0.8 } as const;

function CardEntrance({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...CARD_SPRING, delay }}
    >
      {children}
    </m.div>
  );
}

// ── Status badge colours ──────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  confirmed:   "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  completed:   "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  pending:     "bg-amber-500/10  text-amber-600  border-amber-500/20",
  in_progress: "bg-blue-500/10   text-blue-600   border-blue-500/20",
  cancelled:   "bg-red-500/10    text-red-600    border-red-500/20",
  failed:      "bg-red-500/10    text-red-600    border-red-500/20",
};

function formatCurrency(n: number) {
  if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(2)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 px-5 py-4 bg-card/50 border border-border rounded-2xl w-fit">
      <div className="relative size-2">
        <m.div
          className="size-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
        />
        <m.div
          className="absolute inset-0 size-2 rounded-full bg-primary"
          animate={{ scale: [1, 3], opacity: [0.3, 0] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
        />
      </div>
      <div className="flex gap-[3px] items-end">
        {[0, 1, 2].map((i) => (
          <m.span
            key={i}
            className="w-1 h-1 rounded-full bg-muted-foreground/50 block"
            animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Tool result visualizations ─────────────────────────────────────────────────

function RevenueCard({ result }: { result: any }) {
  const daily: { date: string; amount: number }[] = result.daily ?? [];
  const hasChart = daily.length > 1;
  const total = result.total_revenue ?? 0;
  const animatedTotal = useCountUp(total, true);

  return (
    <CardEntrance>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
              {result.period ?? "Revenue"}
            </p>
            <m.p
              className="text-3xl font-black text-foreground leading-none"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              {formatCurrency(animatedTotal)}
            </m.p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="icon-[solar--wallet-money-bold-duotone] size-5 text-primary" />
          </div>
        </div>
        {hasChart && (
          <m.div
            className="px-2 pb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={daily} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  style={{ stopColor: "var(--primary)", stopOpacity: 0.35 }} />
                    <stop offset="95%" style={{ stopColor: "var(--primary)", stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickFormatter={formatDate} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v: unknown) => [formatCurrency(Number(v)), "Revenue"]}
                  labelFormatter={(l: unknown) => formatDate(String(l))}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--primary)"
                  fill="url(#revGrad)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </m.div>
        )}
        {result.count != null && (
          <div className="px-5 pb-4">
            <p className="text-[10px] text-muted-foreground">{result.count} completed bookings</p>
          </div>
        )}
      </div>
    </CardEntrance>
  );
}

function parseServiceNames(services: any): string {
  if (!services) return "—";
  if (typeof services === "string") {
    try { services = JSON.parse(services); } catch { return services; }
  }
  if (Array.isArray(services)) {
    const names = services
      .map((s: any) => {
        if (typeof s === "string") return s;
        return s?.name ?? s?.service_name ?? s?.title ?? null;
      })
      .filter(Boolean);
    return names.length > 0 ? names.join(", ") : "—";
  }
  if (typeof services === "object") return services.name ?? services.title ?? "—";
  return String(services);
}

function BookingsCard({ result }: { result: any[] }) {
  if (!result.length) return <p className="text-sm text-muted-foreground">No bookings found.</p>;

  return (
    <CardEntrance>
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="icon-[solar--calendar-bold-duotone] size-4 text-primary" />
        <p className="text-[10px] font-black text-foreground uppercase tracking-widest">
          {result.length} Booking{result.length !== 1 ? "s" : ""}
        </p>
      </div>
      {/* Table header */}
      <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-x-4 px-4 py-2 bg-muted/30 border-b border-border">
        {["Customer", "Services", "Time", "Amount", ""].map((h) => (
          <p key={h} className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{h}</p>
        ))}
      </div>
      <div className="divide-y divide-border">
        {result.slice(0, 10).map((b: any, i: number) => {
          const serviceNames = parseServiceNames(b.services);
          const amount = b.final_amount ?? b.total_amount ?? b.price;
          const time = b.scheduled_at ?? b.slot_time;
          const customer = b.customer_name ?? b.contact_name ?? "Unknown";
          return (
            <m.div
              key={b.id ?? i}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-x-4 gap-y-1 px-4 py-3 items-center"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
            >
              {/* Customer */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[9px] font-black shrink-0">
                  {customer[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{customer}</p>
                  {b.customer_phone && (
                    <p className="text-[9px] text-muted-foreground">{b.customer_phone}</p>
                  )}
                </div>
              </div>
              {/* Services */}
              <p className="text-[10px] text-muted-foreground truncate">{serviceNames}</p>
              {/* Time */}
              <div className="shrink-0">
                {time ? (
                  <>
                    <p className="text-[10px] font-bold text-foreground">{formatTime(time)}</p>
                    <p className="text-[9px] text-muted-foreground">{formatDate(time)}</p>
                  </>
                ) : <p className="text-[10px] text-muted-foreground">—</p>}
              </div>
              {/* Amount + status */}
              <div className="shrink-0 text-right">
                {amount != null && (
                  <p className="text-xs font-black text-foreground">{formatCurrency(Number(amount))}</p>
                )}
                {b.status && (
                  <span className={cn("px-1.5 py-0.5 rounded-full text-[8px] font-black border", STATUS_COLORS[b.status] ?? "bg-muted text-muted-foreground border-border")}>
                    {b.status}
                  </span>
                )}
              </div>
              {/* Actions */}
              {b.id && (
                <div className="shrink-0 flex items-center gap-1">
                  <a
                    href={`${getBaseUrl()}/b/${b.id}${b.hub_token ? `?t=${b.hub_token}` : ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    <span className="icon-[solar--eye-bold-duotone] size-3" />
                    Hub
                  </a>
                </div>
              )}
            </m.div>
          );
        })}
        {result.length > 10 && (
          <p className="px-4 py-2 text-[10px] text-muted-foreground">+{result.length - 10} more bookings</p>
        )}
      </div>
    </div>
    </CardEntrance>
  );
}

function StaffCard({ result }: { result: any[] }) {
  if (!result.length) return <p className="text-sm text-muted-foreground">No staff data found.</p>;

  const radarData = result.slice(0, 6).map((s: any) => ({
    subject: s.name?.split(" ")[0] ?? "Staff",
    revenue: s.revenue ?? 0,
    bookings: s.count ?? 0,
  }));

  return (
    <CardEntrance>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <span className="icon-[solar--users-group-rounded-bold-duotone] size-4 text-primary" />
          <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Staff Performance</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="p-3">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={result.slice(0, 6)} layout="vertical" margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
                <XAxis type="number" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickFormatter={(v) => formatCurrency(v)} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} width={60} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v: unknown) => [formatCurrency(Number(v)), "Revenue"]}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="revenue" fill="var(--chart-4)" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={160}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                <Radar dataKey="bookings" stroke="var(--chart-5)" fill="var(--chart-5)" fillOpacity={0.2} isAnimationActive animationDuration={1000} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </CardEntrance>
  );
}

function InventoryCard({ result }: { result: any[] }) {
  if (!result.length) return (
    <CardEntrance>
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
        <span className="icon-[solar--check-circle-bold-duotone] size-4 text-emerald-500" />
        <p className="text-xs font-bold text-emerald-600">All stock levels are healthy.</p>
      </div>
    </CardEntrance>
  );

  return (
    <CardEntrance>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-amber-500/20 bg-amber-500/5 flex items-center gap-2">
          <span className="icon-[solar--danger-triangle-bold-duotone] size-4 text-amber-500" />
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
            {result.length} Low Stock Alert{result.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="divide-y divide-border">
          {result.map((item: any, i: number) => {
            const stock = Number(item.current_stock ?? item.stock_quantity ?? 0);
            const reorder = Math.max(1, Number(item.reorder_level ?? 0));
            const pct = Math.min(100, Math.round((stock / reorder) * 100));
            const isCritical = pct < 30;
            return (
              <m.div
                key={item.id ?? i}
                className="px-4 py-3"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-bold text-foreground">{item.name}</p>
                  <p className={cn("text-[10px] font-black", isCritical ? "text-red-500" : "text-amber-500")}>
                    {stock} {item.unit ?? "units"} left
                  </p>
                </div>
                <Progress value={pct} className={cn("h-1.5", isCritical ? "[&>div]:bg-red-500" : "[&>div]:bg-amber-500")} />
                <p className="text-[9px] text-muted-foreground mt-1">Reorder at {item.reorder_level} {item.unit ?? "units"}</p>
              </m.div>
            );
          })}
        </div>
      </div>
    </CardEntrance>
  );
}

function CustomerCard({ result }: { result: any[] }) {
  if (!result.length) return <p className="text-sm text-muted-foreground">No customers found.</p>;

  return (
    <CardEntrance>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <span className="icon-[solar--user-heart-bold-duotone] size-4 text-primary" />
          <p className="text-[10px] font-black text-foreground uppercase tracking-widest">
            {result.length} Customer{result.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="divide-y divide-border">
          {result.map((c: any, i: number) => {
            const displayName = c.name ?? c.full_name ?? "?";
            const spend = c.total_spend ?? c.lifetime_spend;
            const visits = c.total_visits ?? c.visit_count ?? 0;
            const lastVisit = c.last_visit_at ?? c.last_visited_at;
            return (
              <m.div
                key={c.id ?? i}
                className="px-4 py-3 flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-black shrink-0">
                  {displayName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground">{visits} visits</p>
                </div>
                {spend != null && (
                  <p className="text-xs font-black text-foreground shrink-0">
                    {formatCurrency(Number(spend))}
                  </p>
                )}
                {lastVisit && (
                  <p className="text-[10px] text-muted-foreground shrink-0">{formatDate(lastVisit)}</p>
                )}
              </m.div>
            );
          })}
        </div>
      </div>
    </CardEntrance>
  );
}

function NotifItem({ item, delay }: { item: { label: string; value: number; icon: string; color: string }; delay: number }) {
  const animated = useCountUp(item.value, true);
  return (
    <m.div
      className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 24 }}
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", item.color.split(" ").slice(1).join(" "))}>
        <span className={cn(item.icon, "size-4", item.color.split(" ")[0])} />
      </div>
      <div>
        <p className="text-2xl font-black text-foreground leading-none">{animated}</p>
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">{item.label}</p>
      </div>
    </m.div>
  );
}

function NotificationsCard({ result }: { result: any }) {
  const items = [
    { label: "Pending Bookings",    value: result.pending_bookings ?? 0,    icon: "icon-[solar--calendar-bold-duotone]",    color: "text-amber-500  bg-amber-500/10" },
    { label: "Low Stock Items",     value: result.low_inventory_items ?? 0, icon: "icon-[solar--box-bold-duotone]",          color: "text-red-500    bg-red-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, i) => (
        <NotifItem key={item.label} item={item} delay={i * 0.1} />
      ))}
    </div>
  );
}

function SlotsCard({ result }: { result: any[] }) {
  const available = result.filter((s: any) => s.available);
  if (!available.length) return (
    <CardEntrance>
      <div className="px-4 py-3 rounded-xl border border-border bg-card text-center">
        <p className="text-sm text-muted-foreground">No available slots on this date.</p>
      </div>
    </CardEntrance>
  );

  return (
    <CardEntrance>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <span className="icon-[solar--clock-circle-bold-duotone] size-4 text-primary" />
          <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Available Slots</p>
        </div>
        <div className="p-3 grid grid-cols-4 gap-2">
          {available.map((s: any, i: number) => (
            <m.button
              key={s.time}
              className="px-2 py-2 text-[11px] font-bold text-primary border border-primary/30 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-center"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, type: "spring", stiffness: 350, damping: 22 }}
            >
              {formatTime(s.time)}
            </m.button>
          ))}
        </div>
      </div>
    </CardEntrance>
  );
}

function StagingCard({
  result,
  taskName,
  onConfirm,
  onReject,
}: {
  result: any;
  taskName: string;
  onConfirm?: (id: string) => void;
  onReject?: (id: string) => void;
}) {
  if (!result?.staging_id) return null;
  const id = result.staging_id;
  const d = result.booking_details ?? {};

  const rows = [
    { icon: "icon-[solar--user-bold-duotone]",         label: "Customer",  value: d.customer_name },
    { icon: "icon-[solar--phone-bold-duotone]",         label: "Phone",     value: d.phone },
    { icon: "icon-[solar--scissors-bold-duotone]",      label: "Service",   value: d.service_name },
    { icon: "icon-[solar--users-group-rounded-bold-duotone]", label: "Staff", value: d.staff_name },
    { icon: "icon-[solar--clock-circle-bold-duotone]",  label: "Time",      value: d.slot_time ? `${formatDate(d.slot_time)} at ${formatTime(d.slot_time)}` : null },
    { icon: "icon-[solar--notes-bold-duotone]",         label: "Notes",     value: d.notes },
  ].filter((r) => r.value);

  return (
    <CardEntrance>
      <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-2 border-b border-primary/10">
          <span className="icon-[solar--bookmark-bold-duotone] size-4 text-primary" />
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">
            Review Booking — Confirm?
          </p>
        </div>

        {rows.length > 0 && (
          <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2 border-b border-primary/10">
            {rows.map((r, i) => (
              <m.div
                key={r.label}
                className="flex items-start gap-2 min-w-0"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.25 }}
              >
                <span className={cn(r.icon, "size-3.5 text-primary/60 mt-0.5 shrink-0")} />
                <div className="min-w-0">
                  <p className="text-[9px] text-primary/50 uppercase tracking-widest font-black">{r.label}</p>
                  <p className="text-xs font-bold text-foreground truncate">{r.value}</p>
                </div>
              </m.div>
            ))}
          </div>
        )}

        <div className="px-4 py-3 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject?.(id)}
            className="h-8 px-3 text-[10px] font-black uppercase tracking-widest rounded-lg border-border hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
          >
            <span className="icon-[solar--close-circle-bold-duotone] size-3.5 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onConfirm?.(id)}
            className="h-8 px-3 text-[10px] font-black uppercase tracking-widest rounded-lg"
          >
            <span className="icon-[solar--check-circle-bold-duotone] size-3.5 mr-1" />
            Confirm Booking
          </Button>
        </div>
      </div>
    </CardEntrance>
  );
}

function ServiceCard({ result }: { result: any[] }) {
  if (!result.length) return <p className="text-sm text-muted-foreground">No services found.</p>;

  return (
    <div className="grid grid-cols-1 gap-2">
      {result.map((s: any, i: number) => (
        <m.div
          key={s.id ?? i}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground">{s.name}</p>
            {s.description && <p className="text-[10px] text-muted-foreground truncate">{s.description}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-black text-foreground">{formatCurrency(Number(s.price))}</p>
            {s.duration_minutes && (
              <p className="text-[10px] text-muted-foreground">{s.duration_minutes}m</p>
            )}
          </div>
        </m.div>
      ))}
    </div>
  );
}

// ── Business picker card ──────────────────────────────────────────────────────
function BusinessPickerCard({
  businesses,
  onSelect,
}: {
  businesses: BusinessResult[];
  onSelect?: (text: string) => void;
}) {
  if (!businesses.length) return null;

  return (
    <CardEntrance>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <span className="icon-[solar--map-point-bold-duotone] size-4 text-primary" />
          <p className="text-[10px] font-black text-foreground uppercase tracking-widest">
            {businesses.length} Business{businesses.length !== 1 ? "es" : ""} Found
          </p>
        </div>
        <div className="divide-y divide-border">
          {businesses.map((b, i) => (
            <m.div
              key={b.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm font-black shrink-0">
                {b.name[0]?.toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">{b.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {b.city && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="icon-[solar--map-point-linear] size-3" />
                      {b.city}
                    </span>
                  )}
                  {b.category && (
                    <span className="text-[10px] text-muted-foreground capitalize">· {b.category}</span>
                  )}
                </div>
                {b.description && (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{b.description}</p>
                )}
              </div>

              {/* Book button */}
              <m.button
                className="shrink-0 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20 bg-primary/5 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect?.(`I want to book at ${b.name}`)}
              >
                Book here
              </m.button>
            </m.div>
          ))}
        </div>
      </div>
    </CardEntrance>
  );
}

// ── Tool result dispatcher ────────────────────────────────────────────────────
function ToolResultViz({
  task,
  onConfirm,
  onReject,
}: {
  task: AIToolTask;
  onConfirm?: (id: string) => void;
  onReject?: (id: string) => void;
}) {
  if (task.status !== "done" || !task.result) return null;
  const r = task.result as any;

  switch (task.name) {
    case "get_revenue":           return <RevenueCard result={r} />;
    case "get_bookings":          return <BookingsCard result={r} />;
    case "get_staff_performance": return <StaffCard result={r} />;
    case "get_inventory_alerts":  return <InventoryCard result={r} />;
    case "get_customer_insights": return <CustomerCard result={r} />;
    case "get_notifications":     return <NotificationsCard result={r} />;
    case "get_available_slots":   return <SlotsCard result={r} />;
    case "get_services_list":     return <ServiceCard result={r} />;

    case "stage_booking":
    case "stage_booking_request":
      return <StagingCard result={r} taskName={task.name} onConfirm={onConfirm} onReject={onReject} />;
    default:
      return null;
  }
}

// ── Queue block (tool task tracker + inline results) ──────────────────────────
function QueueBlock({
  tasks,
  onConfirm,
  onReject,
}: {
  tasks: AIToolTask[];
  onConfirm?: (id: string) => void;
  onReject?: (id: string) => void;
}) {
  const allDone = tasks.every((t) => t.status === "done" || t.status === "error");
  const hasResults = tasks.some((t) => t.status === "done" && t.result);

  return (
    <div className="flex flex-col gap-3 w-full">
      <Queue>
        <QueueSection defaultOpen={!allDone}>
          <QueueSectionTrigger>
            <QueueSectionLabel
              label={allDone ? "completed" : "running"}
              count={tasks.length}
              icon={
                allDone
                  ? <span className="icon-[solar--check-circle-bold-duotone] size-3.5 text-emerald-500" />
                  : <span className="icon-[solar--refresh-bold-duotone] size-3.5 text-primary animate-spin" />
              }
            />
          </QueueSectionTrigger>
          <QueueSectionContent>
            <QueueList>
              {tasks.map((task) => (
                <QueueItem key={task.id}>
                  <div className="flex items-center gap-2 py-0.5">
                    <QueueItemIndicator completed={task.status === "done"} />
                    {task.icon && <span className={cn(task.icon, "size-3.5 text-muted-foreground")} />}
                    <QueueItemContent completed={task.status === "done"}>
                      {task.label}
                    </QueueItemContent>
                    <div className="ml-auto shrink-0">
                      {task.status === "pending" && (
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest">waiting</span>
                      )}
                      {task.status === "running" && (
                        <span className="icon-[solar--refresh-bold-duotone] size-3.5 text-primary animate-spin" />
                      )}
                      {task.status === "done" && (
                        <span className="icon-[solar--check-circle-bold-duotone] size-3.5 text-emerald-500" />
                      )}
                      {task.status === "error" && (
                        <span className="icon-[solar--close-circle-bold-duotone] size-3.5 text-red-500" />
                      )}
                    </div>
                  </div>
                </QueueItem>
              ))}
            </QueueList>
          </QueueSectionContent>
        </QueueSection>
      </Queue>

      {/* Inline data visualizations */}
      {hasResults && (
        <AnimatePresence>
          {tasks.map((task) =>
            task.status === "done" && task.result ? (
              <ToolResultViz key={task.id} task={task} onConfirm={onConfirm} onReject={onReject} />
            ) : null
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// ── Typewriter message — needs to be a component so hooks work inside ─────────
function TypewriterMessage({ content, isAnimating }: { content: string; isAnimating: boolean }) {
  const { displayed, isTyping } = useTypewriter(content, isAnimating);
  return (
    <MessageContent>
      <MessageResponse isAnimating={isTyping}>
        {displayed}
      </MessageResponse>
    </MessageContent>
  );
}

// ── Main renderer ─────────────────────────────────────────────────────────────
interface AIMessageRendererProps {
  message: AIMessage;
  onConfirm?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onSendMessage?: (text: string) => void;
}

export function AIMessageRenderer({ message, onConfirm, onReject, onSendMessage }: AIMessageRendererProps) {
  if (message.role === "user") {
    const textPart = message.parts.find((p) => p.type === "text");
    return (
      <Message from="user">
        <MessageContent>
          {textPart?.type === "text" ? textPart.content : ""}
        </MessageContent>
      </Message>
    );
  }

  // Loading state (no parts yet)
  if (message.isLoading && message.parts.length === 0) {
    return (
      <Message from="assistant">
        <ThinkingIndicator />
      </Message>
    );
  }

  return (
    <Message from="assistant">
      {message.parts.map((part, i) => {
        if (part.type === "reasoning") {
          return (
            <Reasoning key={i} isStreaming={part.isStreaming}>
              <ReasoningTrigger />
              <ReasoningContent>{part.content}</ReasoningContent>
            </Reasoning>
          );
        }

        if (part.type === "queue") {
          return (
            <QueueBlock
              key={i}
              tasks={part.tasks}
              onConfirm={onConfirm}
              onReject={onReject}
            />
          );
        }

        if (part.type === "businesses") {
          return (
            <BusinessPickerCard
              key={i}
              businesses={part.businesses}
              onSelect={onSendMessage}
            />
          );
        }

        if (part.type === "text" && part.content) {
          return (
            <TypewriterMessage
              key={i}
              content={part.content}
              isAnimating={message.isLoading ?? false}
            />
          );
        }

        return null;
      })}

      {/* Shimmer while streaming */}
      {message.isLoading && message.parts.length > 0 && (
        <div className="flex flex-col gap-1.5 w-full max-w-xs mt-1">
          <div className="h-2.5 rounded-full bg-muted animate-pulse w-full" />
          <div className="h-2.5 rounded-full bg-muted animate-pulse w-4/5" />
          <div className="h-2.5 rounded-full bg-muted animate-pulse w-3/5" />
        </div>
      )}

      {/* Copy button only — no model name */}
      {!message.isLoading && message.parts.some(p => p.type === "text") && (
        <MessageToolbar>
          <div />
          <MessageActions>
            <MessageAction
              tooltip="Copy response"
              onClick={() => {
                const text = message.parts
                  .filter((p) => p.type === "text")
                  .map((p) => (p as { content: string }).content)
                  .join("\n");
                navigator.clipboard.writeText(text);
              }}
            >
              <span className="icon-[solar--copy-bold-duotone] size-3.5" />
            </MessageAction>
          </MessageActions>
        </MessageToolbar>
      )}
    </Message>
  );
}

export default AIMessageRenderer;
