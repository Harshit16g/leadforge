import { z } from 'zod'

export const ContextTypeSchema = z.enum(['platform', 'org', 'branch'])
export type ContextType = z.infer<typeof ContextTypeSchema>

export const PermissionContextSchema = z.object({
  context_type: ContextTypeSchema,
  context_id:   z.uuid().optional(),
})
export type PermissionContext = z.infer<typeof PermissionContextSchema>

export const ModuleKeySchema = z.enum([
  'crm', 'bookings', 'scheduling', 'billing', 'analytics',
  'inventory', 'comms', 'wa_api', 'google_biz', 'onboarding',
  'auth_iam', 'audit_logs', 'media_cdn', 'staff_mgmt',
  'day_closing', 'expenses', 'settings',
])
export type ModuleKey = z.infer<typeof ModuleKeySchema>

export const ActionKeySchema = z.enum([
  'view', 'create', 'edit', 'delete', 'export',
  'manage', 'configure', 'approve', 'send',
])
export type ActionKey = z.infer<typeof ActionKeySchema>
