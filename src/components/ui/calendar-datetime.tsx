"use client";

/**
 * CalendarDatetime — Single date + 24h time picker.
 * Based on shadcn calendar-24 block.
 * Replaces the native <input type="time"> with a drum-wheel TimePicker
 * so it looks and feels consistent on all devices/platforms.
 */

import * as React from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CalendarDatetimeProps {
  value?: Date;
  onChange: (date: Date) => void;
  onConfirm?: (date: Date) => void;
  placeholder?: string;
  className?: string;
}

export function CalendarDatetime({
  value,
  onChange,
  onConfirm,
  placeholder = "Pick date & time",
  className,
}: CalendarDatetimeProps) {
  const [dateOpen, setDateOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);
  const [time, setTime] = React.useState(
    value ? format(value, "HH:mm") : "10:00"
  );

  // Keep caller in sync whenever date or time changes
  React.useEffect(() => {
    if (!selectedDate) return;
    const [h, m] = time.split(":").map(Number);
    const dt = new Date(selectedDate);
    dt.setHours(h, m, 0, 0);
    onChange(dt);
  }, [selectedDate, time]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = () => {
    if (!selectedDate) return;
    const [h, m] = time.split(":").map(Number);
    const dt = new Date(selectedDate);
    dt.setHours(h, m, 0, 0);
    if (onConfirm) onConfirm(dt);
  };

  const displayDate = selectedDate
    ? format(selectedDate, "dd MMM yyyy")
    : undefined;

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/* ── Date Selector ────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/40">
          <span className="icon-[solar--calendar-bold-duotone] size-3.5 text-primary" /> Date
        </Label>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-11 w-full justify-between rounded-xl border-white/10 bg-card/5 font-normal hover:bg-card/10",
                displayDate ? "text-white/90" : "text-white/30"
              )}
            >
              {displayDate ?? placeholder}
              <span className="icon-[solar--alt-arrow-down-linear] size-4 text-white/30" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-auto p-0 border border-white/10 bg-[#0D1528] shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              captionLayout="dropdown"
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              onSelect={(d) => {
                setSelectedDate(d);
                setDateOpen(false);
              }}
              initialFocus
              classNames={{
                day_selected: "bg-primary text-white hover:bg-[var(--primary)]",
                day_today: "border border-primary/50",
                caption_label: "text-white font-semibold",
                nav_button: "text-white/60 hover:text-white hover:bg-card/10",
                head_cell: "text-white/40 font-medium",
                cell: "text-white/80",
                day: "hover:bg-card/10 rounded-lg",
                day_outside: "text-white/20",
                day_disabled: "text-white/15 cursor-not-allowed",
                root: "bg-[#0D1528]",
                dropdown: "bg-[#0D1528] text-white border border-white/10",
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Time Selector (drum wheel) ────────────────────────── */}
      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/40">
          <span className="icon-[solar--clock-circle-bold-duotone] size-3.5 text-primary" /> Time (24h)
        </Label>
        <TimePicker value={time} onChange={setTime} className="w-full" />
      </div>

      {/* ── Confirm ───────────────────────────────────────────── */}
      {onConfirm && (
        <Button
          onClick={handleConfirm}
          disabled={!selectedDate}
          className="h-11 w-full rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] font-bold text-white shadow-[0_4px_16px_rgba(255,115,93,0.35)] disabled:opacity-40 transition-all active:scale-[0.98]"
        >
          Confirm Booking Time
        </Button>
      )}
    </div>
  );
}
