// ─── Scheduling availability helpers ─────────────────────────────────────────
// All times are in "HH:MM" 24-hour format strings.
// Slots are [start_time, end_time] inclusive-exclusive pairs.

import { db } from "@/lib/db";

export interface TimeSlot {
  start_time: string; // "HH:MM"
  end_time: string;
}

export interface StaffSlots {
  staff_id: string;
  staff_name: string;
  slots: TimeSlot[];
  utilization_pct: number;
}

export interface StaffUtilization {
  staff_id: string;
  staff_name: string;
  booked_minutes: number;
  working_minutes: number;
  utilization_pct: number;
}

// Parse "HH:MM" → total minutes from midnight
function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Minutes from midnight → "HH:MM"
function fromMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

// Subtract blocked intervals from a free-time list
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

// Generate aligned slot boundaries from a continuous free block
function generateAlignedSlots(
  freeSlot: TimeSlot,
  durationMinutes: number,
  bufferMinutes: number,
  slotStepMinutes: number,
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const s = toMinutes(freeSlot.start_time);
  const e = toMinutes(freeSlot.end_time);
  const step = slotStepMinutes;
  // slotStepMinutes already accounts for the buffer between slots
  // Don't advance cur inside the loop body — the for increment handles stepping
  for (let cur = s; cur + durationMinutes <= e; cur += step) {
    slots.push({ start_time: fromMinutes(cur), end_time: fromMinutes(cur + durationMinutes) });
  }
  return slots;
}

/**
 * getAvailableSlots — public-facing slot query for a given org/branch/services/date.
 * Returns per-staff available slots so the booking UI can show choices.
 */
