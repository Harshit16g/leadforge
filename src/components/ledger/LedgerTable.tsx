"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAvatarFallbackUrl } from "@/lib/utils/avatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Search,
  ArrowUpRight,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Calendar,
  RotateCcw,
  Download,
} from "lucide-react";

interface LedgerEntry {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  business_name?: string;
  source?: string;
  status: string;
  score?: number;
  health?: string;
  notes?: string;
  created_at: string;
  archived_at?: string;
  archived_by?: string;
  assigned_to?: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "danger"; icon: React.ReactNode }> = {
  converted: { label: "Converted",  variant: "success", icon: <CheckCircle2 className="size-3" /> },
  lost:      { label: "Lost / Closed", variant: "danger",   icon: <XCircle className="size-3" /> },
};

export function LedgerTable({ initialEntries }: { initialEntries: LedgerEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [restoring, setRestoring] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return entries.filter(e => {
      const matchSearch =
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.email?.toLowerCase().includes(search.toLowerCase()) ||
        e.phone?.toLowerCase().includes(search.toLowerCase()) ||
        e.business_name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [entries, search, statusFilter]);

  // Summary stats
  const convertedCount = entries.filter(e => e.status === "converted").length;
  const lostCount = entries.filter(e => e.status === "lost").length;

  // Restore a lead back to active ops
  async function handleRestore(entryId: string) {
    setRestoring(entryId);
    try {
      const res = await fetch(`/api/partner/ledger/${entryId}/restore`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to restore lead");
      }
      setEntries(prev => prev.filter(e => e.id !== entryId));
      toast.success("Lead restored to active leads.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRestoring(null);
    }
  }

  // Export filtered entries as CSV
  function handleExport() {
    const headers = ["Name", "Email", "Phone", "Business", "Status", "Source", "Score", "Lead Created", "Archived At"];
    const rows = filtered.map(e => [
      e.name,
      e.email || "",
      e.phone || "",
      e.business_name || "",
      e.status,
      e.source || "",
      e.score ?? "",
      new Date(e.created_at).toLocaleDateString("en-IN"),
      e.archived_at ? new Date(e.archived_at).toLocaleDateString("en-IN") : "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Ledger exported as CSV.");
  }

  function parseNotes(notes?: string) {
    if (!notes) return {};
    try { return JSON.parse(notes); } catch { return { notes }; }
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden space-y-5">

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Total Entries</p>
            <p className="text-2xl font-black text-foreground tabular-nums">{entries.length}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="size-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Converted</p>
            <p className="text-2xl font-black text-emerald-600 tabular-nums">{convertedCount}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <XCircle className="size-4 text-rose-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Lost / Closed</p>
            <p className="text-2xl font-black text-rose-500 tabular-nums">{lostCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="shrink-0 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ledger..."
            className="w-full h-9 pl-9 pr-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 bg-card border border-border rounded-xl text-sm font-medium text-foreground shadow-sm outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost / Closed</option>
        </select>
        <button
          onClick={handleExport}
          className="ml-auto h-9 px-4 bg-card border border-border rounded-xl text-sm font-bold text-foreground flex items-center gap-2 hover:bg-muted transition-colors shadow-sm cursor-pointer"
        >
          <Download className="size-4" /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-hidden bg-card border border-border rounded-2xl shadow-sm flex flex-col">
        {/* Table Header */}
        <div className="shrink-0 grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1.2fr_auto] gap-0 border-b border-border bg-muted/40 px-6 py-3">
          {["Lead / Contact", "Business", "Status", "Source", "Score", "Archived", ""].map(h => (
            <span key={h} className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{h}</span>
          ))}
        </div>

        {/* Scrollable Rows */}
        <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-border/60">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 opacity-40">
              <BookOpen className="size-10" />
              <p className="text-sm font-bold uppercase tracking-widest">No ledger entries found</p>
            </div>
          ) : filtered.map(entry => {
            const parsed = parseNotes(entry.notes);
            const statusCfg = STATUS_CONFIG[entry.status] || { label: entry.status, variant: "muted" as any, icon: null };
            return (
              <div
                key={entry.id}
                className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1.2fr_auto] gap-0 px-6 py-4 hover:bg-muted/20 transition-colors items-center group"
              >
                {/* Lead */}
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getAvatarFallbackUrl(entry.id, entry.name)}
                    alt={entry.name}
                    className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-sm"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{entry.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{entry.phone || entry.email || "—"}</p>
                  </div>
                </div>

                {/* Business */}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{entry.business_name || "—"}</p>
                  {parsed.vehicle && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">🚗 {parsed.vehicle}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <StatusBadge
                    status={statusCfg.variant}
                    label={statusCfg.label}
                    size="sm"
                    dot
                  />
                </div>

                {/* Source */}
                <p className="text-xs font-semibold text-muted-foreground capitalize">{entry.source || "—"}</p>

                {/* Score */}
                <div className="flex items-center gap-1.5">
                  <div className="w-full max-w-[48px] h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", (entry.score || 0) >= 70 ? "bg-emerald-500" : (entry.score || 0) >= 40 ? "bg-amber-500" : "bg-rose-500")}
                      style={{ width: `${entry.score || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-foreground tabular-nums">{entry.score ?? "—"}</span>
                </div>

                {/* Archived At */}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="size-3 shrink-0" />
                  <span className="text-[11px] font-semibold">
                    {entry.archived_at
                      ? new Date(entry.archived_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
                      : "—"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleRestore(entry.id)}
                    disabled={restoring === entry.id}
                    title="Restore to active leads"
                    className="h-7 w-7 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={cn("size-3.5", restoring === entry.id && "animate-spin")} />
                  </button>
                  <Link
                    href={`/leads/${entry.id}`}
                    title="View full lead profile"
                    className="h-7 w-7 rounded-lg border border-border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
