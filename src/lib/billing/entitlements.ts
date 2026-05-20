import { db } from "@/lib/db";

/**
 * Checks if an organization has a specific feature enabled based on their current plan,
 * accounting for hierarchical overrides (Branch/User).
 * 
 * Hierarchy: Plan (Master) -> Branch Override -> User Override.
 */
export async function checkFeature(
  orgId: string, 
  featureKey: string, 
  context?: { branchId?: string; userId?: string }
): Promise<boolean> {
  // 1. Plan-level check (Master Switch)
  const { data: subscription } = await db("billing")
    .from("subscriptions")
    .select("plan_id")
    .eq("org_id", orgId)
    .eq("status", "active")
    .maybeSingle();

  let planId = subscription?.plan_id;

  if (!planId) {
    const { data: trialPlan } = await db("billing").from("plans").select("id").eq("plan_key", "trial").single();
    planId = trialPlan?.id;
  }

  if (!planId) return false;

  const { data: planFeature } = await db("billing")
    .from("plan_features")
    .select("enabled")
    .eq("plan_id", planId)
    .eq("feature_key", featureKey)
    .maybeSingle();

  // If the plan disables it, it's blocked for EVERYONE (no vice versa)
  if (!planFeature?.enabled) return false;

  // 2. Future: Check Branch/User specific overrides here
  // e.g. db("billing").from("feature_overrides")...

  return true;
}

/**
 * Gets the numeric limit for a feature (e.g., max_employees).
 * Returns Infinity if no limit is defined or feature is disabled.
 */
export async function getFeatureLimit(orgId: string, featureKey: string): Promise<number> {
  const { data: subscription } = await db("billing")
    .from("subscriptions")
    .select("plan_id")
    .eq("org_id", orgId)
    .eq("status", "active")
    .maybeSingle();

  let planId = subscription?.plan_id;

  if (!planId) {
    const { data: trialPlan } = await db("billing")
      .from("plans")
      .select("id")
      .eq("plan_key", "trial")
      .single();
    planId = trialPlan?.id;
  }

  if (!planId) return 0;

  const { data: feature } = await db("billing")
    .from("plan_features")
    .select("enabled, limit_value")
    .eq("plan_id", planId)
    .eq("feature_key", featureKey)
    .maybeSingle();

  if (!feature || !feature.enabled) return 0;
  return feature.limit_value ?? Infinity;
}
