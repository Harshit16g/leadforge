import { z } from 'zod'

export const RoleKeySchema = z.enum([
  // Admin tier
  'core_admin', 'mgmt_admin', 'ops_admin', 'support_admin', 'audit_admin',
  // Org tier
  'org_owner',
  // Partner tier
  'owner_partner', 'mgr_partner', 'branch_partner', 'franchise_partner',
  // Staff tier
  'supervisor', 'floor_staff', 'cashier', 'technician',
  // Customer tier
  'walk_in', 'member', 'vip', 'subscriber', 'guest',
])
export type RoleKey = z.infer<typeof RoleKeySchema>

export const RoleRowSchema = z.object({
  id:             z.uuid(),
  tier_id:        z.number().int(),
  role_key:       z.string(),
  display_name:   z.string(),
  description:    z.string().nullable(),
  is_system:      z.boolean().default(false),
  is_custom:      z.boolean().default(false),
  parent_role_id: z.uuid().nullable(),
  created_by:     z.uuid().nullable(),
  created_at:     z.iso.datetime(),
})
export type RoleRow = z.infer<typeof RoleRowSchema>

export const RoleInsertSchema = RoleRowSchema.omit({ id: true, created_at: true })
export type RoleInsert = z.infer<typeof RoleInsertSchema>

export const RoleUpdateSchema = RoleInsertSchema.pick({
  display_name: true, description: true, parent_role_id: true,
}).partial()
export type RoleUpdate = z.infer<typeof RoleUpdateSchema>

export const CreateCustomRoleRequestSchema = z.object({
  org_id:         z.uuid(),
  tier_id:        z.number().int(),
  display_name:   z.string().min(1).max(100),
  description:    z.string().optional(),
  parent_role_id: z.uuid().optional(),
})
export type CreateCustomRoleRequest = z.infer<typeof CreateCustomRoleRequestSchema>
