import { z } from 'zod'

export const OrgTypeSchema = z.enum(['franchise', 'independent', 'chain', 'virtual'])
export type OrgType = z.infer<typeof OrgTypeSchema>

export const BusinessTypeSchema = z.enum([
  'beauty_salon', 'spa', 'barbershop', 'nail_salon',
  'wellness', 'clinic', 'therapy', 'other',
])
export type BusinessType = z.infer<typeof BusinessTypeSchema>

export const OrgStatusSchema = z.enum(['pending', 'active', 'suspended', 'inactive'])
export type OrgStatus = z.infer<typeof OrgStatusSchema>

export const OrganizationRowSchema = z.object({
  id:            z.uuid(),
  org_type:      OrgTypeSchema,
  name:          z.string().min(1).max(255),
  slug:          z.string().min(2).max(100),
  owner_id:      z.string().uuid().nullable(),
  partner_id:    z.uuid().nullable(),
  legal_name:    z.string().nullable(),
  parent_org_id: z.uuid().nullable(),
  business_type: BusinessTypeSchema.nullable(),
  contact_email: z.email().nullable(),
  contact_phone: z.string().nullable(),
  gst_number:    z.string().nullable(),
  pan_number:    z.string().nullable(),
  logo_url:      z.url().nullable(),
  description:   z.string().nullable(),
  status:        OrgStatusSchema.default('pending'),
  settings:      z.record(z.string(), z.unknown()).default({}),
  deleted_at:    z.iso.datetime().nullable(),
  created_at:    z.iso.datetime(),
  updated_at:    z.iso.datetime(),
})
export type OrganizationRow = z.infer<typeof OrganizationRowSchema>

export const OrganizationInsertSchema = OrganizationRowSchema.omit({
  id: true, created_at: true, updated_at: true, deleted_at: true,
})
export type OrganizationInsert = z.infer<typeof OrganizationInsertSchema>

export const OrganizationUpdateSchema = OrganizationInsertSchema.omit({
  slug: true,
}).partial()
export type OrganizationUpdate = z.infer<typeof OrganizationUpdateSchema>

export const CreateOrgRequestSchema = z.object({
  org_type:      OrgTypeSchema,
  name:          z.string().min(2).max(255),
  slug:          z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug: lowercase, numbers, hyphens only'),
  business_type: BusinessTypeSchema.optional(),
  contact_email: z.email().optional(),
  contact_phone: z.string().optional(),
  gst_number:    z.string().optional(),
  parent_org_id: z.uuid().optional(),
  owner_id:      z.string().uuid().optional(),
  partner_id:    z.string().optional(),
})
export type CreateOrgRequest = z.infer<typeof CreateOrgRequestSchema>
