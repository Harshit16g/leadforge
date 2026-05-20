"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface RiskLeakageCardProps {
  title: string;
  amount: number;
  description: string;
  severity: "low" | "medium" | "high";
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function RiskLeakageCard({
  title,
  amount,
  description,
  severity,
  icon = "icon-[solar--shield-warning-bold-duotone]",
  action
}: RiskLeakageCardProps) {
  const severityColors = {
    low: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900",
    high: "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900",
  };

  return (
    <div className={cn(
      "p-6 rounded-3xl border transition-all hover:shadow-lg",
      severityColors[severity]
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/50 dark:bg-black/20 rounded-xl">
          <span className={cn(icon, "size-6")} />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Potential Leak</p>
          <p className="text-xl font-black">₹{amount.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-bold text-sm mb-1">{title}</h4>
          <p className="text-xs opacity-80 leading-relaxed">{description}</p>
        </div>

        {action && (
          <button
            onClick={action.onClick}
            className="w-full py-2 bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 transition-colors rounded-xl text-xs font-bold"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
