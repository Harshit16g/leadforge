"use client";

import { cn } from "@/lib/utils";

export interface TimelineEvent {
  id: string;
  label: string;
  description?: string;
  timestamp: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

const variantDot: Record<string, string> = {
  default: "bg-muted-foreground",
  success: "bg-[var(--status-success-text)]",
  warning: "bg-[var(--status-warning-text)]",
  danger:  "bg-[var(--status-danger-text)]",
  info:    "bg-[var(--status-info-text)]",
};

interface BookingTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function BookingTimeline({ events, className }: BookingTimelineProps) {
  if (events.length === 0) return null;

  return (
    <div className={cn("rounded-2xl bg-card border border-border p-5 shadow-sm", className)}>
      <p className="text-sm font-semibold text-foreground mb-4">Timeline</p>
      <ol className="space-y-4">
        {events.map((event, idx) => (
          <li key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={cn("size-2.5 rounded-full mt-1 shrink-0", variantDot[event.variant ?? "default"])} />
              {idx < events.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            <div className="pb-2">
              <p className="text-sm font-medium text-foreground">{event.label}</p>
              {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
              <p className="text-xs text-muted-foreground mt-0.5">{formatTime(event.timestamp)}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
