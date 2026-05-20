import { z } from 'zod'

export const EmploymentTypeSchema = z.enum(['full_time', 'part_time', 'contractor'])
export type EmploymentType = z.infer<typeof EmploymentTypeSchema>

export const SalaryTypeSchema = z.enum(['fixed', 'commission', 'hybrid'])
export type SalaryType = z.infer<typeof SalaryTypeSchema>

export const PreferredHoursSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
  days:  z.array(z.number().int().min(0).max(6)).optional(), // 0=Sun, 1=Mon...
}).default({})
export type PreferredHours = z.infer<typeof PreferredHoursSchema>

export const StaffMemberRowSchema = z.object({
  id:                    z.uuid(),
  org_id:                z.uuid(),
  branch_id:             z.uuid().nullable(),
  user_id:               z.uuid().nullable(),
  name:                  z.string().min(1).max(255),
  phone:                 z.string().nullable(),
  email:                 z.email().nullable(),
  staff_code:            z.string().nullable(),
  photo_url:             z.url().nullable(),
  employment_type:       EmploymentTypeSchema.default('full_time'),
  skills:                z.array(z.uuid()).default([]),
  buffer_time_minutes:   z.number().int().min(0).max(120).default(10),
  max_daily_appointments: z.number().int().min(1).max(50).default(8),
  preferred_hours:       PreferredHoursSchema,
  salary_type:           SalaryTypeSchema.default('fixed'),
  base_salary:           z.number().min(0).default(0),
  commission_rate:       z.number().min(0).max(100).default(0),
  is_active:             z.boolean().default(true),
  joined_at:             z.string().nullable(),
  left_at:               z.string().nullable(),
  created_at:            z.iso.datetime(),
  updated_at:            z.iso.datetime(),
})
export type StaffMemberRow = z.infer<typeof StaffMemberRowSchema>

export const StaffMemberInsertSchema = StaffMemberRowSchema.omit({
  id: true, created_at: true, updated_at: true,
})
export type StaffMemberInsert = z.infer<typeof StaffMemberInsertSchema>

export const StaffMemberUpdateSchema = StaffMemberInsertSchema.omit({ org_id: true }).partial()
export type StaffMemberUpdate = z.infer<typeof StaffMemberUpdateSchema>

export const CreateStaffRequestSchema = z.object({
  org_id:                 z.uuid(),
  branch_id:              z.uuid().optional(),
  name:                   z.string().min(1).max(255),
  phone:                  z.string().optional(),
  email:                  z.email().optional(),
  employment_type:        EmploymentTypeSchema.optional().default('full_time'),
  skills:                 z.array(z.uuid()).optional().default([]),
  buffer_time_minutes:    z.number().int().optional().default(10),
  max_daily_appointments: z.number().int().optional().default(8),
  preferred_hours:        PreferredHoursSchema.optional(),
  salary_type:            SalaryTypeSchema.optional().default('fixed'),
  base_salary:            z.number().min(0).optional().default(0),
  commission_rate:        z.number().min(0).max(100).optional().default(0),
  joined_at:              z.string().optional(),
})
export type CreateStaffRequest = z.infer<typeof CreateStaffRequestSchema>

export const StaffWithScheduleSchema = StaffMemberRowSchema.extend({
  todays_bookings_count: z.number().optional(),
  utilization_pct:       z.number().optional(),
  next_available_at:     z.iso.datetime().nullable().optional(),
})
export type StaffWithSchedule = z.infer<typeof StaffWithScheduleSchema>

export const StaffMemberWithStatsSchema = StaffMemberRowSchema.extend({
  month_bookings: z.number().int().default(0),
  month_revenue:  z.number().default(0),
})
export type StaffMemberWithStats = z.infer<typeof StaffMemberWithStatsSchema>
