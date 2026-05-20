/**
 * useDriveflowApi — DriveFlow CRM
 * Lightweight data-fetching hooks for leads, profiles, messages, interactions, and tasks.
 * Each hook returns { data, loading, error, refetch }.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase-client/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── Generic Supabase hook (client-side, no auth session needed) ──────────────

function useSupabaseQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: any }>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetching = useRef(false);

  const refetch = useCallback(async (silent = false) => {
    if (isFetching.current) return;
    isFetching.current = true;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data: d, error: e } = await queryFn();
      if (e) throw e;
      setData(d);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// ─── Leads ────────────────────────────────────────────────────────────────────

/** All leads, optionally filtered by assignee */
export function useLeads(opts: { assignedTo?: string } = {}) {
  const supabase = createClient();
  return useSupabaseQuery<any[]>(
    async () => {
      let q = supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (opts.assignedTo) q = q.eq("assigned_to", opts.assignedTo);
      return q;
    },
    [opts.assignedTo]
  );
}

/** Single lead by ID */
export function useLead(id: string | null) {
  const supabase = createClient();
  return useSupabaseQuery<any>(
    async () => {
      if (!id) return { data: null, error: null };
      return supabase.from("leads").select("*").eq("id", id).single();
    },
    [id]
  );
}

/** Leads assigned to the currently logged-in user */
export function useMyLeads() {
  const { user } = useAuth();
  return useLeads({ assignedTo: user?.id });
}

/** Lead KPI counts for the current user */
export function useLeadKPIs(assignedTo?: string) {
  const supabase = createClient();
  return useSupabaseQuery<{
    total: number;
    new: number;
    hot: number;
    converted: number;
    conversionRate: number;
  }>(
    async () => {
      let q = supabase.from("leads").select("status, health, score");
      if (assignedTo) q = q.eq("assigned_to", assignedTo);
      const { data, error } = await q;
      if (error || !data) return { data: null, error };
      const total = data.length;
      const newCount = data.filter((l: any) => l.status === "new").length;
      const hot = data.filter((l: any) => l.health === "hot" || l.score >= 70).length;
      const converted = data.filter((l: any) => l.status === "converted").length;
      return {
        data: {
          total,
          new: newCount,
          hot,
          converted,
          conversionRate: total ? Math.round((converted / total) * 100) : 0,
        },
        error: null,
      };
    },
    [assignedTo]
  );
}

// ─── Interactions ─────────────────────────────────────────────────────────────

/** All interactions for a lead, ordered by recency */
export function useInteractions(leadId: string | null) {
  const supabase = createClient();
  return useSupabaseQuery<any[]>(
    async () => {
      if (!leadId) return { data: [], error: null };
      return supabase
        .from("interactions")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
    },
    [leadId]
  );
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

/** Tasks for a specific lead */
export function useLeadTasks(leadId: string | null) {
  const supabase = createClient();
  return useSupabaseQuery<any[]>(
    async () => {
      if (!leadId) return { data: [], error: null };
      return supabase
        .from("tasks")
        .select("*")
        .eq("lead_id", leadId)
        .order("due_at", { ascending: true });
    },
    [leadId]
  );
}

/** All tasks assigned to current user */
export function useMyTasks() {
  const supabase = createClient();
  const { user } = useAuth();
  return useSupabaseQuery<any[]>(
    async () => {
      if (!user?.id) return { data: [], error: null };
      return supabase
        .from("tasks")
        .select("*, leads(name, status, health)")
        .eq("assigned_to", user.id)
        .neq("status", "completed")
        .order("due_at", { ascending: true });
    },
    [user?.id]
  );
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

/** All profiles (for rep selectors, contact lists, etc.) */
export function useProfiles(excludeId?: string) {
  const supabase = createClient();
  return useSupabaseQuery<any[]>(
    async () => {
      let q = supabase.from("profiles").select("*").order("role");
      if (excludeId) q = q.neq("id", excludeId);
      return q;
    },
    [excludeId]
  );
}

/** Current user's profile from DB */
export function useMyProfile() {
  const supabase = createClient();
  const { user } = useAuth();
  return useSupabaseQuery<any>(
    async () => {
      if (!user?.id) return { data: null, error: null };
      return supabase.from("profiles").select("*").eq("id", user.id).single();
    },
    [user?.id]
  );
}

// ─── Internal Messages ────────────────────────────────────────────────────────

/** Threads for the current user */
export function useMessageThreads() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/messages?userId=${user.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setThreads(json.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data: threads, loading, error, refetch };
}

/** Messages within a thread */
export function useThreadMessages(threadId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/messages/${threadId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMessages(json.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data: messages, loading, error, refetch };
}

// ─── Realtime lead updates (for live table / pipeline) ────────────────────────

/**
 * Subscribes to Realtime INSERT/UPDATE events on the leads table and calls
 * `onInsert` / `onUpdate` respectively. Clean-up is handled automatically.
 *
 * Usage:
 *   useLeadsRealtime({ onInsert: (lead) => ..., onUpdate: (lead) => ... })
 */
export function useLeadsRealtime(handlers: {
  onInsert?: (lead: any) => void;
  onUpdate?: (lead: any, old: any) => void;
}) {
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("leads-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload: { new: any }) => handlers.onInsert?.(payload.new)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (payload: { new: any; old: any }) => handlers.onUpdate?.(payload.new, payload.old)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // Handlers change reference on every render — intentionally not in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
