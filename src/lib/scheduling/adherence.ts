
export type AdherenceState =
  | "UNAPPROVED_EXCEPTION"
  | "FREE_IN_QUEUE"
  | "IN_SERVICE"
  | "BREAK"
  | "EARLY_DEPARTURE";

export interface AdherenceSegment { 
  start_min: number; 
  end_min: number; 
  state: AdherenceState 
}

const LATE_GRACE_MIN = 10;

export function computeAdherenceSegments(opts: {
  shiftStartMin: number;
  shiftEndMin:   number;
  clockedInMin:  number | null;
  clockedOutMin: number | null;
  nowMin:        number;
  actualBreaks: Array<{ startMin: number; endMin: number }>;
  bookings: Array<{ startMin: number; endMin: number }>;
}): AdherenceSegment[] {
  const {
    shiftStartMin, shiftEndMin,
    clockedInMin, clockedOutMin,
    nowMin, actualBreaks, bookings,
  } = opts;

  const segments: AdherenceSegment[] = [];
  const axisEnd = Math.min(nowMin, shiftEndMin);

  // If shift hasn't started yet, nothing to show
  if (nowMin <= shiftStartMin) return segments;

  // Case: never clocked in — entire visible window is an exception
  if (clockedInMin === null) {
    segments.push({ start_min: shiftStartMin, end_min: axisEnd, state: "UNAPPROVED_EXCEPTION" });
    return segments;
  }

  let cursor = shiftStartMin;

  // Late arrival gap
  if (clockedInMin > shiftStartMin + LATE_GRACE_MIN) {
    segments.push({ start_min: shiftStartMin, end_min: clockedInMin, state: "UNAPPROVED_EXCEPTION" });
    cursor = clockedInMin;
  }

  // Effective end of adherence bar: whichever comes first — now, clock-out, or shift end
  const effectiveEnd = clockedOutMin !== null
    ? Math.min(clockedOutMin, axisEnd)
    : axisEnd;

  // Build unified event list (breaks + bookings), clipped to [cursor, effectiveEnd]
  type Ev = { startMin: number; endMin: number; type: "break" | "booking" };
  const events: Ev[] = [
    ...actualBreaks.map(b  => ({ startMin: b.startMin,  endMin: Math.min(b.endMin,  effectiveEnd), type: "break"   as const })),
    ...bookings.map(b => ({ startMin: b.startMin, endMin: Math.min(b.endMin, effectiveEnd), type: "booking" as const })),
  ]
    .filter(e => e.startMin < effectiveEnd && e.endMin > cursor)
    .sort((a, b) => a.startMin - b.startMin);

  for (const ev of events) {
    const evStart = Math.max(ev.startMin, cursor);
    if (evStart >= effectiveEnd) break;

    // Gap before this event
    if (evStart > cursor) {
      segments.push({ start_min: cursor, end_min: evStart, state: "FREE_IN_QUEUE" });
    }

    const evEnd = Math.min(ev.endMin, effectiveEnd);
    segments.push({
      start_min: evStart,
      end_min:   evEnd,
      state:     ev.type === "booking" ? "IN_SERVICE" : "BREAK",
    });
    cursor = evEnd;
  }

  // Remaining window after all events
  if (cursor < effectiveEnd) {
    segments.push({ start_min: cursor, end_min: effectiveEnd, state: "FREE_IN_QUEUE" });
  }

  // Early departure
  if (clockedOutMin !== null && clockedOutMin < shiftEndMin && clockedOutMin <= nowMin) {
    segments.push({ start_min: clockedOutMin, end_min: shiftEndMin, state: "EARLY_DEPARTURE" });
  }

  return segments;
}
