import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serviceRoleClient: SupabaseClient | undefined;

function getOrCreateServiceRoleClient(): SupabaseClient {
  if (!serviceRoleClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    serviceRoleClient = createClient(url, key, { auth: { persistSession: false } });
  }
  return serviceRoleClient;
}

/** Service role client — bypasses RLS. Reuses one process-level client (recommended by Supabase; avoids connection churn in dev). */
export function getServiceClient() {
  return getOrCreateServiceRoleClient();
}

/**
 * Returns a schema-scoped Supabase client for querying non-public schemas.
 * Requires schemas to be exposed in Supabase project: Settings → API → Exposed Schemas.
 * Schemas: iam, orgs, crm, ops, scheduling, inventory, billing, comms, platform
 */
export function db(schema: "iam" | "orgs" | "crm" | "ops" | "scheduling" | "inventory" | "billing" | "comms" | "platform" | "ai" | "audit" | "public" = "public") {
  const client = getOrCreateServiceRoleClient();
  if (schema === "public") return client;
  return client.schema(schema);
}

export function dbError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return (error as { message: string }).message;
  }
  return "Database error";
}
