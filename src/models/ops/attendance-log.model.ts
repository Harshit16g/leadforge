import { z } from 'zod'

export const AttendanceStatusSchema = z.enum([
  'present', 'late', 'absent', 'half_day', 'leave', 'holiday',
])
export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>

export const CheckInMethodSchema = z.enum(['manual', 'qr_code', 'gps'])
export type CheckInMethod = z.infer<typeof CheckInMethodSchema>

export const LocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
}).optional()

export const AttendanceLogRowSchema = z.object({
  id:               z.uuid(),
  staff_id:         z.uuid(),
  org_id:           z.uuid(),
  branch_id:        z.uuid().nullable(),
  date:             z.string(),
  clocked_in_at:    z.iso.datetime().nullable(),
  clocked_out_at:   z.iso.datetime().nullable(),
  status:           AttendanceStatusSchema.default('present'),
  check_in_method:  CheckInMethodSchema.default('manual'),
  location:         LocationSchema,
  notes:            z.string().nullable(),
  approved_by:      z.uuid().nullable(),
  created_at:       z.iso.datetime(),
  updated_at:       z.iso.datetime(),
})
export type AttendanceLogRow = z.infer<typeof AttendanceLogRowSchema>

export const ClockInRequestSchema = z.object({
  location: LocationSchema,
  method:   CheckInMethodSchema.optional().default('manual'),
})
export type ClockInRequest = z.infer<typeof ClockInRequestSchema>

export const ClockOutRequestSchema = z.object({
  location: LocationSchema,
  notes:    z.string().optional(),
})
export type ClockOutRequest = z.infer<typeof ClockOutRequestSchema>

export const AttendanceHeatmapSchema = z.object({
  date:   z.string(),
  status: AttendanceStatusSchema,
  hours:  z.number().optional(),
})
export type AttendanceHeatmap = z.infer<typeof AttendanceHeatmapSchema>
