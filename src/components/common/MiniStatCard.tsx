import { cn } from "@/lib/utils";

interface MiniStatCardProps {
  label: string;
  value: string | number;
  className?: string;
}

export function MiniStatCard({
  label,
  value,
  className,
}: MiniStatCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-4 flex flex-col gap-1",
        className
      )}
    >
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        {label}
      </span>
      <span className="text-xl font-bold tabular-nums">
        {value}
      </span>
    </div>
  );
}
