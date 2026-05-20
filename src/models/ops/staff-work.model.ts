import { z } from 'zod'

export const WorkStatusSchema = z.enum(['pending', 'approved', 'rejected'])
export type WorkStatus = z.infer<typeof WorkStatusSchema>

export const StaffWorkRowSchema = z.object({
  id:             z.string().uuid(),
  org_id:         z.string().uuid(),
  staff_id:       z.string().uuid(),
  title:          z.string().min(1).max(200),
  description:    z.string().nullable(),
  media_urls:     z.array(z.string().url()).default([]),
  tags:           z.array(z.string()).default([]),
  service_ids:    z.array(z.string().uuid()).default([]),
  status:         WorkStatusSchema.default('pending'),
  rejection_note: z.string().nullable(),
  reviewed_at:    z.string().nullable(),
  reviewed_by:    z.string().uuid().nullable(),
  created_at:     z.string(),
  updated_at:     z.string(),
})
export type StaffWorkRow = z.infer<typeof StaffWorkRowSchema>

export const StaffWorkInsertSchema = z.object({
  org_id:      z.string().uuid(),
  staff_id:    z.string().uuid(),
  title:       z.string().min(1).max(200),
  description: z.string().optional(),
  media_urls:  z.array(z.string().url()).min(1, 'At least one image required'),
  tags:        z.array(z.string()).optional().default([]),
  service_ids: z.array(z.string().uuid()).optional().default([]),
})
export type StaffWorkInsert = z.infer<typeof StaffWorkInsertSchema>
