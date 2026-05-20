import { z } from 'zod'
import { ContextTypeSchema } from '@/models/_shared/guard.model'

export const InvitationStatusSchema = z.enum(['pending', 'accepted', 'expired', 'revoked'])
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>

export const InvitationRowSchema = z.object({
  id:           z.uuid(),
  email:        z.email(),
  role_id:      z.uuid(),
  context_type: ContextTypeSchema,
  context_id:   z.uuid().nullable(),
  token:        z.string(),
  invited_by:   z.uuid().nullable(),
  expires_at:   z.iso.datetime(),
  accepted_at:  z.iso.datetime().nullable(),
  status:       InvitationStatusSchema.default('pending'),
})
export type InvitationRow = z.infer<typeof InvitationRowSchema>

export const CreateInvitationRequestSchema = z.object({
  email:        z.email(),
  role_id:      z.uuid(),
  context_type: ContextTypeSchema,
  context_id:   z.uuid().optional(),
  expires_in_hours: z.number().int().min(1).max(168).default(72),
})
export type CreateInvitationRequest = z.infer<typeof CreateInvitationRequestSchema>

export const AcceptInvitationRequestSchema = z.object({
  token: z.string().min(1),
})
export type AcceptInvitationRequest = z.infer<typeof AcceptInvitationRequestSchema>
