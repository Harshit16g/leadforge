"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { HubAuthRequest, HubBooking } from "@/models/crm/booking-hub.model";

interface AuthRequestModalProps {
  open: boolean;
  onClose: () => void;
  request: HubAuthRequest;
  booking: HubBooking;
  onSuccess: () => void;
}

type Action = "approve" | "decline" | "discuss";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export function AuthRequestModal({ open, onClose, request, booking, onSuccess }: AuthRequestModalProps) {
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const isReschedule = request.request_type === "reschedule";
  const proposed = request.proposed_data as { scheduled_at?: string; staff_id?: string } | null;

  async function submit(selectedAction: Action) {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer/bookings/${booking.id}/auth-request/${request.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: selectedAction, reason: reason.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to respond");
      }
      toast.success(
        selectedAction === "approve" ? "Approved!" :
        selectedAction === "decline" ? "Declined" :
        "Sent to discussion"
      );
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isReschedule ? "Reschedule Request" : "Cancellation Request"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current vs proposed */}
          {isReschedule && proposed?.scheduled_at && (
            <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current time</p>
                <p className="font-medium">{formatDateTime(booking.scheduled_at)}</p>
              </div>
              <div className="h-px bg-border" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Proposed new time</p>
                <p className="font-medium text-primary">{formatDateTime(proposed.scheduled_at)}</p>
              </div>
            </div>
          )}

          {!isReschedule && (
            <div className="rounded-xl bg-[var(--status-danger-bg)] border border-[var(--status-danger-text)]/20 p-4 text-sm text-foreground">
              The salon is requesting to cancel your appointment on{" "}
              <strong>{formatDateTime(booking.scheduled_at)}</strong>.
            </div>
          )}

          {request.reason && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Salon&apos;s note</p>
              <p className="text-sm italic text-foreground">&ldquo;{request.reason}&rdquo;</p>
            </div>
          )}

          {/* Optional reason */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Add a message (optional)</p>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Any questions or comments?"
              className="text-sm resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => submit("discuss")}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <span className="icon-[solar--chat-round-dots-linear] size-4 mr-1.5" />
            Discuss
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => submit("decline")}
            disabled={loading}
            className="w-full sm:w-auto text-[var(--status-danger-text)]"
          >
            Decline
          </Button>
          <Button
            size="sm"
            onClick={() => submit("approve")}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Processing..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
