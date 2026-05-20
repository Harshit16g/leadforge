import { z } from 'zod'

export const CampaignStatusSchema = z.enum([
  'draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled',
])
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>

export const CampaignRowSchema = z.object({
  id:               z.string().uuid(),
  org_id:           z.string().uuid(),
  name:             z.string().min(1).max(255),
  channel:          z.enum(['whatsapp', 'sms', 'email']),
  template_id:      z.string().uuid().nullable(),
  target_filter:    z.record(z.string(), z.unknown()).default({}),
  status:           CampaignStatusSchema.default('draft'),
  total_recipients: z.number().int().default(0),
  sent_count:       z.number().int().default(0),
  delivered_count:  z.number().int().default(0),
  failed_count:     z.number().int().default(0),
  scheduled_at:     z.string().nullable(),
  started_at:       z.string().nullable(),
  completed_at:     z.string().nullable(),
  created_by:       z.string().uuid().nullable(),
  created_at:       z.string(),
  updated_at:       z.string(),
})
export type CampaignRow = z.infer<typeof CampaignRowSchema>

export const CampaignInsertSchema = CampaignRowSchema.omit({
  id: true, created_at: true, updated_at: true,
  total_recipients: true, sent_count: true, delivered_count: true, failed_count: true,
  started_at: true, completed_at: true,
})
export type CampaignInsert = z.infer<typeof CampaignInsertSchema>
