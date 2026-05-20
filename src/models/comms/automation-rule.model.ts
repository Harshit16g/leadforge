import { z } from 'zod'

export const TriggerEventSchema = z.enum([
  'booking.assigned', 'booking.reminder', 'booking.completed', 'booking.cancelled',
  'walkin.started',
  'waitlist.slot_available', 'payroll.payslip_ready', 'attendance.morning',
  'customer.birthday', 'customer.anniversary', 'customer.re_engagement',
])
export type TriggerEvent = z.infer<typeof TriggerEventSchema>

export const AutomationRuleRowSchema = z.object({
  id:                     z.string().uuid(),
  org_id:                 z.string().uuid(),
  rule_name:              z.string().min(1).max(255),
  channel:                z.enum(['whatsapp', 'sms', 'email']),
  trigger_event:          z.string(),
  trigger_offset_minutes: z.number().int().default(0),
  template_id:            z.string().uuid().nullable(),
  conditions:             z.record(z.string(), z.unknown()).default({}),
  is_active:              z.boolean().default(true),
  total_fired:            z.number().int().default(0),
  created_by:             z.string().uuid().nullable(),
  created_at:             z.string(),
  updated_at:             z.string(),
})
export type AutomationRuleRow = z.infer<typeof AutomationRuleRowSchema>

export const CreateRuleRequestSchema = z.object({
  org_id:                 z.string().uuid(),
  rule_name:              z.string().min(1).max(255),
  channel:                z.enum(['whatsapp', 'sms', 'email']),
  trigger_event:          TriggerEventSchema,
  trigger_offset_minutes: z.number().int().optional().default(0),
  template_id:            z.string().uuid().optional(),
  conditions:             z.record(z.string(), z.unknown()).optional().default({}),
})
export type CreateRuleRequest = z.infer<typeof CreateRuleRequestSchema>
