import { z } from 'zod'

export const FeatureKeySchema = z.enum([
  'scheduling', 'ai_optimizer', 'wa_api', 'campaigns', 'analytics_advanced',
  'multi_branch', 'inventory', 'payroll', 'google_biz', 'custom_roles',
  'api_access', 'white_label', 'priority_support',
])
export type FeatureKey = z.infer<typeof FeatureKeySchema>

export const PlanFeatureRowSchema = z.object({
  id:          z.uuid(),
  plan_id:     z.uuid(),
  feature_key: z.string(),
  enabled:     z.boolean().default(false),
  limit_value: z.number().int().nullable(),
  created_at:  z.string(),
})
export type PlanFeatureRow = z.infer<typeof PlanFeatureRowSchema>

export const UpsertPlanFeatureRequestSchema = z.object({
  plan_id:     z.uuid(),
  feature_key: z.string().min(1),
  enabled:     z.boolean(),
  limit_value: z.number().int().nullable().optional(),
})
export type UpsertPlanFeatureRequest = z.infer<typeof UpsertPlanFeatureRequestSchema>
