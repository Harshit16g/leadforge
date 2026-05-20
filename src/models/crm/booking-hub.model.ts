export type HubRole = "customer" | "employee" | "partner" | "admin";

export interface HubBooking {
  id: string;
  org_id: string;
  customer_id: string;
  staff_id: string | null;
  branch_id: string | null;
  status: string;
  scheduled_at: string;
  duration_minutes: number | null;
  total_amount: number | null;
  final_amount: number | null;
  payment_status: string | null;
  payment_method: string | null;
  notes: string | null;
  source: string | null;
  conflict: boolean;
  // Resolved relations
  services: string[];
  staff_name: string | null;
  staff_photo: string | null;
  branch_name: string | null;
  branch_address: string | null;
  branch_phone: string | null;
  org_name: string;
  customer_name: string | null;
  customer_phone: string | null;
}

export interface HubAuthRequest {
  id: string;
  booking_id: string;
  request_type: "reschedule" | "cancel";
  status: string;
  proposed_data: Record<string, unknown> | null;
  reason: string | null;
  expiry_option: string | null;
  expires_at: string | null;
  cooldown_until: string | null;
  created_at: string;
  created_by_role: string;
}

export interface HubAnnotation {
  id: string;
  booking_id: string;
  stream: "internal" | "customer";
  category: string;
  body: string;
  author_id: string;
  author_role: string;
  created_at: string;
}

export interface HubDataResponse {
  role: HubRole;
  booking: HubBooking;
  active_auth_request: HubAuthRequest | null;
  // Populated for partner/admin view
  customer_visit_count?: number;
  customer_lifetime_spend?: number;
}
