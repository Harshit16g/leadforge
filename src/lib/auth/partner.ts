/**
 * requirePartner — Server-side auth guard for all partner API routes.
 *
 * Resolution order:
 *  1. Partner user  → looks up orgs.organizations.owner_id = user.id
 *  2. Admin user    → reads "leaex-active-partner" cookie for impersonation
 *
 * Usage in any API route handler:
 *   const auth = await requirePartner();
 *   if (auth.response) return auth.response;
 *   const { partnerId } = auth;
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase-client/server";
import { getServiceClient } from "@/lib/db";

type PartnerAuthOk = { partnerId: string; userId: string; response: null };
type PartnerAuthFail = { partnerId: null; userId: null; response: NextResponse };
export type PartnerAuthResult = PartnerAuthOk | PartnerAuthFail;

export async function requirePartner(): Promise<PartnerAuthResult> {
  // 1. Verify session
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return {
      partnerId: null,
      userId: null,
      response: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }),
    };
  }

  const role = (user.user_metadata?.role as string) ?? "";
  const db = getServiceClient();

  // 2a. Partner user — look up by owner_id (new schema)
  if (role === "partner") {
    const { data: partner, error: partnerErr } = await db
      .schema("orgs")
      .from("organizations")
      .select("id, status")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (partnerErr || !partner) {
      return {
        partnerId: null,
        userId: null,
        response: NextResponse.json(
          { error: "Partner account not found for this user" },
          { status: 404 }
        ),
      };
    }

    // Check status
    if (partner.status !== "approved" && partner.status !== "trial" && partner.status !== "active") {
      return {
        partnerId: null,
        userId: null,
        response: NextResponse.json(
          { error: `Account status: ${partner.status}. Contact support for activation.` },
          { status: 403 }
        ),
      };
    }

    return { partnerId: partner.id, userId: user.id, response: null };
  }

  // 2b. Admin user — read active partner cookie (impersonation)
  if (role === "admin") {
    const cookieStore = await cookies();
    const activePartnerId = cookieStore.get("leaex-active-partner")?.value ?? "";

    if (!activePartnerId) {
      return {
        partnerId: null,
        userId: null,
        response: NextResponse.json(
          { error: "Admin must select a partner to impersonate. Set leaex-active-partner cookie." },
          { status: 400 }
        ),
      };
    }

    // Verify the organization exists (new schema)
    const { data: partner, error: partnerErr } = await db
      .schema("orgs")
      .from("organizations")
      .select("id")
      .eq("id", activePartnerId)
      .maybeSingle();

    if (partnerErr || !partner) {
      return {
        partnerId: null,
        userId: null,
        response: NextResponse.json(
          { error: "Selected partner not found" },
          { status: 404 }
        ),
      };
    }
    return { partnerId: partner.id, userId: user.id, response: null };
  }

  return {
    partnerId: null,
    userId: null,
    response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  };
}