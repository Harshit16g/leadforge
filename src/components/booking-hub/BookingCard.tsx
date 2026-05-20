"use client";

import { cn } from "@/lib/utils";
import type { HubBooking } from "@/models/crm/booking-hub.model";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

interface BookingCardProps {
  booking: HubBooking;
  showPrice?: boolean;
  className?: string;
}

export function BookingCard({ booking, showPrice = false, className }: BookingCardProps) {
  const initials = booking.staff_name
    ? booking.staff_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "SA";

  return (
    <div className={cn("rounded-2xl bg-card border border-border p-5 space-y-4 shadow-sm", className)}>
      {/* Services */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Services</p>
        <p className="font-semibold text-foreground">
          {booking.services.length > 0 ? booking.services.join(", ") : "Appointment"}
        </p>
      </div>

      {/* Date / time */}
      <div className="flex items-start gap-3">
        <span className="icon-[solar--calendar-linear] size-5 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">{formatDateTime(booking.scheduled_at)}</p>
          {booking.duration_minutes && (
            <p className="text-xs text-muted-foreground">{booking.duration_minutes} min</p>
          )}
        </div>
      </div>

      {/* Stylist */}
      {booking.staff_name && (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{booking.staff_name}</p>
            <p className="text-xs text-muted-foreground">Your stylist</p>
          </div>
        </div>
      )}

      {/* Price */}
      {showPrice && booking.final_amount != null && (
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-sm font-semibold text-foreground">
            ₹{booking.final_amount.toLocaleString("en-IN")}
          </p>
        </div>
      )}
    </div>
  );
}
