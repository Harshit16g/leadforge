import { z } from 'zod'

export const NotificationChannelSchema = z.enum(['in_app', 'push', 'email'])
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>

export const NotificationRowSchema = z.object({
  id:           z.string().uuid(),
  org_id:       z.string().uuid().nullable(),
  recipient_id: z.string().uuid(),
  channel:      NotificationChannelSchema.default('in_app'),
  title:        z.string(),
  body:         z.string(),
  data:         z.record(z.string(), z.unknown()).default({}),
  read_at:      z.string().datetime().nullable(),
  created_at:   z.string().datetime(),
})
export type NotificationRow = z.infer<typeof NotificationRowSchema>

export const CreateNotificationRequestSchema = z.object({
  org_id:       z.string().uuid().optional(),
  recipient_id: z.string().uuid(),
  channel:      NotificationChannelSchema.optional(),
  title:        z.string().min(1),
  body:         z.string().min(1),
  data:         z.record(z.string(), z.unknown()).optional(),
})
export type CreateNotificationRequest = z.infer<typeof CreateNotificationRequestSchema>
