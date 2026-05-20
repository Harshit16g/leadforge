import { z } from 'zod'
import { ActionKeySchema, ModuleKeySchema } from '@/models/_shared/guard.model'

export const OverrideEffectSchema = z.enum(['allow', 'deny'])
export type OverrideEffect = z.infer<typeof OverrideEffectSchema>

export const PermissionOverrideRowSchema = z.object({
  id:            z.uuid(),
  actor_role_id: z.uuid(),
  module_id:     z.uuid(),
  action_key:    ActionKeySchema,
  effect:        OverrideEffectSchema,
  reason:        z.string().nullable(),
  granted_by:    z.uuid().nullable(),
  created_at:    z.iso.datetime(),
})
export type PermissionOverrideRow = z.infer<typeof PermissionOverrideRowSchema>

export const CreateOverrideRequestSchema = z.object({
  actor_role_id: z.uuid(),
  module_key:    ModuleKeySchema,
  action_key:    ActionKeySchema,
  effect:        OverrideEffectSchema,
  reason:        z.string().min(1).max(500),
})
export type CreateOverrideRequest = z.infer<typeof CreateOverrideRequestSchema>
