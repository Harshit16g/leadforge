"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlaTimerProps {
  createdAt: string;
  status: string;
}

export function SlaTimer({ createdAt, status }: SlaTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const isNew = status.toLowerCase() === "new";

  useEffect(() => {
    if (!isNew) {
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      const createdTime = new Date(createdAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - createdTime) / 1000);
      const remainingSeconds = 15 * 60 - elapsedSeconds; // 15 mins SLA threshold
      setTimeLeft(remainingSeconds);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [createdAt, isNew]);

  // If the lead is already responded/contacted/converted, the SLA is achieved
  if (!isNew) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10 shadow-sm">
        <CheckCircle2 className="size-3" />
        <span>Achieved</span>
      </span>
    );
  }

  if (timeLeft === null) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
        <Clock className="size-3" />
        <span>--:--</span>
      </span>
    );
  }

  const isBreached = timeLeft < 0;
  const absSeconds = Math.abs(timeLeft);
  const mins = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;
  const formattedTime = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  if (isBreached) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-xl border border-rose-500/20 animate-pulse">
        <AlertCircle className="size-3 shrink-0" />
        <span>Breach: +{formattedTime}</span>
      </span>
    );
  }

  // Warning state if less than 5 minutes left
  const isWarning = timeLeft < 5 * 60;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-black tabular-nums px-2.5 py-0.5 rounded-xl border transition-colors",
        isWarning
          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse"
          : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20"
      )}
    >
      <Clock className={cn("size-3", isWarning && "animate-spin")} />
      <span>{formattedTime} left</span>
    </span>
  );
}
