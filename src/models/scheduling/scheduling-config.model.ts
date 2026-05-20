import { z } from 'zod'
import { OperatingHoursSchema } from '@/models/orgs/branch.model'

export const SchedulingConfigRowSchema = z.object({
  id:                        z.uuid(),
  org_id:                    z.uuid(),
  branch_id:                 z.uuid().nullable(),
  slot_duration_minutes:     z.number().int().min(5).max(240).default(30),
  buffer_default_minutes:    z.number().int().min(0).max(60).default(10),
  advance_booking_days:      z.number().int().min(1).max(90).default(30),
  cancellation_window_hours: z.number().int().min(0).max(168).default(24),
  max_utilization_pct:       z.number().int().min(50).max(100).default(80),
  waitlist_enabled:          z.boolean().default(true),
  auto_assign_enabled:       z.boolean().default(true),
  ai_optimizer_enabled:      z.boolean().default(false),
  business_hours:            OperatingHoursSchema,
  peak_hours_config:         z.record(z.string(), z.unknown()).default({}),
  settings:                  z.record(z.string(), z.unknown()).default({}),
  created_at:                z.iso.datetime(),
  updated_at:                z.iso.datetime(),
})
export type SchedulingConfigRow = z.infer<typeof SchedulingConfigRowSchema>

export const UpdateSchedulingConfigRequestSchema = z.object({
  slot_duration_minutes:     z.number().int().min(5).max(240).optional(),
  buffer_default_minutes:    z.number().int().min(0).max(60).optional(),
  advance_booking_days:      z.number().int().min(1).max(90).optional(),
  cancellation_window_hours: z.number().int().min(0).max(168).optional(),
  max_utilization_pct:       z.number().int().min(50).max(100).optional(),
  waitlist_enabled:          z.boolean().optional(),
  auto_assign_enabled:       z.boolean().optional(),
  ai_optimizer_enabled:      z.boolean().optional(),
  business_hours:            OperatingHoursSchema.optional(),
})
export type UpdateSchedulingConfigRequest = z.infer<typeof UpdateSchedulingConfigRequestSchema>
