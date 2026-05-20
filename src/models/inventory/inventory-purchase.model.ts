import { z } from 'zod'

export const InventoryPurchaseRowSchema = z.object({
  id:             z.uuid(),
  org_id:         z.uuid(),
  product_id:     z.uuid(),
  supplier_id:    z.uuid().nullable(),
  quantity:       z.number().int().min(1),
  unit_price:     z.number().min(0),
  total_price:    z.number().min(0),
  invoice_number: z.string().nullable(),
  purchase_date:  z.string(),
  notes:          z.string().nullable(),
  created_by:     z.uuid().nullable(),
  created_at:     z.string(),
  // Relational
  product:  z.object({ id: z.uuid(), name: z.string(), category: z.string().nullable() }).optional(),
  supplier: z.object({ id: z.uuid(), name: z.string() }).optional(),
})
export type InventoryPurchaseRow = z.infer<typeof InventoryPurchaseRowSchema>

export const CreatePurchaseRequestSchema = z.object({
  org_id:         z.uuid(),
  product_id:     z.uuid(),
  supplier_id:    z.uuid().optional(),
  quantity:       z.number().int().min(1),
  unit_price:     z.number().min(0),
  invoice_number: z.string().optional(),
  purchase_date:  z.string(),
  notes:          z.string().optional(),
})
export type CreatePurchaseRequest = z.infer<typeof CreatePurchaseRequestSchema>
