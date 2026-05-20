import { z } from 'zod'

export const InstanceRequestStatusSchema = z.enum([
  'pending', 'approved', 'rejected', 'waitlisted',
])
export type InstanceRequestStatus = z.infer<typeof InstanceRequestStatusSchema>

export const InstanceRequestRowSchema = z.object({
  id:            z.uuid(),
  org_id:        z.uuid().nullable(),
  contact_name:  z.string().min(1),
  contact_phone: z.string().min(7).max(20),
  contact_email: z.email().nullable(),
  business_name: z.string().min(1),
  notes:         z.string().nullable(),
  status:        InstanceRequestStatusSchema.default('pending'),
  admin_notes:   z.string().nullable(),
  instance_name: z.string().nullable(),
  reviewed_by:   z.uuid().nullable(),
  reviewed_at:   z.string().nullable(),
  created_at:    z.string(),
  updated_at:    z.string(),
})
export type InstanceRequestRow = z.infer<typeof InstanceRequestRowSchema>

export const CreateInstanceRequestSchema = z.object({
  contact_name:  z.string().min(1).max(255),
  contact_phone: z.string().min(7).max(20),
  contact_email: z.email().optional(),
  business_name: z.string().min(1).max(255),
  notes:         z.string().max(1000).optional(),
})
export type CreateInstanceRequest = z.infer<typeof CreateInstanceRequestSchema>

export const ReviewInstanceRequestSchema = z.object({
  status:        z.enum(['approved', 'rejected', 'waitlisted']),
  admin_notes:   z.string().optional(),
  instance_name: z.string().optional(),
})
export type ReviewInstanceRequest = z.infer<typeof ReviewInstanceRequestSchema>
