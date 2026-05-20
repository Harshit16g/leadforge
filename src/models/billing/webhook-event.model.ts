import { z } from 'zod'

export const WebhookEventRowSchema = z.object({
  id:                z.uuid(),
  razorpay_event_id: z.string(),
  event_type:        z.string(),
  payload:           z.record(z.string(), z.unknown()).default({}),
  processed_at:      z.iso.datetime(),
})
export type WebhookEventRow = z.infer<typeof WebhookEventRowSchema>