export async function getAvailableSlots(
  orgId: string,
  branchId: string | null,
  serviceIds: string[],
  date: string, // "YYYY-MM-DD"
): Promise<StaffSlots[]> {
  const scheduling = db("scheduling");
  const ops = db("ops");
  const crm = db("crm");

  if (!serviceIds.length) return [];

  // Load org scheduling config
  let configQuery = scheduling.from("configs").select("*").eq("org_id", orgId);
  if (branchId) configQuery = configQuery.eq("branch_id", branchId);
  else configQuery = configQuery.is("branch_id", null);
  const { data: configs } = await configQuery.maybeSingle();

  const config = configs ?? {
    slot_duration_minutes: 30,
    buffer_default_minutes: 10,
    // Default: all 7 days open 10:00–22:00. Closures are explicit via branch_closures.
    business_hours: {
      sun: { open: "10:00", close: "22:00" },
      mon: { open: "10:00", close: "22:00" },
      tue: { open: "10:00", close: "22:00" },
      wed: { open: "10:00", close: "22:00" },
      thu: { open: "10:00", close: "22:00" },
      fri: { open: "10:00", close: "22:00" },
      sat: { open: "10:00", close: "22:00" },
    },
  };

  const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date(date).getDay()];
  const hours = (config.business_hours as Record<string, { open: string; close: string; closed?: boolean }>)[dayKey];

  if (!hours || hours.closed) return [];

  // Check explicit branch closure for this date
  let closureQuery = scheduling.from("branch_closures")
    .select("id")
    .eq("org_id", orgId)
    .eq("closure_date", date);
  if (branchId) {
    closureQuery = closureQuery.or(`branch_id.eq.${branchId},branch_id.is.null`);
  } else {
    closureQuery = closureQuery.is("branch_id", null);
  }
  const { data: closures } = await closureQuery.limit(1);
  if (closures?.length) return [];

  const businessStart = toMinutes(hours.open);
  const businessEnd = toMinutes(hours.close);

  // Load services durations
  const { data: servicesData } = await ops.from("service_catalogue")
    .select("id, duration_minutes")
    .in("id", serviceIds)
    .eq("is_active", true);

  if (!servicesData?.length) return [];

  const totalDurationMinutes = servicesData.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const foundServiceIds = servicesData.map(s => s.id);

  // Load eligible staff
  let staffQuery = ops.from("staff_members")
    .select("id, name, buffer_time_minutes, skills")
    .eq("org_id", orgId)
    .eq("is_active", true);
  if (branchId) staffQuery = staffQuery.eq("branch_id", branchId);

  const { data: staffList, error: staffErr } = await staffQuery;
  if (staffErr) {
    console.error("Availability — staff query error:", staffErr);
    return [];
  }
  if (!staffList?.length) return [];

  // Determine current time in IST to filter out past slots for today
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const isToday = date === todayStr;
  let currentMinutes = 0;
  if (isToday) {
    const nowIST = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).format(new Date());
    const [h, m] = nowIST.split(":").map(Number);
    currentMinutes = h * 60 + m;
  }

  const results: StaffSlots[] = [];

  await Promise.all(
    staffList.map(async (staff: { id: string; name: string; buffer_time_minutes: number; skills: string[] | null }) => {
      const staffSkills: string[] = staff.skills ?? [];
      const hasAllSkills = staffSkills.length === 0 || foundServiceIds.every(id => staffSkills.includes(id));
      if (!hasAllSkills) return;

      const bufferMin: number = staff.buffer_time_minutes ?? config.buffer_default_minutes;
      let freeSlots: TimeSlot[] = [];

      const { data: rosterBlocks } = await scheduling.from("staff_availability")
        .select("start_time, end_time, block_type")
        .eq("staff_id", staff.id)
        .eq("date", date)
        .eq("is_active", true);

      const hasAvailableBlock = (rosterBlocks ?? []).some(b => b.block_type === "available");
      const hasFullDayOff = (rosterBlocks ?? []).some(
        b => (b.block_type === "leave" || b.block_type === "blocked") &&
             toMinutes(b.start_time) <= businessStart &&
             toMinutes(b.end_time) >= businessEnd,
      );

      if (hasFullDayOff) return;

      if (hasAvailableBlock) {
        // Use explicit roster blocks as free window
        for (const b of rosterBlocks ?? []) {
          if (b.block_type === "available") {
            freeSlots.push({ start_time: b.start_time, end_time: b.end_time });
          }
        }
      } else {
        // Default-open: staff works business hours unless they have partial blocks
        freeSlots = [{ start_time: hours.open, end_time: hours.close }];
      }

      const { data: bookings } = await crm.from("bookings")
        .select("scheduled_at, services")
        .eq("staff_id", staff.id)
        .gte("scheduled_at", `${date}T00:00:00`)
        .lt("scheduled_at", `${date}T23:59:59`)
        .not("status", "in", '("cancelled","no_show")');

      for (const b of bookings ?? []) {
        const bStart = toMinutes(new Date(b.scheduled_at).toTimeString().slice(0, 5));
        const services = (b.services as { duration_minutes?: number }[]) ?? [];
        const bDuration = services.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) || totalDurationMinutes;
        const bEnd = bStart + bDuration + bufferMin;
        freeSlots = subtractInterval(freeSlots, bStart, bEnd);
      }

      for (const bl of rosterBlocks ?? []) {
        if (bl.block_type !== "available") {
          freeSlots = subtractInterval(freeSlots, toMinutes(bl.start_time), toMinutes(bl.end_time));
        }
      }

      const availableSlots: TimeSlot[] = [];
      for (const free of freeSlots) {
        let slots = generateAlignedSlots(free, totalDurationMinutes, bufferMin, config.slot_duration_minutes ?? 30);
        // Constraint: Never book in the past for today. Add 10m grace/lead time.
        if (isToday) {
          slots = slots.filter(sl => toMinutes(sl.start_time) > currentMinutes + 10);
        }
        availableSlots.push(...slots);
      }

      const bookedMins = (bookings ?? []).reduce((sum: number, b: { services: unknown }) => {
        const svcs = (b.services as { duration_minutes?: number }[]) ?? [];
        return sum + svcs.reduce((s, s2) => s + (s2.duration_minutes ?? 0), 0);
      }, 0);
      const workingMins = businessEnd - businessStart;
      const utilization_pct = workingMins > 0 ? Math.round((bookedMins / workingMins) * 100) : 0;

      if (availableSlots.length > 0) {
        results.push({
          staff_id: staff.id,
          staff_name: staff.name,
          slots: availableSlots,
          utilization_pct,
        });
      }
    }),
  );

  return results.sort((a, b) => a.utilization_pct - b.utilization_pct);
}

/**
 * getStaffUtilization — returns utilization % per staff member for a given org/branch/date.
 */
export async function getStaffUtilization(
  orgId: string,
  branchId: string | null,
  date: string,
): Promise<StaffUtilization[]> {
  const ops = db("ops");
  const crm = db("crm");
  const scheduling = db("scheduling");

  let configQuery = db("scheduling").from("configs").select("business_hours").eq("org_id", orgId);
  if (branchId) configQuery = configQuery.eq("branch_id", branchId);
  else configQuery = configQuery.is("branch_id", null);
  const { data: config } = await configQuery.maybeSingle();

  const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date(date).getDay()];
  const hours = (config?.business_hours as Record<string, { open: string; close: string; closed?: boolean }>)?.[dayKey];
  const workingMins = hours && !hours.closed
    ? toMinutes(hours.close) - toMinutes(hours.open)
    : 480; // fallback 8h

  let staffQuery = ops.from("staff_members")
    .select("id, name")
    .eq("org_id", orgId)
    .eq("is_active", true);
  if (branchId) staffQuery = staffQuery.eq("branch_id", branchId);

  const { data: staffList } = await staffQuery;
  if (!staffList?.length) return [];

  const utilizations = await Promise.all(
    staffList.map(async (staff: { id: string; name: string }) => {
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

      return {
        staff_id: staff.id,
        staff_name: staff.name,
        booked_minutes: bookedMins,
        working_minutes: workingMins,
        utilization_pct: Math.round((bookedMins / workingMins) * 100),
      };
    }),
  );

  return utilizations;
}
