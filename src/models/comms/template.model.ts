import { z } from 'zod'

export const TemplateChannelSchema = z.enum(['whatsapp', 'sms', 'email'])
export type TemplateChannel = z.infer<typeof TemplateChannelSchema>

export const TemplateEventTypeSchema = z.enum([
  'booking_confirm', 'reminder', 'birthday', 'anniversary',
  'manual_crm', 're_engagement', 'inbound',
  'appointment_assigned', 'waitlist_offer', 'booking_cancelled',
  'payslip_ready', 'clock_in_reminder',
])
export type TemplateEventType = z.infer<typeof TemplateEventTypeSchema>

export const TemplateRowSchema = z.object({
  id:         z.string().uuid(),
  org_id:     z.string().uuid().nullable(),
  name:       z.string().min(1).max(255),
  channel:    TemplateChannelSchema,
  event_type: TemplateEventTypeSchema,
  subject:    z.string().nullable(),
  body:       z.string().min(1),
  variables:  z.array(z.string()).default([]),
  is_active:  z.boolean().default(true),
  is_system:  z.boolean().default(false),
  is_public:  z.boolean().default(false),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type TemplateRow = z.infer<typeof TemplateRowSchema>

export const TemplateInsertSchema = TemplateRowSchema.omit({
  id: true, created_at: true, updated_at: true,
})
export type TemplateInsert = z.infer<typeof TemplateInsertSchema>

export const TemplateUpdateSchema = TemplateInsertSchema.pick({
  name: true, body: true, subject: true, variables: true, is_active: true,
}).partial()
export type TemplateUpdate = z.infer<typeof TemplateUpdateSchema>
