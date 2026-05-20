import { z } from 'zod'
import { ModuleKeySchema, ActionKeySchema } from '@/models/_shared/guard.model'

export { ModuleKeySchema, ActionKeySchema }

export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical'])
export type RiskLevel = z.infer<typeof RiskLevelSchema>

export const ModuleRowSchema = z.object({
  id:           z.uuid(),
  module_key:   ModuleKeySchema,
  display_name: z.string(),
  tier_min:     z.string(),
  is_active:    z.boolean().default(true),
})
export type ModuleRow = z.infer<typeof ModuleRowSchema>

export const ModuleActionRowSchema = z.object({
  id:         z.uuid(),
  module_id:  z.uuid(),
  action_key: ActionKeySchema,
  risk_level: RiskLevelSchema,
})
export type ModuleActionRow = z.infer<typeof ModuleActionRowSchema>

export const RolePermissionRowSchema = z.object({
  id:              z.uuid(),
  role_id:         z.uuid(),
  module_id:       z.uuid(),
  allowed_actions: z.array(ActionKeySchema),
})
export type RolePermissionRow = z.infer<typeof RolePermissionRowSchema>

export const UpdateRolePermissionsRequestSchema = z.object({
  role_id:         z.uuid(),
  module_id:       z.uuid(),
  allowed_actions: z.array(ActionKeySchema),
})
export type UpdateRolePermissionsRequest = z.infer<typeof UpdateRolePermissionsRequestSchema>
