import { getServiceClient } from "@/lib/db";

/** Calls iam.check_permission() SECURITY DEFINER function in Supabase. */
export async function checkPermission(
  userId: string,
  module: string,
  action: string,
  contextType: "platform" | "org" | "branch" = "platform",
  contextId?: string,
): Promise<boolean> {
  const db = getServiceClient();
  const { data, error } = await db
    .schema("iam")
    .rpc("check_permission", {
      p_user_id: userId,
      p_module_key: module,
      p_action_key: action,
      p_context_type: contextType,
      p_context_id: contextId ?? null,
    }, { get: false });

  if (error) {
    console.error("[iam.checkPermission] RPC error:", error.message);
    return false;
  }
  return !!data;
}
/** Returns the role keys active for a user in a given context. */
export async function getUserRoles(
  userId: string,
  contextType: string,
  contextId?: string,
): Promise<string[]> {
  const db = getServiceClient();
  const query = db
    .schema("iam")
    .from("actor_roles")
    .select("roles(role_key)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("context_type", contextType)
    .or("valid_until.is.null,valid_until.gt." + new Date().toISOString());

  if (contextId) query.eq("context_id", contextId);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []).flatMap((r: { roles: { role_key: string }[] | { role_key: string } | null }) => {
    if (!r.roles) return [];
    const roles = Array.isArray(r.roles) ? r.roles : [r.roles];
    return roles.map(role => role.role_key).filter(Boolean);
  });
}

/**
 * Returns the user's primary org_id by looking up owner_partner or org_owner
 * actor_roles at 'org' context. Returns null if none found.
 */
export async function getUserOrgId(userId: string): Promise<string | null> {
  const db = getServiceClient();
  const { data, error } = await db
    .schema("iam")
    .from("actor_roles")
    .select("context_id, roles(role_key)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("context_type", "org")
    .or("valid_until.is.null,valid_until.gt." + new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.context_id ?? null;
}
