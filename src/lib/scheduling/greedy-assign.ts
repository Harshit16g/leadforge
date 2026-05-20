// ─── Greedy Auto-Assignment Algorithm ────────────────────────────────────────
// Input: booking_id, org_id, branch_id, customer_id, preferred_staff_id?
// Steps: load eligible staff → compute free slots → score → assign or waitlist

import { db } from "@/lib/db";
import type { TimeSlot } from "./availability";

export interface AutoAssignParams {
  booking_id: string;
  org_id: string;
  branch_id: string | null;
  customer_id: string;
  preferred_staff_id?: string | null;
  requested_at?: string | null; // ISO8601 — preferred appointment time
}

export interface AssignResult {
  assigned: boolean;
  waitlisted: boolean;
  booking?: {
    id: string;
    staff_id: string;
    scheduled_at: string;
    scheduling_method: string;
  };
  waitlist_id?: string;
}

interface StaffCandidate {
  id: string;
  name: string;
  buffer_time_minutes: number;
  skills: string[];
  score: number;
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function subtractInterval(
  free: TimeSlot[],
  blockStart: number,
  blockEnd: number,
): TimeSlot[] {
  const result: TimeSlot[] = [];
  for (const slot of free) {
    const s = toMinutes(slot.start_time);
    const e = toMinutes(slot.end_time);
    if (blockEnd <= s || blockStart >= e) {
      result.push(slot);
    } else {
      if (blockStart > s) result.push({ start_time: slot.start_time, end_time: fromMinutes(blockStart) });
      if (blockEnd < e) result.push({ start_time: fromMinutes(blockEnd), end_time: slot.end_time });
    }
  }
  return result;
}

async function computeFreeSlots(
  staffId: string,
  date: string,
  businessOpen: string,
  businessClose: string,
  bufferMin: number,
): Promise<TimeSlot[]> {
  const crm = db("crm");
  const scheduling = db("scheduling");

  let freeSlots: TimeSlot[] = [];

  const { data: roster } = await scheduling.from("staff_availability")
    .select("start_time, end_time, block_type")
    .eq("staff_id", staffId)
    .eq("date", date)
    .eq("is_active", true);

  const businessStartMin = toMinutes(businessOpen);
  const businessEndMin = toMinutes(businessClose);

  const hasAvailableBlock = (roster ?? []).some((r: any) => r.block_type === "available");
  const hasFullDayOff = (roster ?? []).some(
    (r: any) => (r.block_type === "leave" || r.block_type === "blocked") &&
         toMinutes(r.start_time) <= businessStartMin &&
         toMinutes(r.end_time) >= businessEndMin,
  );

  if (hasFullDayOff) return [];

  if (hasAvailableBlock) {
    for (const r of roster ?? []) {
      if (r.block_type === "available") {
        freeSlots.push({ start_time: r.start_time, end_time: r.end_time });
      }
    }
  } else {
    // Default-open: use business hours as the working window
    freeSlots = [{ start_time: businessOpen, end_time: businessClose }];
  }

  // Subtract Bookings
  const { data: bookings } = await crm.from("bookings")
    .select("scheduled_at, services")
    .eq("staff_id", staffId)
    .gte("scheduled_at", `${date}T00:00:00`)
    .lt("scheduled_at", `${date}T23:59:59`)
    .not("status", "in", '("cancelled","no_show")');

  for (const b of bookings ?? []) {
    const services = Array.isArray(b.services) ? b.services : [];
    const duration = services.reduce((s: number, sv: any) => s + (sv.duration_minutes || sv.duration || 0), 0) || 30;
    const bStart = toMinutes(new Date(b.scheduled_at).toTimeString().slice(0, 5));
    const bEnd = bStart + duration + bufferMin;
    freeSlots = subtractInterval(freeSlots, bStart, bEnd);
  }

  // Subtract non-available blocks (breaks, lunch)
  for (const bl of roster ?? []) {
    if (bl.block_type !== "available") {
      freeSlots = subtractInterval(freeSlots, toMinutes(bl.start_time), toMinutes(bl.end_time));
    }
  }

  return freeSlots;
}

function scoreCandidates(
  candidates: Array<{ staff: StaffCandidate; bookedMins: number; workingMins: number }>,
  isVip: boolean,
  preferredStaffId?: string | null,
): Array<{ staff: StaffCandidate; score: number }> {
  return candidates.map(({ staff, bookedMins, workingMins }) => {
    const utilization = workingMins > 0 ? bookedMins / workingMins : 0;
    let score = 1 - utilization; // higher = less busy = preferred
    if (isVip) score += 0.5;
    if (preferredStaffId && staff.id === preferredStaffId) score += 1;
    return { staff, score };
  }).sort((a, b) => b.score - a.score);
}

/**
 * autoAssign — main greedy auto-assignment entry point.
 * Tries up to 3 future dates to find an open slot.
 * Falls back to scheduling.waitlist if nothing found.
 */
export async function autoAssign(params: AutoAssignParams): Promise<AssignResult> {
  const { booking_id, org_id, branch_id, customer_id, preferred_staff_id, requested_at } = params;
  const ops = db("ops");
  const crm = db("crm");
  const scheduling = db("scheduling");

  // Load booking
  const { data: booking } = await crm.from("bookings")
    .select("services, customer_id")
    .eq("id", booking_id)
    .single();

  if (!booking) return { assigned: false, waitlisted: false };

  const services = Array.isArray(booking.services) ? booking.services : [];
  const serviceId: string = services[0]?.product_id || services[0]?.id || "";
  const durationMins: number = services.reduce((s: number, sv: any) => s + (sv.duration_minutes || sv.duration || 0), 0) || 30;
  const resolvedCustomerId: string = booking.customer_id || customer_id;

  // Load config
  let configQuery = scheduling.from("configs").select("*").eq("org_id", org_id);
  if (branch_id) configQuery = configQuery.eq("branch_id", branch_id);
  else configQuery = configQuery.is("branch_id", null);
  const { data: config } = await configQuery.maybeSingle();

  const businessHours = (config?.business_hours ?? {}) as Record<string, { open: string; close: string; closed?: boolean }>;
  const bufferDefault: number = config?.buffer_default_minutes ?? 10;

  // Check if customer is VIP
  const { data: customer } = await crm.from("customers")
    .select("customer_type")
    .eq("id", resolvedCustomerId)
    .maybeSingle();
  const isVip = customer?.customer_type === "vip";

  // Load eligible staff (skills must contain serviceId)
  let staffQuery = ops.from("staff_members")
    .select("id, name, buffer_time_minutes, skills")
    .eq("org_id", org_id)
    .eq("is_active", true)
    .contains("skills", [serviceId]);
  if (branch_id) staffQuery = staffQuery.eq("branch_id", branch_id);
  const { data: staffList } = await staffQuery;

  if (!staffList?.length) {
    return await insertWaitlist(params, serviceId);
  }

  // Build candidate date window: requested_at (or today) ±0, +1, +2, +3 days
  const baseDate = requested_at ? new Date(requested_at) : new Date();
  const datesToTry: string[] = [];
  for (let i = 0; i <= 3; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    datesToTry.push(d.toISOString().slice(0, 10));
  }

  for (const date of datesToTry) {
    const dayKey = ["sun","mon","tue","wed","thu","fri","sat"][new Date(date).getDay()];
    const hours = businessHours[dayKey];
    if (!hours || hours.closed) continue;

    const businessOpen = hours.open;
    const businessClose = hours.close;
    const workingMins = toMinutes(businessClose) - toMinutes(businessOpen);

    // For each staff: load booked mins + compute free slots
    const candidateData = await Promise.all(
      (staffList as StaffCandidate[]).map(async (staff) => {
        const bufferMin = staff.buffer_time_minutes ?? bufferDefault;
        const { data: bookings } = await crm.from("bookings")
          .select("services")
          .eq("staff_id", staff.id)
          .gte("scheduled_at", `${date}T00:00:00`)
          .lt("scheduled_at", `${date}T23:59:59`)
          .not("status", "in", '("cancelled","no_show")');
        const bookedMins = (bookings ?? []).reduce(
          (sum: number, b: any) => {
            const services = Array.isArray(b.services) ? b.services : [];
            const duration = services.reduce((s: number, sv: any) => s + (sv.duration_minutes || sv.duration || 0), 0) || 30;
            return sum + duration;
          },
          0,
        );
        const freeSlots = await computeFreeSlots(staff.id, date, businessOpen, businessClose, bufferMin);
        return { staff, bookedMins, workingMins, freeSlots, bufferMin };
      }),
    );

    // Score candidates
    const scored = scoreCandidates(
      candidateData.map(({ staff, bookedMins, workingMins }) => ({ staff, bookedMins, workingMins })),
      isVip,
      preferred_staff_id,
    );

    // Find first available slot in scored order
    for (const { staff } of scored) {
      const cd = candidateData.find((c) => c.staff.id === staff.id)!;
      const targetTime = requested_at
        ? toMinutes(new Date(requested_at).toTimeString().slice(0, 5))
        : toMinutes(businessOpen);

      // Find free slot that fits durationMins starting at or after targetTime
      let chosenSlot: TimeSlot | null = null;
      for (const free of cd.freeSlots) {
        const s = toMinutes(free.start_time);
        const e = toMinutes(free.end_time);
        const start = Math.max(s, targetTime);
        if (start + durationMins <= e) {
          chosenSlot = { start_time: fromMinutes(start), end_time: fromMinutes(start + durationMins) };
          break;
        }
      }

      if (!chosenSlot) continue;

      const scheduledAt = `${date}T${chosenSlot.start_time}:00`;

      // Assign booking
      const { data: updated } = await crm.from("bookings")
        .update({
          staff_id: staff.id,
          scheduled_at: scheduledAt,
          scheduling_method: "auto_assigned",
          status: "confirmed",
        })
        .eq("id", booking_id)
        .select("id, staff_id, scheduled_at, scheduling_method")
        .single();

      // Mark queue entry as assigned
      await scheduling.from("queue")
        .update({ status: "assigned" })
        .eq("booking_id", booking_id);

      return {
        assigned: true,
        waitlisted: false,
        booking: updated ?? undefined,
      };
    }
  }

  // No slot found in 3-day window → waitlist
  return await insertWaitlist(params, serviceId);
}

async function insertWaitlist(
  params: AutoAssignParams,
  serviceId: string,
): Promise<AssignResult> {
  const scheduling = db("scheduling");

  const requestedDate = params.requested_at
    ? params.requested_at.slice(0, 10)
    : null;

  const { data: entry } = await scheduling.from("waitlist")
    .insert({
      org_id: params.org_id,
      branch_id: params.branch_id,
      customer_id: params.customer_id,
      service_id: serviceId,
      preferred_staff_id: params.preferred_staff_id ?? null,
      requested_date: requestedDate,
      status: "waiting",
      priority: 0,
    })
    .select("id")
    .single();

  return {
    assigned: false,
    waitlisted: true,
    waitlist_id: entry?.id,
  };
}
