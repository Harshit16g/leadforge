"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase-client/client";
import QRCode from "qrcode";
import {
  SectionHeader,
  StatusBadge,
  EmptyState,
  LoadingSpinner,
} from "@/components/common";
import { type StatusVariant } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";

type ScanSession = {
  id: string;
  session_code: string;
  status: "waiting" | "connected" | "completed" | "expired";
  scanned_items: ScannedItem[];
  expires_at: string;
  created_at: string;
  last_active_at: string | null;
  connected_employee_id: string | null;
  connected_employee_name: string | null;
  manual_employee_name: string | null;
  booking_id: string | null;
  walkin_id: string | null;
  creator?: { name: string };
};

type ScannedItem = {
  product_id: string;
  barcode: string;
  name: string;
  brand: string | null;
  category: string | null;
  selling_price: number;
  current_stock: number;
  scanned_at: string;
  is_new: boolean;
};

const STATUS_MAP: Record<string, { label: string; badge: StatusVariant; icon: string }> = {
  waiting: {
    label: "WAITING",
    badge: "info",
    icon: "icon-[solar--smartphone-linear]",
  },
  connected: {
    label: "LIVE",
    badge: "success",
    icon: "icon-[solar--link-round-bold]",
  },
  completed: {
    label: "COMPLETE",
    badge: "muted",
    icon: "icon-[solar--check-circle-bold]",
  },
  expired: {
    label: "EXPIRED",
    badge: "danger",
    icon: "icon-[solar--alarm-bold]",
  },
};

