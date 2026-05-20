/**
 * Google OAuth helpers — token storage and refresh.
 * Uses Google Identity's token endpoint directly (no googleapis SDK).
 */
import { getServiceClient } from "@/lib/db";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export const GCAL_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope:         GCAL_SCOPES,
    access_type:   "offline",
    prompt:        "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
      grant_type:    "authorization_code",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google token exchange failed: ${body}`);
  }
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type:    "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Failed to refresh Google access token");
  return res.json();
}

// ─── Token storage ────────────────────────────────────────────────────────────

export async function saveGcalTokens(orgId: string, tokens: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  calendar_id?: string;
}, actorId?: string) {
  const db = getServiceClient();
  const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  await db.schema("orgs").rpc("upsert_google_calendar_tokens_v1", {
    p_actor_id: actorId || null,
    p_org_id: orgId,
    p_access_token: tokens.access_token,
    p_refresh_token: tokens.refresh_token,
    p_token_expiry: expiry,
    p_calendar_id: tokens.calendar_id ?? "primary",
    p_actor_role: actorId ? "partner" : "system"
  });
}

export async function getValidAccessToken(orgId: string): Promise<{ accessToken: string; calendarId: string } | null> {
  const db = getServiceClient();
  const { data } = await db.schema("orgs").from("google_calendar_tokens")
    .select("access_token, refresh_token, token_expiry, calendar_id")
    .eq("org_id", orgId)
    .maybeSingle();

  if (!data) return null;

  const isExpired = new Date(data.token_expiry) <= new Date(Date.now() + 60_000);
  if (!isExpired) {
    return { accessToken: data.access_token, calendarId: data.calendar_id };
  }

  try {
    const refreshed = await refreshAccessToken(data.refresh_token);
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
    await db.schema("orgs").rpc("upsert_google_calendar_tokens_v1", {
      p_actor_id: null,
      p_org_id: orgId,
      p_access_token: refreshed.access_token,
      p_refresh_token: data.refresh_token,
      p_token_expiry: newExpiry,
      p_calendar_id: data.calendar_id,
      p_actor_role: "system"
    });
    return { accessToken: refreshed.access_token, calendarId: data.calendar_id };
  } catch {
    return null;
  }
}

export async function deleteGcalTokens(orgId: string, actorId?: string) {
  const db = getServiceClient();
  const { data: tokenRow } = await db.schema("orgs").from("google_calendar_tokens")
    .select("id")
    .eq("org_id", orgId)
    .maybeSingle();

  if (tokenRow?.id) {
    await db.schema("orgs").rpc("delete_google_calendar_tokens_v1", {
      p_org_id: orgId,
      p_actor_id: actorId || null,
      p_id: tokenRow.id,
      p_actor_role: actorId ? "partner" : "system"
    });
  }
}
