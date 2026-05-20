import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
  contentClassName,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "bg-card/95 border border-border/80 rounded-[24px] shadow-[inset_0_0_20px_rgba(0,0,0,0.03),0_12px_24px_-4px_rgba(0,0,0,0.05)] hover:shadow-[inset_0_0_20px_rgba(0,0,0,0.03),0_20px_35px_-5px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-md overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between p-6">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {subtitle && (
            <p className="text-[12px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
      <div className={cn("px-6 pb-6", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
