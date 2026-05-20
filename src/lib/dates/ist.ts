import { startOfDay, endOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const TZ = "Asia/Kolkata";

export function istStartOfDay(d: Date | string = new Date()): string {
  const ist = toZonedTime(d, TZ);
  const start = startOfDay(ist);
  return fromZonedTime(start, TZ).toISOString();
}

export function istEndOfDay(d: Date | string = new Date()): string {
  const ist = toZonedTime(d, TZ);
  const end = endOfDay(ist);
  return fromZonedTime(end, TZ).toISOString();
}

export function istDateStr(d: Date | string = new Date()): string {
  return toZonedTime(d, TZ).toISOString().slice(0, 10);
}

export function istNow(): Date {
  return toZonedTime(new Date(), TZ);
}

export function istHour(d: Date | string = new Date()): number {
  return toZonedTime(d, TZ).getHours();
}

export function istRange(daysBack: number = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return { start: istStartOfDay(d), end: istEndOfDay(d) };
}
