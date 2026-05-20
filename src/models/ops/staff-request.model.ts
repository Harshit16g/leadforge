import { z } from 'zod'

export const RequestTypeSchema = z.enum(['break_request', 'leave_request', 'custom'])
export type RequestType = z.infer<typeof RequestTypeSchema>

export const RequestStatusSchema = z.enum(['pending', 'approved', 'rejected'])
export type RequestStatus = z.infer<typeof RequestStatusSchema>

export const BreakPayloadSchema = z.object({
  date:       z.string(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time:   z.string().regex(/^\d{2}:\d{2}$/),
  reason:     z.string().optional(),
})
export type BreakPayload = z.infer<typeof BreakPayloadSchema>

export const LeavePayloadSchema = z.object({
  from_date: z.string(),
  to_date:   z.string(),
  reason:    z.string().optional(),
})
export type LeavePayload = z.infer<typeof LeavePayloadSchema>

export const StaffRequestRowSchema = z.object({
  id:           z.string().uuid(),
  org_id:       z.string().uuid(),
  staff_id:     z.string().uuid(),
  type:         RequestTypeSchema,
  payload:      z.record(z.string(), z.unknown()),
  status:       RequestStatusSchema.default('pending'),
  staff_note:   z.string().nullable(),
  partner_note: z.string().nullable(),
  reviewed_at:  z.string().nullable(),
  reviewed_by:  z.string().uuid().nullable(),
  created_at:   z.string(),
  updated_at:   z.string(),
})
export type StaffRequestRow = z.infer<typeof StaffRequestRowSchema>

export const StaffRequestInsertSchema = z.object({
  org_id:     z.string().uuid(),
  staff_id:   z.string().uuid(),
  type:       RequestTypeSchema,
  payload:    z.record(z.string(), z.unknown()),
  staff_note: z.string().optional(),
})
export type StaffRequestInsert = z.infer<typeof StaffRequestInsertSchema>

export const ReviewRequestSchema = z.object({
  status:       z.enum(['approved', 'rejected']),
  partner_note: z.string().optional(),
})
export type ReviewRequest = z.infer<typeof ReviewRequestSchema>
