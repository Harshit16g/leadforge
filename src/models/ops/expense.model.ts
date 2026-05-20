import { z } from 'zod'

export const RecurrenceSchema = z.enum(['daily', 'weekly', 'monthly', 'yearly'])
export type Recurrence = z.infer<typeof RecurrenceSchema>

export const ExpenseRowSchema = z.object({
  id:           z.uuid(),
  org_id:       z.uuid(),
  branch_id:    z.uuid().nullable(),
  category:     z.string().min(1),
  description:  z.string().nullable(),
  amount:       z.number().min(0),
  expense_date: z.string(),
  is_recurring: z.boolean().default(false),
  recurrence:   RecurrenceSchema.nullable(),
  added_by:     z.uuid().nullable(),
  created_at:   z.iso.datetime(),
  updated_at:   z.iso.datetime(),
})
export type ExpenseRow = z.infer<typeof ExpenseRowSchema>

export const ExpenseInsertSchema = ExpenseRowSchema.omit({
  id: true, created_at: true, updated_at: true,
})
export type ExpenseInsert = z.infer<typeof ExpenseInsertSchema>

export const ExpenseUpdateSchema = ExpenseInsertSchema.omit({ org_id: true }).partial()
export type ExpenseUpdate = z.infer<typeof ExpenseUpdateSchema>

export const CreateExpenseRequestSchema = z.object({
  org_id:       z.uuid(),
  branch_id:    z.uuid().optional(),
  category:     z.string().min(1),
  description:  z.string().optional(),
  amount:       z.number().min(0),
  expense_date: z.string(),
  is_recurring: z.boolean().optional().default(false),
  recurrence:   RecurrenceSchema.optional(),
})
export type CreateExpenseRequest = z.infer<typeof CreateExpenseRequestSchema>
