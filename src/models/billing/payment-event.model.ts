import { z } from 'zod'

export const PaymentEventRowSchema = z.object({
  id:                   z.uuid(),
  org_id:               z.uuid(),
  subscription_id:      z.uuid().nullable(),
  razorpay_payment_id:  z.string(),
  amount:               z.number().min(0),
  currency:             z.string().default('INR'),
  status:               z.enum(['captured', 'failed', 'refunded']),
  metadata:             z.record(z.string(), z.unknown()).default({}),
  created_at:           z.iso.datetime(),
})
export type PaymentEventRow = z.infer<typeof PaymentEventRowSchema>
