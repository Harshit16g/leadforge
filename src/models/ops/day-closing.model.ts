import { z } from 'zod'

export const DayClosingRowSchema = z.object({
  id:             z.uuid(),
  org_id:         z.uuid(),
  branch_id:      z.uuid(),
  closing_date:   z.string(),
  bookings_count: z.number().int().default(0),
  revenue:        z.number().default(0),
  expenses:       z.number().default(0),
  net_profit:     z.number().default(0),
  cash_in_hand:   z.number().default(0),
  is_locked:      z.boolean().default(false),
  closed_by:      z.uuid().nullable(),
  closed_at:      z.iso.datetime().nullable(),
  notes:          z.string().nullable(),
  snapshot:       z.record(z.string(), z.unknown()).default({}),
  created_at:     z.iso.datetime(),
})
export type DayClosingRow = z.infer<typeof DayClosingRowSchema>

export const CreateDayClosingRequestSchema = z.object({
  org_id:       z.uuid(),
  branch_id:    z.uuid(),
  closing_date: z.string(),
  cash_in_hand: z.number().min(0),
  notes:        z.string().optional(),
})
export type CreateDayClosingRequest = z.infer<typeof CreateDayClosingRequestSchema>
