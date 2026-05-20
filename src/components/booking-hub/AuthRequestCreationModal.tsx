"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { HubBooking } from "@/models/crm/booking-hub.model";

interface AuthRequestCreationModalProps {
  open: boolean;
  onClose: () => void;
  booking: HubBooking;
  type: "reschedule" | "cancel";
  onSuccess: () => void;
}

export function AuthRequestCreationModal({ open, onClose, booking, type, onSuccess }: AuthRequestCreationModalProps) {
  const [reason, setReason] = useState("");
  const [expiryOption, setExpiryOption] = useState<"1h" | "24h" | "none">("24h");
  const [newDate, setNewDate] = useState("");
  const [loading, setLoading] = useState(false);

  const isReschedule = type === "reschedule";

  async function submit() {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      const proposedData = isReschedule && newDate
        ? { scheduled_at: new Date(newDate).toISOString() }
        : undefined;

      const res = await fetch(`/api/partner/bookings/${booking.id}/auth-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          reason: reason.trim(),
          expiry_option: expiryOption,
          proposed_data: proposedData,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 409) {
          toast.info("An active request already exists for this booking.");
          onClose();
          return;
        }
        throw new Error(err.error ?? "Failed");
      }

      toast.success(`${isReschedule ? "Reschedule" : "Cancellation"} request sent to customer`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isReschedule ? "Request Reschedule" : "Request Cancellation"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isReschedule && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Proposed new date &amp; time</label>
              <input
                type="datetime-local"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              {isReschedule ? "Reason for reschedule" : "Reason for cancellation"}
            </label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explain to the customer why…"
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Customer response window</label>
            <Select value={expiryOption} onValueChange={v => setExpiryOption(v as typeof expiryOption)}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 hour</SelectItem>
                <SelectItem value="24h">24 hours</SelectItem>
                <SelectItem value="none">No expiry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={loading || !reason.trim()}>
            {loading ? "Sending…" : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
