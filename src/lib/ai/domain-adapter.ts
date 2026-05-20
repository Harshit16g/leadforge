/**
 * [DOMAIN ADAPTER] Translates AI Intent -> Leaex System Actions (RPCs)
 */

export interface SystemAction {
  rpc: string;
  payload: any;
  lifecycle_guard?: string; // e.g., 'confirmed' status required
}

export function mapIntentToAction(intent: string, params: any): SystemAction | null {
  switch (intent) {
    case "create_booking":
      return {
        rpc: "crm.stage_request",
        payload: { ...params, intent: "create_booking" }
      };
    
    case "start_service":
      return {
        rpc: "crm.update_booking_status",
        payload: { status: "service_start_pending" },
        lifecycle_guard: "confirmed"
      };

    case "complete_service":
      return {
        rpc: "crm.update_booking_status",
        payload: { status: "service_complete_pending" },
        lifecycle_guard: "in_progress"
      };

    case "cancel_booking":
      return {
        rpc: "crm.walkin_cancel_v1",
        payload: { booking_id: params.booking_id }
      };

    default:
      return null;
  }
}
