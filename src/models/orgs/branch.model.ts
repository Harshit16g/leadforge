import { z } from 'zod'

export const BranchStatusSchema = z.enum(['active', 'inactive', 'temporarily_closed'])
export type BranchStatus = z.infer<typeof BranchStatusSchema>

export const DayScheduleSchema = z.object({
  open:   z.string().regex(/^\d{2}:\d{2}$/),
  close:  z.string().regex(/^\d{2}:\d{2}$/),
  closed: z.boolean().default(false),
})

export const OperatingHoursSchema = z.object({
  mon: DayScheduleSchema.optional(),
  tue: DayScheduleSchema.optional(),
  wed: DayScheduleSchema.optional(),
  thu: DayScheduleSchema.optional(),
  fri: DayScheduleSchema.optional(),
  sat: DayScheduleSchema.optional(),
  sun: DayScheduleSchema.optional(),
}).default({})
export type OperatingHours = z.infer<typeof OperatingHoursSchema>

export const BranchRowSchema = z.object({
  id:              z.uuid(),
  org_id:          z.uuid(),
  name:            z.string().min(1).max(255),
  branch_code:     z.string().nullable(),
  is_primary:      z.boolean().default(false),
  address:         z.string().nullable(),
  city:            z.string().nullable(),
  state:           z.string().nullable(),
  pin_code:        z.string().nullable(),
  phone:           z.string().nullable(),
  operating_hours: OperatingHoursSchema,
  cover_photo_url: z.url().nullable(),
  status:          BranchStatusSchema.default('active'),
  deleted_at:      z.iso.datetime().nullable(),
  created_at:      z.iso.datetime(),
  updated_at:      z.iso.datetime(),
})
export type BranchRow = z.infer<typeof BranchRowSchema>

export const BranchInsertSchema = BranchRowSchema.omit({
  id: true, created_at: true, updated_at: true, deleted_at: true,
})
export type BranchInsert = z.infer<typeof BranchInsertSchema>

export const BranchUpdateSchema = BranchInsertSchema.omit({ org_id: true }).partial()
export type BranchUpdate = z.infer<typeof BranchUpdateSchema>

export const CreateBranchRequestSchema = z.object({
  org_id:          z.uuid(),
  name:            z.string().min(1).max(255),
  branch_code:     z.string().optional(),
  is_primary:      z.boolean().optional().default(false),
  address:         z.string().optional(),
  city:            z.string().optional(),
  state:           z.string().optional(),
  pin_code:        z.string().optional(),
  phone:           z.string().optional(),
  operating_hours: OperatingHoursSchema.optional(),
})
export type CreateBranchRequest = z.infer<typeof CreateBranchRequestSchema>

export const BranchWithStatsSchema = BranchRowSchema.extend({
  month_bookings: z.number().int().default(0),
  month_revenue:  z.number().default(0),
  employee_count: z.number().int().default(0),
})
export type BranchWithStats = z.infer<typeof BranchWithStatsSchema>
