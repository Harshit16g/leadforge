import { z } from 'zod'

export const CustomerTypeSchema = z.enum(['walk_in', 'member', 'vip', 'subscriber', 'guest'])
export type CustomerType = z.infer<typeof CustomerTypeSchema>

export const WaConsentSchema = z.enum(['opted_in', 'opted_out', 'pending'])
export type WaConsent = z.infer<typeof WaConsentSchema>

export const GenderSchema = z.enum(['male', 'female', 'other', 'prefer_not_to_say'])
export type Gender = z.infer<typeof GenderSchema>

export const CustomerRowSchema = z.object({
  id:            z.uuid(),
  org_id:        z.uuid(),
  auth_user_id:  z.uuid().nullable(),
  name:          z.string().min(1).max(255),
  phone:         z.string().min(7).max(20),
  email:         z.email().nullable(),
  gender:        GenderSchema.nullable(),
  birthday:      z.string().nullable(),
  anniversary:   z.string().nullable(),
  customer_type: CustomerTypeSchema.default('walk_in'),
  total_visits:  z.number().int().default(0),
  total_spend:   z.number().default(0),
  last_visit_at: z.iso.datetime().nullable(),
  loyalty_points: z.number().int().default(0),
  tags:          z.array(z.string()).default([]),
  notes:         z.string().nullable(),
  wa_consent:    WaConsentSchema.default('pending'),
  referral_code: z.string().nullable(),
  referred_by:   z.uuid().nullable(),
  deleted_at:    z.iso.datetime().nullable(),
  avatar_url:    z.string().nullable().optional(),
  created_at:    z.iso.datetime(),
  updated_at:    z.iso.datetime(),
})
export type CustomerRow = z.infer<typeof CustomerRowSchema>

export const CustomerInsertSchema = CustomerRowSchema.omit({
  id: true, created_at: true, updated_at: true, deleted_at: true,
  total_visits: true, total_spend: true, last_visit_at: true,
  loyalty_points: true, referral_code: true,
})
export type CustomerInsert = z.infer<typeof CustomerInsertSchema>

export const CustomerUpdateSchema = CustomerInsertSchema.omit({ org_id: true }).partial()
export type CustomerUpdate = z.infer<typeof CustomerUpdateSchema>

export const CreateCustomerRequestSchema = z.object({
  org_id:        z.uuid(),
  name:          z.string().min(1).max(255),
  phone:         z.string().min(7).max(20),
  email:         z.email().optional(),
  gender:        GenderSchema.optional(),
  birthday:      z.string().optional(),
  anniversary:   z.string().optional(),
  customer_type: CustomerTypeSchema.optional().default('walk_in'),
  tags:          z.array(z.string()).optional().default([]),
  notes:         z.string().optional(),
  wa_consent:    WaConsentSchema.optional().default('pending'),
})
export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>

export const CustomerWithStatsSchema = CustomerRowSchema.extend({
  recent_bookings_count:  z.number().optional(),
  last_booking_date:      z.iso.datetime().nullable().optional(),
  outstanding_balance:    z.number().optional(),
})
export type CustomerWithStats = z.infer<typeof CustomerWithStatsSchema>
