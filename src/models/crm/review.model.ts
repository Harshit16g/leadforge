import { z } from 'zod'

export const ReviewPlatformSchema = z.enum(['in_app', 'google', 'yelp'])
export type ReviewPlatform = z.infer<typeof ReviewPlatformSchema>

const RatingSchema = z.number().int().min(1).max(5)

export const ReviewRowSchema = z.object({
  id:                 z.uuid(),
  org_id:             z.uuid(),
  branch_id:          z.uuid().nullable(),
  customer_id:        z.uuid().nullable(),
  booking_id:         z.uuid().nullable(),
  overall_rating:     RatingSchema,
  stylist_rating:     RatingSchema.nullable(),
  cleanliness_rating: RatingSchema.nullable(),
  value_rating:       RatingSchema.nullable(),
  review_text:        z.string().nullable(),
  photo_url:          z.url().nullable(),
  is_published:       z.boolean().default(false),
  platform:           ReviewPlatformSchema.default('in_app'),
  owner_reply:        z.string().nullable().optional(),
  created_at:         z.string().datetime(),
  updated_at:         z.string().datetime(),
})
export type ReviewRow = z.infer<typeof ReviewRowSchema>

export const CreateReviewRequestSchema = z.object({
  org_id:             z.uuid(),
  branch_id:          z.uuid().optional(),
  customer_id:        z.uuid().optional(),
  booking_id:         z.uuid().optional(),
  overall_rating:     RatingSchema,
  stylist_rating:     RatingSchema.optional(),
  cleanliness_rating: RatingSchema.optional(),
  value_rating:       RatingSchema.optional(),
  review_text:        z.string().max(2000).optional(),
})
export type CreateReviewRequest = z.infer<typeof CreateReviewRequestSchema>

export const ReviewWithCustomerSchema = ReviewRowSchema.extend({
  customers: z.object({ id: z.string(), name: z.string(), phone: z.string() }).nullable().optional(),
})
export type ReviewWithCustomer = z.infer<typeof ReviewWithCustomerSchema>
