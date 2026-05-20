import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: string;               // Solar icon class
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 space-y-4",
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <span className={cn(`icon-[${icon}] size-12 text-muted-foreground`)} />
        </div>
      )}
      
      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="pt-2">
          {action.href ? (
            <Button asChild>
              <Link href={action.href}>
                {action.label}
              </Link>
            </Button>
          ) : (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