export function ScanCenterTab() {
  const [activeSession, setActiveSession] = useState<ScanSession | null>(null);
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const pageSize = 10;

  const supabase = createClient();
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const fetchSessions = useCallback(async (p = page) => {
    setLoading(true);
    try {
      // We need an API that supports pagination. For now I'll just use the existing one and mock it or update it.
      const res = await fetch(`/api/partner/inventory/scan-sessions?page=${p}&limit=${pageSize}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setSessions(json.data);
        setTotalCount(json.total || json.data.length); // Fallback if API doesn't return total yet
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [page]);

  const createSession = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/partner/inventory/scan-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manual_employee_name: manualName || null }),
      });
      const json = await res.json();
      if (res.ok) {
        setActiveSession(json.data);
        fetchSessions(1);
        setPage(1);
        setIsCreateOpen(false);
        setManualName("");
      }
    } catch {
      /* silent */
    } finally {
      setCreating(false);
    }
  };

  const changeStatus = async (code: string, newStatus: "completed" | "expired") => {
    try {
      await fetch(`/api/partner/inventory/scan-sessions/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchSessions();
      if (activeSession?.session_code === code) {
        setActiveSession(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch {
      /* silent */
    }
  };

  // Generate QR when active session changes
  useEffect(() => {
    if (activeSession && (activeSession.status === "waiting" || activeSession.status === "connected")) {
      const scanUrl = `${window.location.origin}/scan/${activeSession.session_code}`;
      QRCode.toDataURL(scanUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      }).then(setQrDataUrl);
    } else {
      setQrDataUrl("");
    }
  }, [activeSession]);

  // Realtime subscription
  useEffect(() => {
    if (!activeSession) return;
    const channel = supabase
      .channel(`scan-sub-${activeSession.session_code}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "inventory",
        table: "scan_sessions",
        filter: `session_code=eq.${activeSession.session_code}`,
      }, (payload: { new: ScanSession }) => {
        setActiveSession(payload.new);
        setSessions(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeSession?.session_code, supabase]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* ── Left: Session List (4 cols) ── */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col min-h-[600px]">
          <div className="px-6 py-5 border-b border-border bg-muted/30 flex justify-between items-center">
            <div>
              <SectionHeader title="Live Sessions" className="mb-0" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                Manage mobile scanning activities
              </p>
            </div>
            <Button size="sm" className="h-9 rounded-xl font-bold px-4" onClick={() => setIsCreateOpen(true)}>
              <span className="icon-[solar--add-circle-bold] size-4 mr-2" /> New
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading && sessions.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)
            ) : sessions.length === 0 ? (
              <div className="py-20"><EmptyState title="No sessions found" icon="solar--smartphone-linear" /></div>
            ) : (
              sessions.map((s) => {
                const isActive = s.status === 'waiting' || s.status === 'connected';
                const isSelected = activeSession?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSession(s)}
                    className={cn(
                      "w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between gap-4 group",
                      isSelected ? "bg-primary/5 border-primary shadow-sm" : "bg-card border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "size-10 rounded-xl flex items-center justify-center",
                        isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                      )}>
                        <span className={cn(STATUS_MAP[s.status]?.icon, "size-5")} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold truncate max-w-[150px]">
                          {s.connected_employee_name || s.manual_employee_name || "Waiting for device..."}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusBadge status={STATUS_MAP[s.status]?.badge} label={STATUS_MAP[s.status]?.label} size="sm" className="h-4 px-1.5 text-[8px]" />
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">{relativeTime(s.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-foreground tabular-nums">{(s.scanned_items || []).length}</p>
                       <p className="text-[8px] font-black text-muted-foreground uppercase">Items</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {totalCount > pageSize && (
            <div className="p-4 border-t border-border bg-muted/10 flex justify-center gap-2">
               <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-lg"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <span className="icon-[solar--alt-arrow-left-linear] size-4" />
              </Button>
              <span className="flex items-center px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Page {page}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-lg"
                disabled={page * pageSize >= totalCount}
                onClick={() => setPage(p => p + 1)}
              >
                <span className="icon-[solar--alt-arrow-right-linear] size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Session Details (7 cols) ── */}
      <div className="lg:col-span-7 space-y-6">
        {!activeSession ? (
          <div className="bg-card rounded-2xl border border-border border-dashed p-20 text-center flex flex-col items-center justify-center min-h-[600px]">
             <div className="size-16 rounded-3xl bg-muted flex items-center justify-center mb-6">
                <span className="icon-[solar--scanner-linear] size-8 text-muted-foreground" />
             </div>
             <h3 className="text-lg font-black uppercase tracking-widest text-muted-foreground">Select a Session</h3>
             <p className="text-sm text-muted-foreground mt-2">Choose a live or past session from the list to view details.</p>
          </div>
        ) : (
          <>
            {/* Header / Actions */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="icon-[solar--hashtag-bold-duotone] size-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base uppercase tracking-widest">{activeSession.session_code.split('_')[1].toUpperCase()}</h3>
                    <p className="text-xs text-muted-foreground font-bold">Created {new Date(activeSession.created_at).toLocaleString()}</p>
                  </div>
               </div>
               {(activeSession.status === 'waiting' || activeSession.status === 'connected') && (
                 <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl font-bold h-9 px-4 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5"
                      onClick={() => changeStatus(activeSession.session_code, 'completed')}
                    >
                       <span className="icon-[solar--check-circle-linear] size-4 mr-2" /> End Session
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl font-bold h-9 px-4 border-destructive/20 text-destructive hover:bg-destructive/5"
                      onClick={() => changeStatus(activeSession.session_code, 'expired')}
                    >
                       <span className="icon-[solar--close-circle-linear] size-4 mr-2" /> Kill
                    </Button>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
               {/* QR Section */}
               {(activeSession.status === 'waiting' || activeSession.status === 'connected') && (
                 <div className="md:col-span-5 bg-card rounded-2xl border border-border p-6 flex flex-col items-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Mobile Connection</p>
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-border relative">
                       {qrDataUrl ? (
                         <img src={qrDataUrl} alt="QR" className="w-full aspect-square" />
                       ) : <LoadingSpinner className="size-10" />}
                       {activeSession.status === 'connected' && (
                         <div className="absolute inset-0 bg-black/70 rounded-xl flex flex-col items-center justify-center text-center p-4">
                            <span className="icon-[solar--link-round-bold] size-10 text-emerald-400 animate-pulse" />
                            <p className="text-white font-black text-sm mt-3 uppercase tracking-widest">Connected</p>
                            <p className="text-emerald-400 text-[10px] font-bold mt-1 uppercase tracking-wider">{activeSession.connected_employee_name}</p>
                         </div>
                       )}
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-6 font-bold uppercase leading-relaxed max-w-[200px]">
                       Point phone camera to this code to link device.
                    </p>
                 </div>
               )}

               {/* Items Section */}
               <div className={cn("bg-card rounded-2xl border border-border flex flex-col overflow-hidden", (activeSession.status === 'waiting' || activeSession.status === 'connected') ? "md:col-span-7" : "md:col-span-12")}>
                  <div className="px-5 py-4 border-b border-border bg-muted/20 flex justify-between items-center">
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scanned Items</span>
                     <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">{(activeSession.scanned_items || []).length} TOTAL</span>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[400px] p-4 space-y-2 no-scrollbar">
                     {(activeSession.scanned_items || []).length === 0 ? (
                       <div className="py-20 opacity-30"><EmptyState title="Waiting for scans..." icon="solar--scanner-linear" /></div>
                     ) : (activeSession.scanned_items || []).map((item, idx) => (
                       <div key={idx} className="p-3 rounded-xl border border-border bg-background flex items-center justify-between gap-3 animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                          <div className="min-w-0 flex-1">
                             <p className="text-xs font-bold truncate">{item.name}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase">{item.brand || 'No Brand'}</span>
                                <span className="text-[9px] font-mono text-muted-foreground/60">{item.barcode}</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-black text-primary tabular-nums">₹{item.selling_price}</p>
                          </div>
                       </div>
                     ))}
                  </div>
                  {activeSession.booking_id && (
                    <div className="p-4 bg-primary/5 border-t border-border flex items-center gap-2">
                       <span className="icon-[solar--link-linear] size-4 text-primary" />
                       <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Linked to Booking #{activeSession.booking_id.slice(-6).toUpperCase()}</span>
                    </div>
                  )}
               </div>
            </div>
          </>
        )}
      </div>
      <CreateSessionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={createSession}
        creating={creating}
        name={manualName}
        setName={setManualName}
      />
    </div>
  );
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

function CreateSessionDialog({
  open,
  onOpenChange,
  onCreate,
  creating,
  name,
  setName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: () => void;
  creating: boolean;
  name: string;
  setName: (v: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Start New Scan Session</DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Generate a QR code for mobile scanner link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Manual Employee Name (Optional)
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe (Walk-in Scan)"
              className="h-11 rounded-xl bg-muted/30 font-medium"
            />
            <p className="text-[9px] text-muted-foreground ml-1">
              Leave blank if the employee will select their own name on mobile.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button 
            onClick={onCreate} 
            disabled={creating} 
            className="rounded-xl font-black uppercase tracking-widest text-[10px] px-8 shadow-lg shadow-primary/20"
          >
            {creating ? <LoadingSpinner className="size-4" /> : "Create Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
