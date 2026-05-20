import { z } from 'zod'

export const BlockTypeSchema = z.enum([
  'available', 'lunch', 'break', 'leave', 'blocked', 'custom',
])
export type BlockType = z.infer<typeof BlockTypeSchema>

export const StaffAvailabilityRowSchema = z.object({
  id:         z.uuid(),
  staff_id:   z.uuid(),
  org_id:     z.uuid(),
  date:       z.string(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time:   z.string().regex(/^\d{2}:\d{2}$/),
  block_type: BlockTypeSchema.default('available'),
  reason:     z.string().nullable(),
  created_by: z.uuid().nullable(),
  created_at: z.string(),
})
export type StaffAvailabilityRow = z.infer<typeof StaffAvailabilityRowSchema>

export const SetAvailabilityRequestSchema = z.object({
  date:       z.string(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time:   z.string().regex(/^\d{2}:\d{2}$/),
  block_type: BlockTypeSchema,
  reason:     z.string().optional(),
})
export type SetAvailabilityRequest = z.infer<typeof SetAvailabilityRequestSchema>

export const AvailableSlotSchema = z.object({
  staff_id:    z.uuid(),
  staff_name:  z.string(),
  start_time:  z.string(),
  end_time:    z.string(),
  utilization: z.number(),
})
export type AvailableSlot = z.infer<typeof AvailableSlotSchema>
