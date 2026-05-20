/**
 * Google Calendar API v3 helpers.
 * All calls are raw fetch against the REST API — no googleapis SDK.
 */
import { getServiceClient } from "@/lib/db";
import { getValidAccessToken } from "./oauth";
import { logAudit } from "@/lib/audit";

const GCAL_BASE = "https://www.googleapis.com/calendar/v3";

interface GcalEventBody {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end:   { dateTime: string; timeZone?: string };
  attendees?: { email: string }[];
  extendedProperties?: {
    private?: Record<string, string>;
  };
}

// ─── Push booking to Google Calendar ─────────────────────────────────────────

export async function pushBookingToGcal(bookingId: string): Promise<void> {
  const db = getServiceClient();
  const { data: booking } = await db.schema("crm").from("bookings")
    .select("id, org_id, scheduled_at, status, gcal_event_id, services, notes, staff_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking || !booking.scheduled_at) return;
  if (!["confirmed", "arrived", "in_service"].includes(booking.status)) return;

  const tokens = await getValidAccessToken(booking.org_id);
  if (!tokens) return;

  const { data: org } = await db.schema("orgs").from("organizations")
    .select("name, timezone").eq("id", booking.org_id).maybeSingle();

  const tz = (org as any)?.timezone ?? "Asia/Kolkata";
  const start = new Date(booking.scheduled_at);
  const end   = new Date(start.getTime() + 60 * 60 * 1000); // default 1h

  const serviceNames = Array.isArray(booking.services)
    ? booking.services.map((s: any) => (typeof s === "string" ? s : s.name ?? "Service")).join(", ")
    : "Appointment";

  const eventBody: GcalEventBody = {
    summary: serviceNames,
    description: booking.notes ?? undefined,
    start: { dateTime: start.toISOString(), timeZone: tz },
    end:   { dateTime: end.toISOString(),   timeZone: tz },
    extendedProperties: {
      private: { leaexBookingId: bookingId },
    },
  };

  const existingEventId = booking.gcal_event_id;
  let gcalEventId: string;

  if (existingEventId) {
    // Update existing event
    const res = await fetch(
      `${GCAL_BASE}/calendars/${encodeURIComponent(tokens.calendarId)}/events/${existingEventId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("[gcal] update failed", err);
      return;
    }
    const updated = await res.json();
    gcalEventId = updated.id;
  } else {
    // Create new event
    const res = await fetch(
      `${GCAL_BASE}/calendars/${encodeURIComponent(tokens.calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("[gcal] create failed", err);
      return;
    }
    const created = await res.json();
    gcalEventId = created.id;
  }

  await db.schema("crm").rpc("upsert_bookings_v1", {
    p_org_id: booking.org_id,
    p_actor_id: "00000000-0000-0000-0000-000000000000", // System actor for background sync
    p_bookings_id: bookingId,
    p_gcal_event_id: gcalEventId,
    p_actor_role: "system"
  });

  await logAudit(
    booking.org_id,
    "00000000-0000-0000-0000-000000000000",
    "external.calendar_synced",
    "bookings",
    bookingId,
    { gcal_event_id: gcalEventId, action: existingEventId ? "updated" : "created" },
    "system"
  );
}

// ─── Cancel a Google Calendar event ──────────────────────────────────────────

export async function cancelGcalEvent(bookingId: string): Promise<void> {
  const db = getServiceClient();
  const { data: booking } = await db.schema("crm").from("bookings")
    .select("org_id, gcal_event_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking?.gcal_event_id) return;

  const tokens = await getValidAccessToken(booking.org_id);
  if (!tokens) return;

  await fetch(
    `${GCAL_BASE}/calendars/${encodeURIComponent(tokens.calendarId)}/events/${booking.gcal_event_id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    }
  );

  await db.schema("crm").rpc("upsert_bookings_v1", {
    p_org_id: booking.org_id,
    p_actor_id: "00000000-0000-0000-0000-000000000000",
    p_bookings_id: bookingId,
    p_gcal_event_id: null,
    p_actor_role: "system"
  });

  await logAudit(
    booking.org_id,
    "00000000-0000-0000-0000-000000000000",
    "external.calendar_synced",
    "bookings",
    bookingId,
    { action: "deleted" },
    "system"
  );
}

// ─── Register push-notification channel ──────────────────────────────────────

export async function registerGcalWebhook(orgId: string): Promise<void> {
  const tokens = await getValidAccessToken(orgId);
  if (!tokens) return;

  const channelId = `leaex-${orgId}`;
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/google-calendar`;
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 1 week

  const res = await fetch(
    `${GCAL_BASE}/calendars/${encodeURIComponent(tokens.calendarId)}/events/watch`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id:         channelId,
        type:       "web_hook",
        address:    webhookUrl,
        expiration: expiry,
      }),
    }
  );

  if (!res.ok) {
    console.error("[gcal] webhook registration failed", await res.text());
    return;
  }

  const channel = await res.json();
  const db = getServiceClient();
  await db.schema("orgs").rpc("upsert_google_calendar_tokens_v1", {
    p_org_id: orgId,
    p_actor_id: "00000000-0000-0000-0000-000000000000",
    p_webhook_channel_id:  channel.id,
    p_webhook_resource_id: channel.resourceId,
    p_webhook_expires_at:  new Date(parseInt(channel.expiration)).toISOString(),
    p_actor_role: "system"
  });

  await logAudit(
    orgId,
    "00000000-0000-0000-0000-000000000000",
    "system.config_changed",
    "google_calendar_tokens",
    orgId,
    { webhook_channel_id: channel.id },
    "system"
  );
}
