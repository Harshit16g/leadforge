import { z } from 'zod'

export const QueueStatusSchema = z.enum(['pending', 'assigned', 'cancelled'])
export type QueueStatus = z.infer<typeof QueueStatusSchema>

export const QueueConstraintsSchema = z.object({
  skills_required:    z.array(z.uuid()).optional(),
  preferred_staff_id: z.uuid().nullable().optional(),
  not_before:         z.string().regex(/^\d{2}:\d{2}$/).optional(),
  not_after:          z.string().regex(/^\d{2}:\d{2}$/).optional(),
}).default({})
export type QueueConstraints = z.infer<typeof QueueConstraintsSchema>

export const SchedulingQueueRowSchema = z.object({
  id:          z.uuid(),
  org_id:      z.uuid(),
  branch_id:   z.uuid().nullable(),
  booking_id:  z.uuid(),
  priority:    z.number().int().default(0),
  constraints: QueueConstraintsSchema,
  status:      QueueStatusSchema.default('pending'),
  created_at:  z.string(),
})
export type SchedulingQueueRow = z.infer<typeof SchedulingQueueRowSchema>

export const AutoAssignRequestSchema = z.object({
  booking_id:         z.uuid(),
  org_id:             z.uuid(),
  branch_id:          z.uuid().optional(),
  preferred_staff_id: z.uuid().optional(),
  requested_at:       z.string().optional(),
})
export type AutoAssignRequest = z.infer<typeof AutoAssignRequestSchema>

export const AutoAssignResponseSchema = z.object({
  assigned:    z.boolean(),
  booking_id:  z.uuid(),
  staff_id:    z.uuid().nullable(),
  scheduled_at: z.string().nullable(),
  waitlisted:  z.boolean(),
  waitlist_id: z.uuid().nullable(),
})
export type AutoAssignResponse = z.infer<typeof AutoAssignResponseSchema>
