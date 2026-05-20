import { getServiceClient } from "./db";

export type AuditAction = 
  | 'external.campaign_sent'
  | 'external.sms_sent'
  | 'external.calendar_synced'
  | 'system.config_changed'
  | 'admin.action_performed';

export async function logAudit(
  orgId: string,
  actorId: string,
  action: AuditAction | string,
  targetType: string,
  targetId: string,
  afterState: Record<string, any> = {},
  actorRole: string = 'partner'
) {
  const db = getServiceClient();
  try {
    await db.schema('platform').rpc('write_audit_log', {
      p_org_id: orgId,
      p_actor_id: actorId,
      p_actor_role: actorRole,
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId,
      p_after_state: afterState
    });
  } catch (error) {
    console.error(`Failed to log audit: ${action}`, error);
  }
}
