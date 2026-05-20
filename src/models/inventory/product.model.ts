import { z } from 'zod'

export const ProductRowSchema = z.object({
  id:             z.uuid(),
  org_id:         z.uuid(),
  name:           z.string().min(1).max(255),
  category:       z.string().nullable(),
  brand:          z.string().nullable(),
  sku:            z.string().nullable(),
  unit:           z.string().default('pcs'),
  purchase_price: z.number().min(0).default(0),
  selling_price:  z.number().min(0).default(0),
  gst_rate:       z.number().min(0).max(100).default(0),
  current_stock:  z.number().int().default(0),
  reorder_level:  z.number().int().default(5),
  is_active:      z.boolean().default(true),
  created_at:     z.string(),
  updated_at:     z.string(),
})
export type ProductRow = z.infer<typeof ProductRowSchema>

export const ProductInsertSchema = ProductRowSchema.omit({ id: true, created_at: true, updated_at: true })
export type ProductInsert = z.infer<typeof ProductInsertSchema>

export const ProductUpdateSchema = ProductInsertSchema.omit({ org_id: true }).partial()
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>

export const LowStockAlertSchema = z.object({
  product_id:    z.uuid(),
  name:          z.string(),
  current_stock: z.number().int(),
  reorder_level: z.number().int(),
})
export type LowStockAlert = z.infer<typeof LowStockAlertSchema>
