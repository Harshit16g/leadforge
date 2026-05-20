import { z } from 'zod'

export const WaitlistStatusSchema = z.enum([
  'waiting', 'offered', 'accepted', 'expired', 'cancelled', 'fulfilled',
])
export type WaitlistStatus = z.infer<typeof WaitlistStatusSchema>

export const OfferedSlotSchema = z.object({
  date:       z.string(),
  start_time: z.string(),
  staff_id:   z.uuid(),
  booking_id: z.uuid().optional(),
})
export type OfferedSlot = z.infer<typeof OfferedSlotSchema>

export const WaitlistRowSchema = z.object({
  id:                  z.uuid(),
  org_id:              z.uuid(),
  branch_id:           z.uuid().nullable(),
  customer_id:         z.uuid(),
  service_id:          z.uuid(),
  preferred_staff_id:  z.uuid().nullable(),
  requested_date:      z.string().nullable(),
  earliest_time:       z.string().nullable(),
  latest_time:         z.string().nullable(),
  flexibility_minutes: z.number().int().default(30),
  status:              WaitlistStatusSchema.default('waiting'),
  offered_slot:        OfferedSlotSchema.nullable(),
  offered_at:          z.string().nullable(),
  offer_expires_at:    z.string().nullable(),
  wa_message_id:       z.string().nullable(),
  priority:            z.number().int().default(0),
  created_at:          z.string(),
  updated_at:          z.string(),
})
export type WaitlistRow = z.infer<typeof WaitlistRowSchema>

export const AddToWaitlistRequestSchema = z.object({
  org_id:              z.uuid(),
  branch_id:           z.uuid().optional(),
  customer_id:         z.uuid(),
  service_id:          z.uuid(),
  preferred_staff_id:  z.uuid().optional(),
  requested_date:      z.string().optional(),
  earliest_time:       z.string().regex(/^\d{2}:\d{2}$/).optional(),
  latest_time:         z.string().regex(/^\d{2}:\d{2}$/).optional(),
  flexibility_minutes: z.number().int().optional().default(30),
})
export type AddToWaitlistRequest = z.infer<typeof AddToWaitlistRequestSchema>

export const OfferWaitlistSlotRequestSchema = z.object({
  slot: OfferedSlotSchema,
})
export type OfferWaitlistSlotRequest = z.infer<typeof OfferWaitlistSlotRequestSchema>
