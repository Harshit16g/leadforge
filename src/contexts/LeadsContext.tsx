"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-client/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LeadsContextType {
  leads: any[];
  loading: boolean;
  lastFetched: number;
  hydrateLeads: (initialLeads: any[]) => void;
  fetchLeads: (force?: boolean) => Promise<any[]>;
  updateLeadInCache: (leadId: string, updates: any) => void;
  addLeadToCache: (lead: any) => void;
  removeLeadsFromCache: (leadIds: string[]) => void;
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<number>(0);
  
  const supabase = createClient();

  // Dynamic fetch leads from Supabase (cleans out archived leads)
  const fetchLeads = useCallback(async (force = false) => {
    // Avoid redundant queries if loaded within 15 seconds (caching strategy)
    if (!force && lastFetched > 0 && Date.now() - lastFetched < 15000) {
      return leads;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const loadedLeads = data || [];
      setLeads(loadedLeads);
      setLastFetched(Date.now());
      return loadedLeads;
    } catch (e: any) {
      console.error("LeadsContext Fetch Error:", e);
      toast.error("Failed to sync leads with database.");
      return leads;
    } finally {
      setLoading(false);
    }
  }, [lastFetched, leads, supabase]);

  // Server-side hydration for fast initial layout loads
  const hydrateLeads = useCallback((initialLeads: any[]) => {
    if (lastFetched === 0 && initialLeads && initialLeads.length > 0) {
      setLeads(initialLeads);
      setLastFetched(Date.now());
    }
  }, [lastFetched]);

  // Optimistic Cache Modifiers (instant UI feedback)
  const updateLeadInCache = useCallback((leadId: string, updates: any) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        // If it got archived, remove it from active list
        if (updates.archived === true) return null;
        return { ...lead, ...updates, updated_at: new Date().toISOString() };
      }
      return lead;
    }).filter(Boolean));
  }, []);

  const addLeadToCache = useCallback((lead: any) => {
    setLeads(prev => {
      if (prev.some(l => l.id === lead.id)) return prev; // Deduplicate
      return [lead, ...prev];
    });
  }, []);

  const removeLeadsFromCache = useCallback((leadIds: string[]) => {
    setLeads(prev => prev.filter(l => !leadIds.includes(l.id)));
  }, []);

  // ─── Realtime Database Sync ────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    // Listen for database changes on the 'leads' table in real-time
    const leadsChannel = supabase
      .channel("realtime-leads-cache")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, and DELETE
          schema: "public",
          table: "leads"
        },
        (payload: any) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === "INSERT") {
            // Only add if it's active
            if (newRecord && !newRecord.archived) {
              addLeadToCache(newRecord);
            }
          } 
          else if (eventType === "UPDATE") {
            if (newRecord) {
              if (newRecord.archived) {
                // If lead got archived by another rep, remove it
                removeLeadsFromCache([newRecord.id]);
              } else {
                // Update properties in cache
                updateLeadInCache(newRecord.id, newRecord);
              }
            }
          } 
          else if (eventType === "DELETE") {
            if (oldRecord) {
              removeLeadsFromCache([oldRecord.id]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
    };
  }, [user?.id, addLeadToCache, updateLeadInCache, removeLeadsFromCache, supabase]);

  return (
    <LeadsContext.Provider
      value={{
        leads,
        loading,
        lastFetched,
        hydrateLeads,
        fetchLeads,
        updateLeadInCache,
        addLeadToCache,
        removeLeadsFromCache
      }}
    >
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeads() {
  const context = useContext(LeadsContext);
  if (context === undefined) {
    throw new Error("useLeads must be used within a LeadsProvider");
  }
  return context;
}
