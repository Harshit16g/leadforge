"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { HubAuthRequest } from "@/models/crm/booking-hub.model";

interface PendingAuthRequestBannerProps {
  bookingId: string;
  request: HubAuthRequest;
  onWithdrawn: () => void;
}

const statusLabel: Record<string, string> = {
  pending:    "Awaiting customer response",
  discussing: "In discussion with customer",
};

export function PendingAuthRequestBanner({ bookingId, request, onWithdrawn }: PendingAuthRequestBannerProps) {
  const [loading, setLoading] = useState(false);

  async function withdraw() {
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/bookings/${bookingId}/auth-request/${request.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success("Request withdrawn");
      onWithdrawn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to withdraw");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--status-info-text)]/30 bg-[var(--status-info-bg)] p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--status-info-text)] capitalize">
            {request.request_type} request sent
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {statusLabel[request.status] ?? request.status}
          </p>
        </div>
        <span className="icon-[solar--hourglass-linear] size-5 text-[var(--status-info-text)] animate-spin" style={{ animationDuration: "3s" }} />
      </div>

      {request.reason && (
        <p className="text-xs text-muted-foreground italic">&ldquo;{request.reason}&rdquo;</p>
      )}

      <Button
        size="sm"
        variant="outline"
        onClick={withdraw}
        disabled={loading}
        className="text-xs"
      >
        {loading ? "Withdrawing…" : "Withdraw Request"}
      </Button>
    </div>
  );
}
