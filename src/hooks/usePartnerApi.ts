/**
 * usePartnerApi — Leaex V2
 * Shared fetch hooks for all partner pages.
 * Each hook returns { data, loading, error, refetch }.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Generic fetch hook ────────────────────────────────────────────────────────

function useFetch<T>(url: string | null, deps: unknown[] = []) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const isFetchingRef = useRef(false);
    const lastFetchRef = useRef<{ url: string | null, time: number }>({ url: null, time: 0 });

    const fetch_ = useCallback(async (silent = false) => {
        if (!url || isFetchingRef.current) { 
            if (!url) setLoading(false);
            return; 
        }

        // Throttle Guard: Ignore requests to the same URL within 300ms
        const now = Date.now();
        if (url === lastFetchRef.current.url && (now - lastFetchRef.current.time) < 300) {
            return;
        }

        isFetchingRef.current = true;
        if (!silent && !data) setLoading(true);
        setError(null);

        try {
            const res = await fetch(url);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Fetch failed");

            const shouldUnwrap = json.data !== undefined && !json.grouped;
            setData(shouldUnwrap ? json.data : json);
            lastFetchRef.current = { url, time: Date.now() };
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [url, ...deps]);

    useEffect(() => { fetch_(); }, [fetch_]);

    return { data, loading, error, refetch: fetch_ };
}

// ─── Paginated fetch ──────────────────────────────────────────────────────────

interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

function usePaginatedFetch<T>(
    baseUrl: string,
    params: Record<string, string | number | boolean | null | undefined> = {},
    deps: unknown[] = []
) {
    const [result, setResult] = useState<PaginatedResult<T>>({ data: [], total: 0, page: 1, limit: 20 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /** Keeps latest row count off the fetch callback deps — avoids refetch loops when length changes after each response. */
    const dataLengthRef = useRef(0);
    useEffect(() => {
        dataLengthRef.current = result.data.length;
    }, [result.data.length]);

    const buildUrl = useCallback(() => {
        const u = new URL(baseUrl, "http://localhost");
        Object.entries(params).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== "") u.searchParams.set(k, String(v));
        });
        return u.pathname + u.search;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseUrl, JSON.stringify(params), ...deps]);

    const isFetchingRef = useRef(false);
    const lastFetchRef = useRef<{ url: string | null, time: number }>({ url: null, time: 0 });

    const fetch_ = useCallback(async (silent = false) => {
        const url = buildUrl();
        if (isFetchingRef.current) return;

        // Throttle Guard: Ignore requests to the same URL within 300ms
        const now = Date.now();
        if (url === lastFetchRef.current.url && (now - lastFetchRef.current.time) < 300) {
            return;
        }

        isFetchingRef.current = true;
        if (!silent && dataLengthRef.current === 0) setLoading(true);
        setError(null);
        try {
            const res = await fetch(url);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Fetch failed");
            setResult({
                data: json.data ?? [],
                total: json.total ?? 0,
                page: json.page ?? 1,
                limit: json.limit ?? 20,
            });
            lastFetchRef.current = { url, time: Date.now() };
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [buildUrl]);


    useEffect(() => { fetch_(); }, [fetch_]);

    return { ...result, loading, error, refetch: fetch_ };
}

// ─── Domain hooks ─────────────────────────────────────────────────────────────

import type { DashboardKPIs } from "@/models/crm/dashboard-kpis.model";
import type { CustomerRow } from "@/models/crm/customer.model";
import type { BookingRow, BookingWithNames } from "@/models/crm/booking.model";
import type { ContactRequestRow } from "@/models/crm/contact-request.model";
import type { ReviewRow, ReviewWithCustomer } from "@/models/crm/review.model";
import type { StaffMemberRow, StaffMemberWithStats } from "@/models/ops/staff-member.model";
import type { ExpenseRow } from "@/models/ops/expense.model";
import type { DayClosingRow } from "@/models/ops/day-closing.model";
import type { ServiceRow } from "@/models/ops/service-catalogue.model";
import type { AutomationRuleRow } from "@/models/comms/automation-rule.model";
import type { TemplateRow } from "@/models/comms/template.model";
import type { ProductRow } from "@/models/inventory/product.model";
import type { OrganizationRow } from "@/models/orgs/organization.model";
import type { BranchRow, BranchWithStats } from "@/models/orgs/branch.model";

/** Dashboard KPIs */
export function useDashboard(params: { view?: string; analyze?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.view) qs.set("view", params.view);
    if (params.analyze) qs.set("analyze", params.analyze);
    const query = qs.toString();
    return useFetch<DashboardKPIs>(
        `/api/partner/dashboard${query ? "?" + query : ""}`,
        [query]
    );
}

/** Bookings list with optional filters */
export function useBookings(
    params: { page?: number; limit?: number; status?: string; source?: string; from?: string; to?: string } = {}
) {
    return usePaginatedFetch<BookingWithNames>("/api/partner/bookings", params, [JSON.stringify(params)]);
}

/** Single booking with customer, staff, annotations, and auth requests */
export function useBooking(id: string | null) {
    return useFetch<any>(id ? `/api/partner/bookings/${id}` : "", [id]);
}

/** Customers list */
export function useCustomers(
    params: { page?: number; limit?: number; search?: string; tag?: string; wa_consent?: string } = {}
) {
    return usePaginatedFetch<CustomerRow>("/api/partner/customers", params, [JSON.stringify(params)]);
}

/** Waitlist entries */
export function useWaitlist(params: { page?: number } = {}) {
    return usePaginatedFetch<any>("/api/partner/waitlist", params, [JSON.stringify(params)]);
}

/** Customer detail + booking history */
export function useCustomerDetail(id: string | null) {
    return useFetch<CustomerRow & { bookings: BookingWithNames[] }>(
        id ? `/api/partner/customers/${id}` : "",
        [id]
    );
}

/** Employees with performance data */
export function useEmployees(params: { active_only?: boolean; month?: string } = {}) {
    const url = new URLSearchParams();
    if (params.active_only !== undefined) url.set("active_only", String(params.active_only));
    if (params.month) url.set("month", params.month);
    const qs = url.toString();
    return useFetch<StaffMemberWithStats[]>(
        `/api/partner/employees${qs ? "?" + qs : ""}`
    );
}

/** Expenses */
export function useExpenses(
    params: { page?: number; date?: string; month?: string; is_recurring?: boolean; category?: string } = {}
) {
    return usePaginatedFetch<ExpenseRow>("/api/partner/expenses", params, [JSON.stringify(params)]);
}

/** Products / inventory */
export function useInventory(
    params: { page?: number; category?: string; low_stock?: boolean; search?: string } = {}
) {
    return usePaginatedFetch<ProductRow>("/api/partner/inventory", params, [JSON.stringify(params)]);
}

/** Purchase history (Procurement) */
export function usePurchases(params: { page?: number } = {}) {
    return usePaginatedFetch("/api/partner/inventory/purchases", params, [JSON.stringify(params)]);
}

/** Consumption history (Usage) */
export function useUsage(params: { page?: number } = {}) {
    return usePaginatedFetch("/api/partner/inventory/usage", params, [JSON.stringify(params)]);
}

/** Retail Sales history */
export function useSales(params: { page?: number } = {}) {
    return usePaginatedFetch("/api/partner/inventory/sales", params, [JSON.stringify(params)]);
}

/** Suppliers */
export function useSuppliers() {
    return useFetch<any[]>("/api/partner/inventory/suppliers");
}

/** Service Deductions */
export function useServiceDeductions(serviceId?: string) {
    return useFetch(serviceId ? `/api/partner/services/${serviceId}/deductions` : null, [serviceId]);
}

/** Revenue aggregations */
export function useRevenue(params: { month?: string; period?: string; from?: string; to?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.month) qs.set("month", params.month);
    if (params.period) qs.set("period", params.period);
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    const query = qs.toString();

    return useFetch<{
        current_month: string;
        date_from?: string;
        date_to?: string;
        revenue: number;
        prev_revenue: number;
        revenue_growth: number;
        total_expenses: number;
        net_profit: number;
        margin_pct?: number;
        bookings_count: number;
        avg_bill: number;
        payment_breakdown: Record<string, number>;
        service_breakdown: { name: string; revenue: number }[];
        monthly_trend: { month: string; revenue: number }[];
        daily_revenue: { date: string; revenue: number }[];
        expense_by_category: Record<string, number>;
    }>(`/api/partner/revenue${query ? "?" + query : ""}`, [query]);
}

/** Day closing summary */
export function useDayClosing(date?: string) {
    const d = date ?? new Date().toISOString().split("T")[0];
    return useFetch<{
        date: string;
        is_locked: boolean;
        closing: DayClosingRow | null;
        bookings: BookingWithNames[];
        completed_count: number;
        revenue: number;
        total_expenses: number;
        net_profit: number;
        cash_in_hand: number;
        payment_breakdown: Record<string, number>;
        expenses: ExpenseRow[];
    }>(`/api/partner/day-closing?date=${d}`, [d]);
}

/** Payments analytics */
export function usePayments(month?: string) {
    const m = month ?? new Date().toISOString().slice(0, 7);
    return useFetch<{
        month: string;
        total_revenue: number;
        completed_count: number;
        avg_transaction: number;
        method_breakdown: Record<string, number>;
        weekly_data: { week: string; revenue: number; count: number }[];
        recent_payments: BookingWithNames[];
    }>(`/api/partner/payments?month=${m}`, [m]);
}

/** Automation rules */
export function useAutomation() {
    return useFetch<AutomationRuleRow[]>("/api/partner/automation");
}

/** Automation templates */
export function useTemplates() {
    return useFetch<TemplateRow[]>("/api/partner/automation/templates");
}

/** Automation statistics and recent activity */
export function useAutomationStats() {
    return useFetch<{
        stats: { sent: number; delivered: number; failed: number; queued: number };
        recent: any[];
    }>("/api/partner/automation/stats");
}

/** Contact requests */
export function useContactRequests(
    params: { page?: number; status?: string } = {}
) {
    return usePaginatedFetch<ContactRequestRow>("/api/partner/contact-requests", params, [JSON.stringify(params)]);
}

/** Partner settings/profile */
export function usePartnerSettings() {
    return useFetch<OrganizationRow & { 
        branches: BranchRow[];
        owner_name: string | null;
        owner_email: string | null;
        owner_phone: string | null;
        is_owner: boolean;
    }>("/api/partner/settings");
}

/** Branches */
export function useBranches() {
    return useFetch<BranchWithStats[]>("/api/partner/branches");
}

/** Service catalogue */
export function useServices(params: { category?: string; active_only?: boolean } = {}) {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.active_only !== undefined) qs.set("active_only", String(params.active_only));
    return useFetch<{
        data: ServiceRow[];
        grouped: Record<string, ServiceRow[]>;
        total: number;
    }>(`/api/partner/services${qs.toString() ? "?" + qs.toString() : ""}`);
}

/** Reviews */
export function useReviews(params: { page?: number; min_rating?: number } = {}) {
    return usePaginatedFetch<ReviewWithCustomer>(
        "/api/partner/reviews",
        params,
        [JSON.stringify(params)]
    );
}

/** Staff member (used when single row needed) */
export type { StaffMemberRow };


/** Supplier Requests (Purchase Orders) */
export function useRequests(params: { page?: number; status?: string } = {}) {
    return usePaginatedFetch<any>("/api/partner/inventory/supplier-requests", params, [JSON.stringify(params)]);
}
