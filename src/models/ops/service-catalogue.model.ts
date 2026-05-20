import { z } from 'zod'

export const ServiceRowSchema = z.object({
  id:               z.uuid(),
  org_id:           z.uuid(),
  branch_id:        z.uuid().nullable(),
  name:             z.string().min(1).max(255),
  category:         z.string().nullable(),
  description:      z.string().nullable(),
  duration_minutes: z.number().int().min(1).default(30),
  price:            z.number().min(0),
  gst_rate:         z.number().min(0).max(100).default(0),
  sort_order:       z.number().int().default(0),
  is_active:        z.boolean().default(true),
  created_at:       z.iso.datetime(),
  updated_at:       z.iso.datetime(),
})
export type ServiceRow = z.infer<typeof ServiceRowSchema>

export const ServiceInsertSchema = ServiceRowSchema.omit({
  id: true, created_at: true, updated_at: true,
})
export type ServiceInsert = z.infer<typeof ServiceInsertSchema>

export const ServiceUpdateSchema = ServiceInsertSchema.omit({ org_id: true }).partial()
export type ServiceUpdate = z.infer<typeof ServiceUpdateSchema>

export const CreateServiceRequestSchema = z.object({
  org_id:           z.uuid(),
  branch_id:        z.uuid().optional(),
  name:             z.string().min(1).max(255),
  category:         z.string().optional(),
  description:      z.string().optional(),
  duration_minutes: z.number().int().min(5).default(30),
  price:            z.number().min(0),
  gst_rate:         z.number().min(0).max(28).optional().default(0),
  sort_order:       z.number().int().optional().default(0),
})
export type CreateServiceRequest = z.infer<typeof CreateServiceRequestSchema>
