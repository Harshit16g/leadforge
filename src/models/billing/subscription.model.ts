import { z } from 'zod'

export const SubscriptionStatusSchema = z.enum([
  'trialing', 'active', 'past_due', 'canceled', 'grace', 'expired', 'paused',
])
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>

export const SubscriptionRowSchema = z.object({
  id:                       z.uuid(),
  org_id:                   z.uuid(),
  plan_id:                  z.uuid(),
  status:                   SubscriptionStatusSchema.default('trialing'),
  start_date:               z.string().nullable(),
  end_date:                 z.string().nullable(),
  trial_start:              z.string().nullable(),
  trial_end:                z.string().nullable(),
  grace_end:                z.string().nullable(),
  razorpay_subscription_id: z.string().nullable(),
  cancelled_at:             z.string().nullable(),
  cancellation_reason:      z.string().nullable(),
  created_at:               z.string(),
  updated_at:               z.string(),
})
export type SubscriptionRow = z.infer<typeof SubscriptionRowSchema>

export const SubscriptionWithPlanSchema = SubscriptionRowSchema.extend({
  plan: z.object({
    plan_key:      z.string(),
    display_name:  z.string(),
    price_monthly: z.number(),
    price_yearly:  z.number(),
  }).optional(),
})
export type SubscriptionWithPlan = z.infer<typeof SubscriptionWithPlanSchema>

