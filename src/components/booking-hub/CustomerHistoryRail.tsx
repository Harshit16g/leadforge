"use client";

import { cn } from "@/lib/utils";

interface CustomerHistoryRailProps {
  visitCount: number;
  lifetimeSpend: number;
  customerName: string | null;
  customerPhone: string | null;
  className?: string;
}

export function CustomerHistoryRail({
  visitCount,
  lifetimeSpend,
  customerName,
  customerPhone,
  className,
}: CustomerHistoryRailProps) {
  return (
    <div className={cn("rounded-2xl bg-card border border-border p-5 space-y-4 shadow-sm", className)}>
      <p className="text-sm font-semibold text-foreground">Customer</p>

      {/* Identity */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
          {customerName ? customerName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?"}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{customerName ?? "Unknown"}</p>
          {customerPhone && (
            <a href={`tel:${customerPhone}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {customerPhone}
            </a>
          )}
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Total visits</p>
          <p className="text-lg font-bold text-foreground">{visitCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Lifetime spend</p>
          <p className="text-lg font-bold text-foreground">₹{lifetimeSpend.toLocaleString("en-IN")}</p>
        </div>
      </div>
    </div>
  );
}
