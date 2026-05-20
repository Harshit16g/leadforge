"use client";

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────
const ITEM_H = 44; // px per row
const VISIBLE = 5; // visible rows in the drum
const PAD = ((VISIBLE - 1) / 2) * ITEM_H; // centre-align scroll padding

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

// ─── Drum Column ──────────────────────────────────────────────────────────────

function DrumColumn({
  values,
  selected,
  onChange,
  label,
}: {
  values: number[];
  selected: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  // Scroll to selected without animation on mount, animated otherwise
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const idx = values.indexOf(selected);
    if (idx < 0) return;
    el.scrollTo({ top: idx * ITEM_H, behavior: isScrolling.current ? "smooth" : "instant" });
  }, [selected, values]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    isScrolling.current = true;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, values.length - 1));
    if (values[clamped] !== selected) onChange(values[clamped]);
  }, [values, selected, onChange]);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{label}</span>
      <div className="relative w-[72px] overflow-hidden rounded-xl border border-white/10 bg-[#060C17]" style={{ height: VISIBLE * ITEM_H }}>
        {/* Top gradient mask */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[88px] bg-gradient-to-b from-[#060C17] via-[#060C17]/80 to-transparent" />
        {/* Bottom gradient mask */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[88px] bg-gradient-to-t from-[#060C17] via-[#060C17]/80 to-transparent" />
        {/* Selected row highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 z-10 border-y border-primary/40 bg-primary/8"
          style={{ top: PAD, height: ITEM_H }}
        />
        {/* Scroll container */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="scrollbar-hide h-full overflow-y-auto snap-y snap-mandatory"
          style={{ paddingTop: PAD, paddingBottom: PAD }}
        >
          {values.map((v) => (
            <div
              key={v}
              onClick={() => onChange(v)}
              className={cn(
                "flex h-11 cursor-pointer select-none items-center justify-center snap-center tabular-nums text-lg font-mono font-semibold transition-all duration-150",
                v === selected
                  ? "text-white"
                  : "text-white/25 hover:text-white/50"
              )}
            >
              {String(v).padStart(2, "0")}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface TimePickerProps {
  /** 24-hour string "HH:MM" */
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [hStr, mStr] = value.split(":");
  const hours = parseInt(hStr ?? "0", 10);
  const minutes = parseInt(mStr ?? "0", 10);

  const setHours = (h: number) =>
    onChange(`${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
  const setMinutes = (m: number) =>
    onChange(`${String(hours).padStart(2, "0")}:${String(m).padStart(2, "0")}`);

  return (
    <div className={cn("inline-flex items-end gap-3 rounded-2xl bg-[#0D1528] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] border border-white/8", className)}>
      <DrumColumn values={HOURS} selected={hours} onChange={setHours} label="Hour" />
      <div className="mb-[22px] text-3xl font-bold text-white/30 select-none">:</div>
      <DrumColumn values={MINUTES} selected={minutes} onChange={setMinutes} label="Min" />
    </div>
  );
}
