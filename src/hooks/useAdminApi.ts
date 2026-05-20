/**
 * useAdminApi — Leaex V2
 * Shared fetch hooks for all admin pages.
 * Each hook returns { data, loading, error, refetch }.
 */
"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Generic fetch hook ────────────────────────────────────────────────────────

function useFetch<T>(url: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fetch failed");
      setData(json.data ?? json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

   
  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}

// ─── Paginated fetch ──────────────────────────────────────────────────────────

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  total_pages: number;
}

function usePaginatedFetch<T>(
  baseUrl: string,
  params: Record<string, string | number | boolean | null | undefined> = {},
  deps: unknown[] = []
) {
  const [result, setResult] = useState<PaginatedResult<T>>({ data: [], total: 0, page: 1, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildUrl = useCallback(() => {
    const u = new URL(baseUrl, "http://localhost");
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== "") u.searchParams.set(k, String(v));
    });
    return u.pathname + u.search;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, ...deps]);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl());
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fetch failed");
      setResult({
        data: json.data ?? [],
        total: json.total ?? 0,
        page: json.page ?? 1,
        total_pages: json.total_pages ?? 1,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

   
  useEffect(() => { fetch_(); }, [fetch_]);

  return { ...result, loading, error, refetch: fetch_ };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export type AdminDashboardKPIs = {
  total_partners: number;
  active_bookings: number;
  monthly_revenue: number;
  trial_partners: number;
};

export type AdminDashboardPartner = {
  id: string;
  name: string;
  partner_id: string;
  business_type: string;
  city: string;
  status: string;
  created_at: string;
  month_bookings: number;
  month_revenue: number;
};

export type AdminDashboardData = {
  kpis: AdminDashboardKPIs;
  recent_partners: AdminDashboardPartner[];
};

export function useAdminDashboard() {
  return useFetch<AdminDashboardData>("/api/admin/dashboard");
}

// ─── Partners ─────────────────────────────────────────────────────────────────

export type AdminPartner = {
  id: string;
  name: string;
  partner_id: string;
  business_type: string;
  phone: string;
  email: string;
  city: string;
  status: string;
  created_at: string;
  month_bookings: number;
  month_revenue: number;
};

export function useAdminPartners(params: {
  page?: number;
  status?: string;
  search?: string;
} = {}) {
  return usePaginatedFetch<AdminPartner>("/api/admin/partners", params, [
    params.page, params.status, params.search,
  ]);
}

// ─── Customers ────────────────────────────────────────────────────────────────

export type AdminCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  total_visits: number;
  total_spend: number;
  last_visit_at: string | null;
  created_at: string;
};

export function useAdminCustomers(params: { page?: number; search?: string } = {}) {
  return usePaginatedFetch<AdminCustomer>("/api/admin/customers", params, [
    params.page, params.search,
  ]);
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export type OnboardingApplication = {
  id: string;
  name: string;
  business_type: string;
  owner_id: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  status: string;
  created_at: string;
};

export type OnboardingKPIs = {
  total: number;
  pending: number;
  info_required: number;
  approved: number;
};

export type OnboardingData = {
  data: OnboardingApplication[];
  kpis: OnboardingKPIs;
};

export function useAdminOnboarding(status?: string) {
  const url = status ? `/api/admin/onboarding?status=${status}` : "/api/admin/onboarding";
  return useFetch<OnboardingData>(url, [status]);
}

// ─── Revenue ──────────────────────────────────────────────────────────────────

export type AdminRevenueData = {
  total_revenue: number;
  prev_revenue: number;
  total_visits: number;
  avg_booking_value: number;
  revenue_growth: number;
  daily_revenue: { date: string; revenue: number; bookings: number }[];
  top_partners: { id: string; name: string; revenue: number; bookings: number }[];
  payment_breakdown: Record<string, number>;
};

export function useAdminRevenue(month?: string) {
  const url = month ? `/api/admin/revenue?month=${month}` : "/api/admin/revenue";
  return useFetch<AdminRevenueData>(url, [month]);
}

export type AdminRevenueStats = {
  mrr: number;
  active_subscriptions: number;
  trialing_users: number;
  grace_period_users: number;
  churn_rate: number;
  conversion_rate: number;
  currency: string;
};

export function useAdminRevenueStats() {
  return useFetch<AdminRevenueStats>("/api/admin/revenue/stats");
}

// ─── Bookings Report ──────────────────────────────────────────────────────────

export type AdminBooking = {
  id: string;
  partner_id: string;
  scheduled_at: string;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  customers: { name: string; phone: string } | null;
  services: { name: string }[] | null;
  employees: { name: string } | null;
  partners: { business_name: string; city: string } | null;
};

export function useAdminBookingsReport(params: {
  page?: number;
  status?: string;
  partner_id?: string;
  date_from?: string;
  date_to?: string;
} = {}) {
  return usePaginatedFetch<AdminBooking>("/api/admin/bookings-report", params, [
    params.page, params.status, params.partner_id, params.date_from, params.date_to,
  ]);
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export type AdminPlan = {
  id: string;
  display_name: string;
  plan_key: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  max_branches: number;
  max_staff: number;
  is_active: boolean;
  is_highlighted?: boolean;
  is_public?: boolean;
  tier_position?: number;
  scale_insights?: { title: string; value: string }[];
  pro_tips?: string[];
  comparison_data?: Record<string, string>;
  created_at: string;
};

export function useAdminPlans() {
  return useFetch<AdminPlan[]>("/api/admin/plans");
}

// ─── Plan Features ────────────────────────────────────────────────────────────

export type PlanFeature = {
  id: string;
  plan_id: string;
  feature_key: string;
  enabled: boolean;
};

export type PlanFeaturesData = {
  plans: { id: string; display_name: string; plan_key: string }[];
  features: PlanFeature[];
};

export function useAdminPlanFeatures() {
  return useFetch<PlanFeaturesData>("/api/admin/plans/features");
}

// ─── Trials ───────────────────────────────────────────────────────────────────

export type TrialPartner = {
  id: string;
  business_name: string;
  business_type: string;
  phone: string;
  email: string;
  city: string;
  status: string;
  trial_ends_at: string | null;
  created_at: string;
};

export type TrialsData = {
  data: TrialPartner[];
  kpis: { total: number; expiring_soon: number; avg_days_remaining: number };
};

export function useAdminTrials() {
  return useFetch<TrialsData>("/api/admin/trials");
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export type AuditLogEntry = {
  id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  meta: Record<string, unknown>;
  created_at: string;
};

export function useAdminAuditLog(params: { page?: number; action?: string } = {}) {
  return usePaginatedFetch<AuditLogEntry>("/api/admin/audit-log", params, [
    params.page, params.action,
  ]);
}

// ─── Bookings Stats ───────────────────────────────────────────────────────────

export type BookingsTrendPoint = {
  label: string;
  online: number;
  walkin: number;
};

export type BookingsPeakHour = {
  hour: number;
  label: string;
  count: number;
};

export type BookingsPartnerRow = {
  partner_id: string;
  partner_name: string;
  online: number;
  walkin: number;
  cancellations: number;
  revenue: number;
  avg_rating: number;
};

export type BookingsStatsData = {
  period: string;
  date_from: string;
  date_to: string;
  kpis: {
    online_count: number;
    walkin_count: number;
    cancellation_count: number;
    cancellation_rate: number;
    unique_customers: number;
    repeat_rate: number;
  };
  trend: BookingsTrendPoint[];
  peak_hours: BookingsPeakHour[];
  per_partner: BookingsPartnerRow[];
};

export function useAdminBookingsStats(params: {
  period?: string;
  date_from?: string;
  date_to?: string;
} = {}) {
  return useFetch<BookingsStatsData>(
    `/api/admin/bookings-report/stats?${new URLSearchParams(
      Object.fromEntries(
        Object.entries({ period: "monthly", ...params }).filter(([, v]) => v)
      ) as Record<string, string>
    ).toString()}`,
    [params.period, params.date_from, params.date_to]
  );
}

// ─── Dashboard Trend ──────────────────────────────────────────────────────────

export type TrendPoint = { label: string; bookings: number; revenue: number };

export function useAdminDashboardTrend(range: string) {
  return useFetch<TrendPoint[]>(`/api/admin/dashboard/trend?range=${range}`, [range]);
}

// ─── Dashboard Activity Feed ──────────────────────────────────────────────────

export type ActivityEvent = {
  id: string;
  type: "partner" | "booking" | "trial";
  icon: string;
  color: string;
  message: string;
  time: string;
};

export function useAdminDashboardEvents() {
  return useFetch<ActivityEvent[]>("/api/admin/dashboard/events");
}

// ─── Communications ───────────────────────────────────────────────────────────

export type CommunicationTemplate = {
  id: string;
  name: string;
  channel: string;
  event_type: string;
  subject: string;
  body: string;
  is_active: boolean;
  created_at: string;
};

export function useAdminCommunications() {
  return useFetch<CommunicationTemplate[]>("/api/admin/communications");
}

// ─── Escalations ──────────────────────────────────────────────────────────────

export type EscalationTicket = {
  id: string;
  booking_id: string;
  org_id: string;
  status: "open" | "in_progress" | "resolved" | "cancelled";
  priority: "p0_emergency" | "p1_mediation" | "p2_auto_mediation" | "p3_review";
  triggered_by: "partner" | "employee" | "admin" | "auto_timeout" | "auto_volume" | "auto_risk";
  triggered_by_id: string | null;
  reason: string | null;
  target_outcome: string | null;
  assigned_admin: string | null;
  resolution: string | null;
  resolution_action: string | null;
  created_at: string;
  resolved_at: string | null;
  // enriched
  org_name: string;
  customer_name: string | null;
  booking_scheduled_at: string | null;
  services: string[];
  sla_breached: boolean;
};

export type EscalationStats = {
  open: number;
  urgent: number;
  resolved_today: number;
};

export type EscalationsResponse = {
  tickets: EscalationTicket[];
  total: number;
  page: number;
  total_pages: number;
  stats: EscalationStats;
};

export function useAdminEscalations(params: {
  status?: string;
  priority?: string;
  page?: number;
} = {}) {
  const url = `/api/admin/escalations?${new URLSearchParams(
    Object.fromEntries(
      Object.entries({ status: "open", page: "1", ...params }).filter(([, v]) => v !== null && v !== undefined && v !== "")
    ) as Record<string, string>
  ).toString()}`;
  return useFetch<EscalationsResponse>(url, [params.status, params.priority, params.page]);
}
