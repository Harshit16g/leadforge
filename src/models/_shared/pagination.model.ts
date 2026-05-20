import { z } from 'zod'

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data:        z.array(itemSchema),
    total:       z.number().int(),
    page:        z.number().int().default(1),
    limit:       z.number().int().default(20),
    total_pages: z.number().int(),
  })

export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({ ok: z.literal(true), data: dataSchema })

export const ApiErrorSchema = z.object({
  ok:      z.literal(false).optional(),
  error:   z.string(),
  code:    z.string().optional(),
  details: z.unknown().optional(),
})

export type ApiError = z.infer<typeof ApiErrorSchema>

export const PaginationQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>
