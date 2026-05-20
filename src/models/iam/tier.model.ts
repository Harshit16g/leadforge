import { z } from 'zod'

export const TierKeySchema = z.enum(['admin', 'org', 'partner', 'staff', 'customer'])
export type TierKey = z.infer<typeof TierKeySchema>

export const TierRowSchema = z.object({
  id:       z.number().int(),
  tier_key: TierKeySchema,
  level:    z.number().int(),
  label:    z.string(),
})
export type TierRow = z.infer<typeof TierRowSchema>
