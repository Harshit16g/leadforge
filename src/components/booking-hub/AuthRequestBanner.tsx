"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { HubAuthRequest } from "@/models/crm/booking-hub.model";

interface AuthRequestBannerProps {
  request: HubAuthRequest;
  onRespond: () => void;
  className?: string;
}

function timeLeft(expiresAt: string | null): string {
  if (!expiresAt) return "";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
}

export function AuthRequestBanner({ request, onRespond, className }: AuthRequestBannerProps) {
  const isReschedule = request.request_type === "reschedule";
  const label = isReschedule ? "Reschedule Request" : "Cancellation Request";
  const description = isReschedule
    ? "The salon has proposed a new time for your appointment. Please review and respond."
    : "The salon has requested to cancel your appointment. Please review and respond.";

  return (
    <div className={cn(
      "rounded-2xl border-2 border-[var(--status-warning-text)]/30 bg-[var(--status-warning-bg)] p-5 space-y-3",
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="icon-[solar--bell-bing-linear] size-5 text-[var(--status-warning-text)]" />
          <p className="text-sm font-semibold text-[var(--status-warning-text)]">{label}</p>
        </div>
        {request.expires_at && (
          <span className="text-xs text-muted-foreground shrink-0">{timeLeft(request.expires_at)}</span>
        )}
      </div>
      <p className="text-sm text-foreground">{description}</p>
      {request.reason && (
        <p className="text-xs text-muted-foreground italic">&ldquo;{request.reason}&rdquo;</p>
      )}
      <Button size="sm" onClick={onRespond} className="w-full sm:w-auto">
        Review &amp; Respond
      </Button>
    </div>
  );
}
