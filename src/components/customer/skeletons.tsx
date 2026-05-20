import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function BusinessCardSkeleton({ variant = "list" }: { variant?: "list" | "grid" }) {
  if (variant === "grid") {
    return (
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <Skeleton className="h-44 w-full rounded-none rounded-t-2xl" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card sm:flex-row">
      <Skeleton className="h-48 w-full rounded-none sm:h-auto sm:w-44 sm:rounded-l-2xl sm:rounded-r-none" />
      <div className="flex flex-1 flex-col justify-between p-5 gap-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
          <Skeleton className="h-3 w-32" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ServiceCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <Skeleton className="h-28 w-full rounded-none rounded-t-2xl" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Skeleton className="h-6 w-14" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <Skeleton className="h-52 w-full rounded-none rounded-t-2xl" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-20 rounded-md" />
        <div className="flex items-center gap-1 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="size-3 rounded-sm" />
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border mt-1">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
