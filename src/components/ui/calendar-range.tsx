"use client";

/**
 * CalendarRange — Auto-Schedule date range selector.
 * Based on shadcn calendar-08 block.
 * Used when the customer gives a preferred date window and the platform
 * finds the best available slot within that range.
 */

import * as React from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CalendarRangeProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  onConfirm?: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
}

export function CalendarRange({
  value,
  onChange,
  onConfirm,
  placeholder = "Auto-schedule — pick date range",
  className,
}: CalendarRangeProps) {
  const [open, setOpen] = React.useState(false);

  const label = value?.from
    ? value.to
      ? `${format(value.from, "dd MMM")} – ${format(value.to, "dd MMM yyyy")}`
      : `${format(value.from, "dd MMM yyyy")} → pick end`
    : placeholder;

  const handleConfirm = () => {
    if (value?.from && onConfirm) onConfirm(value as DateRange);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-11 w-full justify-start gap-2.5 rounded-xl border-white/10 bg-card/5 text-sm font-medium hover:bg-card/10",
            value?.from ? "text-white/90" : "text-white/30",
            className
          )}
        >
          <span className="icon-[solar--calendar-bold-duotone] size-4 shrink-0 text-primary" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto p-0 border border-white/10 bg-[#0D1528] shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center gap-2 border-b border-white/8 px-5 py-3">
          <span className="icon-[solar--calendar-bold-duotone] size-3.5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/40">
            Pick your preferred window
          </span>
        </div>

        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
          initialFocus
          classNames={{
            day_selected: "bg-primary text-white hover:bg-[var(--primary)]",
            day_range_middle: "bg-primary/15 text-white rounded-none",
            day_range_start: "bg-primary text-white rounded-l-lg",
            day_range_end: "bg-primary text-white rounded-r-lg",
            day_today: "border border-primary/50",
            caption_label: "text-white font-semibold",
            nav_button: "text-white/60 hover:text-white hover:bg-card/10",
            head_cell: "text-white/40 font-medium",
            cell: "text-white/80",
            day: "hover:bg-card/10 rounded-lg",
            day_outside: "text-white/20",
            day_disabled: "text-white/15 cursor-not-allowed",
            root: "bg-[#0D1528]",
          }}
        />

        <div className="flex items-center justify-between border-t border-white/8 px-5 py-4">
          <button
            onClick={() => onChange(undefined)}
            className="text-xs font-medium text-white/30 transition hover:text-white/60"
          >
            Clear
          </button>
          <Button
            onClick={handleConfirm}
            disabled={!value?.from}
            className="h-10 gap-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] px-6 font-bold text-white shadow-[0_4px_16px_rgba(255,115,93,0.35)] disabled:opacity-40 active:scale-[0.98]"
          >
            Find Best Slot <span className="icon-[solar--arrow-right-linear] size-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
