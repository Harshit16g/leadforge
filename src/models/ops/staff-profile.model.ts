import { z } from 'zod'

export const StaffProfileRowSchema = z.object({
  id:               z.string().uuid(),
  org_id:           z.string().uuid(),
  bio:              z.string().nullable(),
  tagline:          z.string().nullable(),
  specialities:     z.array(z.string()).default([]),
  years_experience: z.number().int().min(0).default(0),
  instagram_url:    z.string().url().nullable(),
  show_on_booking:  z.boolean().default(true),
  display_order:    z.number().int().default(0),
  created_at:       z.string(),
  updated_at:       z.string(),
})
export type StaffProfileRow = z.infer<typeof StaffProfileRowSchema>

export const StaffProfileUpsertSchema = StaffProfileRowSchema.omit({ created_at: true, updated_at: true }).partial({
  bio: true, tagline: true, specialities: true, years_experience: true, instagram_url: true, show_on_booking: true, display_order: true,
})
export type StaffProfileUpsert = z.infer<typeof StaffProfileUpsertSchema>
