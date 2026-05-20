import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-client/server";
import { checkPermission, getUserOrgId } from "@/lib/auth/iam";
import { db } from "@/lib/db";
import type { User } from "@supabase/supabase-js";
const isDebug = process.env.DEBUG === "true";
const isLocalDev = process.env.NODE_ENV === "development";

type PermissionOk   = { user: User; orgId: string | null; token: string | undefined; response: null };
type PermissionFail = { user: null; orgId: null; token: null; response: NextResponse };
export type GuardResult = PermissionOk | PermissionFail;

async function isTokenNearExpiry(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.expires_at) return true;
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at < now + 600;
}

// Mapping of IAM modules to Billing feature keys for global enforcement
const MODULE_FEATURE_MAP: Record<string, string> = {
  "staff_mgmt": "payroll_automation",
  "analytics": "revenue_analytics",
  "inventory": "inventory_management",
  "whatsapp": "digital_campaigns",
  "scheduling": "booking_online",
  "bookings": "booking_walkin", // Default for partner-side booking operations
  "crm": "customer_crm",
  "loyalty": "loyalty_program",
  "expenses": "expense_tracking",
  "services": "booking_walkin",
  "settings": "multi_branch",
  "marketing": "digital_campaigns"
};

/**
 * requirePermission — the single auth guard for all API routes.
 * Verifies session, then checks MBAC via iam.check_permission().
 */
export async function requirePermission(
  module: string,
  action: string,
  contextType: "platform" | "org" | "branch" = "platform",
  contextId?: string,
  options: { allowAnon?: boolean; featureKey?: string } = {}
): Promise<GuardResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    if (options.allowAnon) {
      return { user: null as any, orgId: contextId || null, token: undefined, response: null };
    }
    return { user: null, orgId: null, token: null, response: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }

  const orgId = contextId ?? (contextType === "org" ? await getUserOrgId(user.id) : null);
  
  // 1. IAM Permission Check
  const allowed = (isDebug && isLocalDev) || await checkPermission(user.id, module, action, contextType, orgId ?? undefined);

  if (!allowed) {
    return { user: null, orgId: null, token: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  // 2. Feature Entitlement Check (Enforced even if isDebug is true)
  // Platform context (Admins) always bypass feature checks.
  if (contextType !== "platform" && orgId) {
    // Priority: Explicit option > Global Map
    const featureKey = options.featureKey || MODULE_FEATURE_MAP[module];

    if (featureKey) {
      const { checkFeature } = await import("@/lib/billing/entitlements");
      const hasFeature = await checkFeature(orgId, featureKey, { 
        branchId: contextType === "branch" ? contextId : undefined,
        userId: user.id 
      });

      if (!hasFeature) {
        return { 
          user: null, orgId: null, token: null, 
          response: NextResponse.json({ 
            error: `Feature '${featureKey}' is not included in your current plan.`,
            code: "FEATURE_LOCKED" 
          }, { status: 403 }) 
        };
      }
    }
  }

  const { data: { session } } = await supabase.auth.getSession();
  let token = session?.access_token;

  // If token is missing or near expiry, refresh it to avoid 401s in downstream services
  if (await isTokenNearExpiry()) {
    if (isDebug && isLocalDev) console.log("[AUTH_GUARD] Token near expiry or missing, refreshing session...");
    const { data: { session: refreshed }, error: refreshErr } = await supabase.auth.refreshSession();
    if (refreshErr) {
      if (isDebug && isLocalDev) console.error("[AUTH_GUARD] Session refresh failed:", refreshErr);
    } else if (refreshed) {
      token = refreshed.access_token;
    }
  }

  return { user, orgId, token, response: null };
}

// ─── Employee guard ───────────────────────────────────────────────────────────

type EmployeeOk   = { user: User; staffId: string; orgId: string; branchId: string | null; response: null };
type EmployeeFail = { user: null; staffId: null; orgId: null; branchId: null; response: NextResponse };
export type EmployeeGuardResult = EmployeeOk | EmployeeFail;

export async function requireEmployee(): Promise<EmployeeGuardResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();


  if (!user) {
    return { user: null, staffId: null, orgId: null, branchId: null, response: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }

  const { data: staff } = await db("ops").from("staff_members")
    .select("id, org_id, branch_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!staff && isDebug && isLocalDev) {
    return { 
      user, 
      staffId: "00000000-0000-0000-0000-000000000000", 
      orgId: "00000000-0000-0000-0000-000000000000", 
      branchId: null, 
      response: null 
    };
  }

  if (!staff) {
    return { user: null, staffId: null, orgId: null, branchId: null, response: NextResponse.json({ error: "No staff record found" }, { status: 403 }) };
  }

  return { user, staffId: staff.id, orgId: staff.org_id, branchId: staff.branch_id, response: null };
}

// ─── Backwards-compat aliases ─────────────────────────────────────────────────

/** @deprecated Use requirePermission('analytics','view','platform') */
export async function requireAdmin(): Promise<GuardResult & { supabase?: Awaited<ReturnType<typeof createClient>> }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, orgId: null, token: null, response: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }

  const allowed = (isDebug && isLocalDev) || await checkPermission(user.id, "analytics", "view", "platform");
  if (!allowed) {
    return { user: null, orgId: null, token: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, orgId: null, token: undefined, supabase, response: null };
}

/** @deprecated Use requirePermission('bookings','view','org') */
export async function requirePartner(): Promise<{
  partnerId: string | null;
  userId: string | null;
  orgId: string | null;
  response: NextResponse | null;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { partnerId: null, userId: null, orgId: null, response: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }
  const orgId = await getUserOrgId(user.id);
  if (!orgId && !(isDebug && isLocalDev)) {
    return { partnerId: null, userId: null, orgId: null, response: NextResponse.json({ error: "No organisation found" }, { status: 403 }) };
  }
  const allowed = (isDebug && isLocalDev) || await checkPermission(user.id, "bookings", "view", "org", orgId!);
  if (!allowed) {
    return { partnerId: null, userId: null, orgId: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { partnerId: orgId || "DEBUG_ORG", userId: user.id, orgId: orgId || "DEBUG_ORG", response: null };
}
