import { z } from 'zod'
import { ContextTypeSchema } from '@/models/_shared/guard.model'

export const ActorRoleRowSchema = z.object({
  id:           z.uuid(),
  user_id:      z.uuid(),
  role_id:      z.uuid(),
  context_type: ContextTypeSchema,
  context_id:   z.uuid().nullable(),
  granted_by:   z.uuid().nullable(),
  valid_from:   z.iso.datetime(),
  valid_until:  z.iso.datetime().nullable(),
  is_active:    z.boolean().default(true),
  created_at:   z.iso.datetime(),
})
export type ActorRoleRow = z.infer<typeof ActorRoleRowSchema>

export const ActorRoleInsertSchema = ActorRoleRowSchema.omit({ id: true, created_at: true })
export type ActorRoleInsert = z.infer<typeof ActorRoleInsertSchema>

export const AssignRoleRequestSchema = z.object({
  user_id:      z.uuid(),
  role_id:      z.uuid(),
  context_type: ContextTypeSchema,
  context_id:   z.uuid().optional(),
  valid_until:  z.iso.datetime().optional(),
})
export type AssignRoleRequest = z.infer<typeof AssignRoleRequestSchema>

export const RevokeRoleRequestSchema = z.object({
  actor_role_id: z.uuid(),
})
export type RevokeRoleRequest = z.infer<typeof RevokeRoleRequestSchema>

export const ActorRoleWithRoleSchema = ActorRoleRowSchema.extend({
  role_key:     z.string(),
  display_name: z.string(),
  tier_key:     z.string(),
})
export type ActorRoleWithRole = z.infer<typeof ActorRoleWithRoleSchema>
