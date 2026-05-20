import { z } from 'zod'

export const AuditLogRowSchema = z.object({
  id:           z.uuid(),
  actor_id:     z.uuid().nullable(),
  actor_role:   z.string().nullable(),
  action:       z.string().min(1),
  target_type:  z.string().nullable(),
  target_id:    z.uuid().nullable(),
  org_id:       z.uuid().nullable(),
  before_state: z.record(z.string(), z.unknown()).nullable(),
  after_state:  z.record(z.string(), z.unknown()).nullable(),
  ip_address:   z.string().nullable(),
  user_agent:   z.string().nullable(),
  created_at:   z.string(),
})
export type AuditLogRow = z.infer<typeof AuditLogRowSchema>

export const CreateAuditEntrySchema = z.object({
  action:       z.string().min(1),
  target_type:  z.string().optional(),
  target_id:    z.uuid().optional(),
  org_id:       z.uuid().optional(),
  before_state: z.record(z.string(), z.unknown()).optional(),
  after_state:  z.record(z.string(), z.unknown()).optional(),
})
export type CreateAuditEntry = z.infer<typeof CreateAuditEntrySchema>
