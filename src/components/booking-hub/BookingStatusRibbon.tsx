"use client";

import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; color: string }> = {
  confirmed:                { label: "Confirmed",        color: "bg-[var(--status-info-bg)] text-[var(--status-info-text)]" },
  arrived:                  { label: "Arrived",          color: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]" },
  in_service:               { label: "In Service",       color: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]" },
  service_start_pending:    { label: "Starting Soon",    color: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]" },
  service_complete_pending: { label: "Finishing Up",     color: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]" },
  payment_pending:          { label: "Payment Pending",  color: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]" },
  completed:                { label: "Completed",        color: "bg-[var(--status-success-bg)] text-[var(--status-success-text)]" },
  cancelled:                { label: "Cancelled",        color: "bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]" },
  no_show:                  { label: "No Show",          color: "bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]" },
  pending:                  { label: "Pending",          color: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]" },
};

interface BookingStatusRibbonProps {
  status: string;
  conflict?: boolean;
  className?: string;
}

export function BookingStatusRibbon({ status, conflict, className }: BookingStatusRibbonProps) {
  const config = statusMap[status] ?? { label: status, color: "bg-muted text-muted-foreground" };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold", config.color)}>
        <span className="size-2 rounded-full bg-current opacity-70" />
        {config.label}
      </span>
      {conflict && (
        <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]">
          <span className="icon-[solar--danger-triangle-linear] size-3.5" />
          Calendar Conflict
        </span>
      )}
    </div>
  );
}
