"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { HubRole } from "@/models/crm/booking-hub.model";

interface EscalateFooterProps {
  bookingId: string;
  role: Extract<HubRole, "employee" | "partner">;
}

export function EscalateFooter({ bookingId, role }: EscalateFooterProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/${role}/bookings/${bookingId}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim(), priority }),
      });
      if (!res.ok) {
        const err = await res.json();
        if (res.status === 409) {
          toast.info("This booking already has an open escalation ticket.");
          setOpen(false);
          return;
        }
        throw new Error(err.error ?? "Failed");
      }
      toast.success("Escalation ticket created. An admin will review shortly.");
      setOpen(false);
      setReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to escalate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-border pt-4 mt-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5 transition-colors"
        >
          <span className="icon-[solar--danger-triangle-linear] size-4" />
          Escalate this booking to admin
        </button>
      ) : (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Escalate to Admin</p>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal" className="text-xs">Normal</SelectItem>
              <SelectItem value="urgent" className="text-xs">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Describe the issue…"
            rows={3}
            className="text-sm resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={loading || !reason.trim()}>
              {loading ? "Submitting…" : "Submit"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
