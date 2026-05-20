import { z } from 'zod'

export const PayrollPaymentStatusSchema = z.enum(['pending', 'processed', 'paid'])
export type PayrollPaymentStatus = z.infer<typeof PayrollPaymentStatusSchema>

export const PayrollBreakdownItemSchema = z.object({
  booking_id:   z.uuid(),
  service_name: z.string(),
  amount:       z.number(),
  commission:   z.number(),
  date:         z.string(),
})

export const PayrollBreakdownSchema = z.object({
  bookings:    z.array(PayrollBreakdownItemSchema).default([]),
  adjustments: z.array(z.object({
    label:  z.string(),
    amount: z.number(),
  })).default([]),
})
export type PayrollBreakdown = z.infer<typeof PayrollBreakdownSchema>

export const PayrollRecordRowSchema = z.object({
  id:                  z.uuid(),
  staff_id:            z.uuid(),
  org_id:              z.uuid(),
  period_start:        z.string(),
  period_end:          z.string(),
  base_amount:         z.number().default(0),
  commission_amount:   z.number().default(0),
  deductions:          z.number().default(0),
  bonus:               z.number().default(0),
  net_amount:          z.number().default(0),
  payment_status:      PayrollPaymentStatusSchema.default('pending'),
  payment_date:        z.string().nullable(),
  payment_method:      z.string().nullable(),
  razorpay_payout_id:  z.string().nullable(),
  payslip_url:         z.url().nullable(),
  breakdown:           PayrollBreakdownSchema,
  approved_by:         z.uuid().nullable(),
  notes:               z.string().nullable(),
  generated_at:        z.iso.datetime(),
  created_at:          z.iso.datetime(),
})
export type PayrollRecordRow = z.infer<typeof PayrollRecordRowSchema>

export const PayrollSummarySchema = z.object({
  period_start:      z.string(),
  period_end:        z.string(),
  total_bookings:    z.number().int(),
  total_commission:  z.number(),
  base_amount:       z.number(),
  net_amount:        z.number(),
  next_payout_date:  z.string().nullable(),
})
export type PayrollSummary = z.infer<typeof PayrollSummarySchema>
