"use client";

/**
 * DateTimePicker — Popover trigger wrapping CalendarDatetime.
 * Use this wherever you need an inline date+time trigger button.
 * The actual calendar+clock UI lives in calendar-datetime.tsx.
 */

import { useState } from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDatetime } from "@/components/ui/calendar-datetime";
import { cn } from "@/lib/utils";

export interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  disabled,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const display = value
    ? `${format(value, "dd MMM yyyy")}  ·  ${format(value, "HH:mm")}`
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-start gap-2.5 rounded-xl border-white/10 bg-card/5 text-sm font-medium text-white/80 hover:bg-card/10 hover:text-white",
            !display && "text-white/30",
            className
          )}
        >
          <span className="icon-[solar--calendar-bold-duotone] size-4 shrink-0 text-primary" />
          <span className="truncate">{display ?? placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 border border-white/10 bg-[#0D1528] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
      >
        <CalendarDatetime
          value={value}
          onChange={onChange}
          onConfirm={(date) => { onChange(date); setOpen(false); }}
        />
      </PopoverContent>
    </Popover>
  );
}
