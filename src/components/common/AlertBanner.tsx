import * as React from "react";
import { cn } from "@/lib/utils";

interface AlertBannerProps {
  type: 'warning' | 'danger' | 'info' | 'success';
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  className?: string;
}

const alertConfig = {
  success: {
    container: "bg-status-success-bg border-status-success-text/20 text-status-success-text",
    icon: "icon-[solar--check-circle-bold-duotone]",
  },
  warning: {
    container: "bg-status-warning-bg border-status-warning-text/20 text-status-warning-text",
    icon: "icon-[solar--danger-triangle-bold-duotone]",
  },
  danger: {
    container: "bg-status-danger-bg border-status-danger-text/20 text-status-danger-text",
    icon: "icon-[solar--danger-circle-bold-duotone]",
  },
  info: {
    container: "bg-status-info-bg border-status-info-text/20 text-status-info-text",
    icon: "icon-[solar--info-circle-bold-duotone]",
  },
};

export function AlertBanner({
  type,
  title,
  message,
  action,
  dismissible,
  className,
}: AlertBannerProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);
  const config = alertConfig[type];

  if (isDismissed) return null;

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-2xl border p-4 shadow-sm transition-all",
        config.container,
        className
      )}
    >
      <span className={cn(config.icon, "size-5 shrink-0 mt-0.5")} />
      
      <div className="flex-1 space-y-1">
        {title && <h4 className="text-sm font-bold leading-none">{title}</h4>}
        <p className="text-sm leading-normal opacity-90">{message}</p>
      </div>

      {(action || dismissible) && (
        <div className="flex items-center gap-2 shrink-0">
          {action && (
            <button
              onClick={action.onClick}
              className="text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity underline underline-offset-4"
            >
              {action.label}
            </button>
          )}
          {dismissible && (
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label="Dismiss"
            >
              <span className="icon-[solar--close-circle-linear] size-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
