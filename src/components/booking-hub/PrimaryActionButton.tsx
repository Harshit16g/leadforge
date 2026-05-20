"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PrimaryActionButtonProps {
  bookingId: string;
  currentStatus: string;
  role: "employee" | "partner";
  onStatusChange: (newStatus: string) => void;
}

const TRANSITIONS: Record<string, { label: string; next: string; icon: string }> = {
  confirmed:   { label: "Mark Arrived",    next: "arrived",    icon: "icon-[solar--check-circle-linear]" },
  arrived:     { label: "Start Service",   next: "in_service", icon: "icon-[solar--play-circle-linear]" },
  in_service:  { label: "Complete",        next: "complete",   icon: "icon-[solar--flag-linear]" },
};

export function PrimaryActionButton({ bookingId, currentStatus, role, onStatusChange }: PrimaryActionButtonProps) {
  const [loading, setLoading] = useState(false);

  const transition = TRANSITIONS[currentStatus];

  if (!transition) {
    if (currentStatus === "completed") {
      return (
        <div className="flex items-center gap-2 rounded-xl bg-[var(--status-success-bg)] text-[var(--status-success-text)] px-4 py-3 text-sm font-medium">
          <span className="icon-[solar--check-circle-bold] size-5" />
          Appointment Complete
        </div>
      );
    }
    return null;
  }

  async function act() {
    setLoading(true);
    try {
      const endpoint = `/api/${role}/bookings/${bookingId}/state`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: transition.next }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      onStatusChange(transition.next === "complete" ? "completed" : transition.next);
      toast.success(`Booking marked as ${transition.label}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={act} disabled={loading} size="lg" className="w-full gap-2">
      <span className={`${transition.icon} size-5`} />
      {loading ? "Updating…" : transition.label}
    </Button>
  );
}
