import { z } from 'zod'

export const PlatformSettingRowSchema = z.object({
  key:        z.string().min(1),
  value:      z.record(z.string(), z.unknown()),
  description: z.string().nullable(),
  updated_at: z.string(),
  updated_by: z.uuid().nullable(),
})
export type PlatformSettingRow = z.infer<typeof PlatformSettingRowSchema>

export const UpsertSettingRequestSchema = z.object({
  key:         z.string().min(1),
  value:       z.record(z.string(), z.unknown()),
  description: z.string().optional(),
})
export type UpsertSettingRequest = z.infer<typeof UpsertSettingRequestSchema>
