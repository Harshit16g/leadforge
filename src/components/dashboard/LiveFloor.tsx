"use client";

import React from "react";
import { motion } from "framer-motion";
import { StatusBadge } from "@/components/common";
import { cn } from "@/lib/utils";

interface FloorBooking {
  id: string;
  status: string;
  customer_name: string;
  services: any[];
  scheduled_at: string;
  staff_name?: string;
}

interface LiveFloorProps {
  bookings: FloorBooking[];
  loading?: boolean;
  onCancel?: (id: string) => void;
  onArrive?: (id: string) => void;
  onNoShow?: (id: string) => void;
  onStart?: (id: string) => void;
  onPaid?: (id: string) => void;
  onComplete?: (id: string) => void;
}

export function LiveFloor({ 
  bookings, 
  loading, 
  onCancel,
  onArrive,
  onNoShow,
  onStart,
  onPaid,
  onComplete
}: LiveFloorProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  const activeBookings = bookings.filter(b => 
    ["in_progress", "in_service", "arrived", "start_pending", "service_start_pending", "complete_pending", "service_complete_pending", "payment", "payment_pending"].includes(b.status)
  );

  const upcomingBookings = bookings.filter(b => 
    ["confirmed", "pending", "notify_pending"].includes(b.status)
  ).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const renderBooking = (booking: FloorBooking, isUpcoming = false) => {
    const scheduledTime = new Date(booking.scheduled_at);
    const isLate = !isUpcoming && scheduledTime < new Date() && booking.status !== "in_progress" && booking.status !== "in_service";

    return (
      <motion.div
        key={booking.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "group flex flex-col gap-4 p-4 bg-card border rounded-2xl hover:shadow-md transition-all duration-300",
          isLate ? "border-destructive/30 bg-destructive/[0.02]" : "border-border/60 shadow-sm"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shadow-inner",
              booking.status === "in_progress" || booking.status === "in_service" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <span className={cn(
                "size-5",
                booking.status === "in_progress" || booking.status === "in_service" ? "icon-[solar--scissors-bold-duotone]" : "icon-[solar--user-bold-duotone]"
              )} />
            </div>
            <div className="min-w-0">
              <h4 className="font-black text-sm text-foreground truncate">
                {booking.customer_name}
              </h4>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[150px]">
                {booking.services?.[0]?.name || "Custom Service"}
                {booking.staff_name && ` · ${booking.staff_name}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Scheduled</p>
            <p className="text-[11px] font-black tabular-nums text-foreground">
              {scheduledTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
          <div className="flex items-center gap-2">
            <StatusBadge 
              status={
                booking.status === 'in_progress' || booking.status === 'in_service' ? 'in_service' : 
                (booking.status === 'arrived' ? 'arrived' : 
                (booking.status === 'payment' || booking.status === 'payment_pending' ? 'paid' :
                (isUpcoming ? 'muted' : 'danger')))
              } 
              label={booking.status.replace("_", " ")} 
              size="sm" 
              dot
            />
            {isLate && <span className="text-[8px] font-black text-destructive uppercase tracking-tighter bg-destructive/10 px-1.5 py-0.5 rounded-md">LATE</span>}
          </div>

          <div className="flex items-center gap-1.5">
            {booking.status === "confirmed" || booking.status === "pending" || booking.status === "notify_pending" ? (
              <>
                {onArrive && (
                  <button
                    onClick={() => onArrive(booking.id)}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                  >
                    Arrived
                  </button>
                )}
                {onNoShow && (
                  <button
                    onClick={() => onNoShow(booking.id)}
                    className="px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-[9px] font-black uppercase tracking-widest hover:bg-destructive hover:text-white transition-all"
                  >
                    No Show
                  </button>
                )}
              </>
            ) : booking.status === "arrived" ? (
              <button
                onClick={() => onStart && onStart(booking.id)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform"
              >
                Start Service
              </button>
            ) : (booking.status === "in_progress" || booking.status === "in_service") ? (
              <button
                onClick={() => onPaid && onPaid(booking.id)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform"
              >
                Paid
              </button>
            ) : (booking.status === "payment" || booking.status === "payment_pending") ? (
              <button
                onClick={() => onComplete && onComplete(booking.id)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-105 transition-transform"
              >
                Completed
              </button>
            ) : null}

            {onCancel && (
              <button
                onClick={() => onCancel(booking.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                title="Cancel Session"
              >
                <span className="icon-[solar--close-circle-bold-duotone] size-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Live Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 shrink-0 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            </span>
            Real-time Floor
          </p>
          <div className="h-px w-full bg-emerald-500/10" />
        </div>
        <div className="space-y-4">
          {activeBookings.length > 0 ? (
            activeBookings.map(b => renderBooking(b))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border/40 rounded-3xl opacity-40">
              <span className="icon-[solar--armchair-linear] size-10 mb-3 text-muted-foreground" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">The floor is quiet right now.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary shrink-0 flex items-center gap-2">
            <span className="icon-[solar--calendar-mark-bold-duotone] size-3" />
            Upcoming Queue
          </p>
          <div className="h-px w-full bg-primary/10" />
        </div>
        <div className="space-y-4">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map(b => renderBooking(b, true))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border/40 rounded-3xl opacity-40">
              <span className="icon-[solar--calendar-add-linear] size-10 mb-3 text-muted-foreground" />
              <p className="text-[10px] font-black uppercase tracking-widest">No upcoming queue</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
