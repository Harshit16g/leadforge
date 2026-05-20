import { z } from 'zod'

export const PlanKeySchema = z.enum(['starter', 'growth', 'pro', 'enterprise'])
export type PlanKey = z.infer<typeof PlanKeySchema>

export const PlanRowSchema = z.object({
  id:               z.uuid(),
  plan_key:         PlanKeySchema,
  display_name:     z.string(),
  price_monthly:    z.number().min(0).default(0),
  price_yearly:     z.number().min(0).default(0),
  max_branches:     z.number().int().default(1),
  max_staff:        z.number().int().default(5),
  max_customers:    z.number().int().default(500),
  razorpay_plan_id: z.string().nullable(),
  is_active:        z.boolean().default(true),
  is_public:        z.boolean().default(true),
  created_at:       z.string(),
  updated_at:       z.string(),
})
export type PlanRow = z.infer<typeof PlanRowSchema>

export const PlanInsertSchema = PlanRowSchema.omit({ id: true, created_at: true, updated_at: true })
export type PlanInsert = z.infer<typeof PlanInsertSchema>

export const PlanUpdateSchema = PlanInsertSchema.omit({ plan_key: true }).partial()
export type PlanUpdate = z.infer<typeof PlanUpdateSchema>

export const PlanWithFeaturesSchema = PlanRowSchema.extend({
  features: z.array(z.object({
    feature_key: z.string(),
    enabled:     z.boolean(),
    limit_value: z.number().int().nullable(),
  })).optional(),
})
export type PlanWithFeatures = z.infer<typeof PlanWithFeaturesSchema>
