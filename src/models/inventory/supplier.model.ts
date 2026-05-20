import { z } from 'zod'

export const SupplierRowSchema = z.object({
  id:         z.uuid(),
  org_id:     z.uuid(),
  name:       z.string().min(1).max(255),
  phone:      z.string().nullable(),
  email:      z.email().nullable(),
  address:    z.string().nullable(),
  gst_number: z.string().nullable(),
  notes:      z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type SupplierRow = z.infer<typeof SupplierRowSchema>

export const SupplierInsertSchema = SupplierRowSchema.omit({ id: true, created_at: true, updated_at: true })
export type SupplierInsert = z.infer<typeof SupplierInsertSchema>

export const SupplierUpdateSchema = SupplierInsertSchema.omit({ org_id: true }).partial()
export type SupplierUpdate = z.infer<typeof SupplierUpdateSchema>
