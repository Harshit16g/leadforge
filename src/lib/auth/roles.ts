/**
 * Centralised role configuration — single source of truth for MBAC roles.
 * Role keys match iam.roles.role_key in the database.
 */

/** Where each role lands after successful login. */
export const ROLE_HOME: Record<string, string> = {
  // Admin tier
  core_admin:    "/admin/dashboard",
  mgmt_admin:    "/admin/dashboard",
  ops_admin:     "/admin/dashboard",
  support_admin: "/admin/dashboard",
  audit_admin:   "/admin/dashboard",
  // Org tier
  org_owner:     "/partner/dashboard",
  // Partner tier
  owner_partner:    "/partner/dashboard",
  mgr_partner:      "/partner/dashboard",
  branch_partner:   "/partner/dashboard",
  franchise_partner:"/partner/dashboard",
  // Staff tier
  supervisor:    "/employee/today",
  floor_staff:   "/employee/today",
  cashier:       "/employee/today",
  technician:    "/employee/today",
  // Customer tier
  walk_in:    "/customer",
  member:     "/customer",
  vip:        "/customer",
  subscriber: "/customer",
  guest:      "/customer",
  // Legacy (user_metadata.role values, still used by proxy.ts)
  admin:    "/admin/dashboard",
  partner:  "/partner/dashboard",
  employee: "/employee/today",
  customer: "/customer",
};

/** Fields required before a role may access their dashboard. */
export const REQUIRED_FIELDS: Record<string, string[]> = {
  core_admin:    ["display_name"],
  mgmt_admin:    ["display_name"],
  ops_admin:     ["display_name"],
  support_admin: ["display_name"],
  audit_admin:   ["display_name"],
  org_owner:     ["display_name", "phone"],
  owner_partner: ["display_name", "phone"],
  mgr_partner:   ["display_name", "phone"],
  branch_partner:["display_name", "phone"],
  supervisor:    ["display_name", "phone"],
  floor_staff:   ["display_name", "phone"],
  cashier:       ["display_name", "phone"],
  technician:    ["display_name", "phone"],
  // Legacy keys
  admin:    ["name"],
  partner:  ["name", "phone"],
  employee: ["name", "phone"],
  customer: ["name", "phone"],
};

export const ALLOWED_PROFILE_FIELDS = [
  "display_name",
  "phone",
  "avatar_url",
] as const;
