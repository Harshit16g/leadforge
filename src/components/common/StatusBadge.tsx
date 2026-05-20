import { cn } from "@/lib/utils";

export type StatusVariant = 
  | 'active' | 'success' | 'completed' | 'paid' | 'converted' | 'hot'
  | 'warning' | 'pending' | 'trial' | 'arrived' | 'contacted' | 'warm' | 'negotiation'
  | 'danger' | 'suspended' | 'failed' | 'cancelled' | 'no_show' | 'lost' | 'cold' | 'stalled'
  | 'info' | 'in_progress' | 'approved' | 'confirmed' | 'in_service' | 'new' | 'qualified'
  | 'muted' | 'draft' | 'unknown' | 'pending_verification'; // muted

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const statusConfig: Record<StatusVariant, { container: string; dot: string }> = {
  active: { container: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  success: { container: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  completed: { container: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  paid: { container: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  converted: { container: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  hot: { container: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  
  warning: { container: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  pending: { container: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  trial: { container: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  arrived: { container: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  contacted: { container: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  warm: { container: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  negotiation: { container: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  
  danger: { container: "bg-rose-500/10 text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  suspended: { container: "bg-rose-500/10 text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  failed: { container: "bg-rose-500/10 text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  cancelled: { container: "bg-rose-500/10 text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  no_show: { container: "bg-rose-500/10 text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  lost: { container: "bg-rose-500/10 text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  cold: { container: "bg-rose-500/10 text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  stalled: { container: "bg-rose-500/10 text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  
  info: { container: "bg-blue-500/10 text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  in_progress: { container: "bg-blue-500/10 text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  confirmed: { container: "bg-blue-500/10 text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  in_service: { container: "bg-blue-500/10 text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  approved: { container: "bg-blue-500/10 text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  new: { container: "bg-blue-500/10 text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  qualified: { container: "bg-blue-500/10 text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  
  muted: { container: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  draft: { container: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  unknown: { container: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  pending_verification: { container: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
};

export function StatusBadge({
  status,
  label,
  size = 'md',
  dot = false,
  className,
}: StatusBadgeProps) {
   const config = statusConfig[status] || statusConfig.unknown;
  const displayLabel = label || status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium whitespace-nowrap",
        size === 'sm' ? "text-[10px]" : "text-xs",
        config.container,
        className
      )}
    >
      {dot && (
        <span className={cn("size-1.5 rounded-full", config.dot)} />
      )}
      {displayLabel}
    </div>
  );
}
