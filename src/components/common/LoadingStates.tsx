"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * [AUDIT] Standardized Table Skeleton
 * Used for consistent loading states across all operational lists.
 */

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5, cols = 5, className }: TableSkeletonProps) {
  return (
    <div className={cn("w-full space-y-1", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-4 px-6 py-5 bg-card/50"
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className={cn("flex-1", j === 0 ? "max-w-[200px]" : "")}>
              <Skeleton className={cn(
                "h-4 rounded-lg",
                j === 0 ? "w-3/4" : "w-1/2 mx-auto"
              )} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * [AUDIT] Standardized Card Skeleton
 * For metric cards and widgets.
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card border border-border rounded-2xl p-6 space-y-4", className)}>
      <div className="flex justify-between items-start">
        <Skeleton className="h-4 w-24 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-32 rounded-lg" />
      <Skeleton className="h-4 w-40 rounded-lg" />
    </div>
  );
}
