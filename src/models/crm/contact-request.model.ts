import { z } from 'zod'

export const ContactStatusSchema = z.enum(['unread', 'in_progress', 'resolved', 'spam'])
export type ContactStatus = z.infer<typeof ContactStatusSchema>

export const ContactSourceSchema = z.enum(['website', 'whatsapp', 'qr', 'referral'])
export type ContactSource = z.infer<typeof ContactSourceSchema>

export const ContactRequestRowSchema = z.object({
  id:            z.uuid(),
  org_id:        z.uuid().nullable(),
  business_name: z.string().nullable(),
  contact_name:  z.string().min(1),
  phone:         z.string().min(7).max(20),
  email:         z.email().nullable(),
  city:          z.string().nullable(),
  message:       z.string().nullable(),
  source:        ContactSourceSchema.default('website'),
  status:        ContactStatusSchema.default('unread'),
  assigned_to:   z.uuid().nullable(),
  created_at:    z.iso.datetime(),
  updated_at:    z.iso.datetime(),
})
export type ContactRequestRow = z.infer<typeof ContactRequestRowSchema>

export const CreateContactRequestSchema = z.object({
  contact_name:  z.string().min(1).max(255),
  phone:         z.string().min(7).max(20),
  email:         z.email().optional(),
  business_name: z.string().optional(),
  city:          z.string().optional(),
  message:       z.string().max(2000).optional(),
  source:        ContactSourceSchema.optional().default('website'),
})
export type CreateContactRequest = z.infer<typeof CreateContactRequestSchema>

export const UpdateContactRequestSchema = z.object({
  status:      ContactStatusSchema.optional(),
  assigned_to: z.uuid().optional(),
})
export type UpdateContactRequest = z.infer<typeof UpdateContactRequestSchema>
