"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useContactRequests } from "@/hooks/usePartnerApi";
import { getAvatarFallbackUrl } from "@/lib/utils/avatar";
import { 
  PageHeader, 
  StatusBadge, 
  SectionHeader, 
  EmptyState,
  ManagedAvatar
} from "@/components/common";
import { type StatusVariant } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";

/**
 * [AUDIT] Partner Contact Requests (Inbox)
 */

const channelConfig: Record<string, { label: string; variant: StatusVariant }> = {
  whatsapp: { label: "WHATSAPP",  variant: "success" },
  website:  { label: "WEBSITE",   variant: "danger"  },
  phone:    { label: "PHONE",     variant: "warning" },
  in_app:   { label: "IN-APP",    variant: "info"    },
};

const statusMap: Record<string, StatusVariant> = {
  unread:      "danger",
  in_progress: "warning",
  resolved:    "success",
};

export default function PartnerContactRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data: requests, total, loading, refetch } = useContactRequests({ status: statusFilter });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = requests.find(r => r.id === selectedId) ?? requests[0] ?? null;

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/partner/contact-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await refetch();
  }

  const filters = [
    { label: "All Inbox",    value: undefined },
    { label: "Unread",       value: "unread" },
    { label: "In Progress",  value: "in_progress" },
    { label: "Resolved",     value: "resolved" },
  ];

  return (
    <div className="flex-1 h-full max-h-full overflow-hidden flex flex-col space-y-6 w-full max-w-[1440px] mx-auto pr-1">
      {/* ── Header ── */}
      <div className="shrink-0">
        <PageHeader 
          title="Communication Hub"
          subtitle="Consolidated stream of client inquiries via WhatsApp, web and app channels"
          actions={
            <Button variant="outline" size="sm" className="h-9 font-bold rounded-xl bg-card">
              <span className="icon-[solar--download-minimalistic-linear] size-4 mr-2" /> Export
            </Button>
          }
        />
      </div>

      {/* ── Filters ── */}
      <div className="shrink-0 flex items-center gap-1.5 bg-muted/30 p-1.5 rounded-2xl w-fit border border-border">
        {filters.map((f) => (
          <button
            key={String(f.value)}
            onClick={() => { setStatusFilter(f.value); setSelectedId(null); }}
            className={cn(
              "px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer",
              statusFilter === f.value
                ? "bg-card text-foreground shadow-md shadow-black/5"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Main Layout ── */}
      {loading && !requests.length ? (
         <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50">
            <span className="icon-[solar--refresh-circle-bold-duotone] animate-spin text-primary size-10" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Streaming Messages</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start flex-1 min-h-0 overflow-hidden">
          
          {/* List Section */}
          <div className="lg:col-span-2 bg-card rounded-3xl border border-border overflow-hidden shadow-sm flex flex-col h-full max-h-full">
            <div className="px-6 py-5 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
              <SectionHeader title="Message Feed" subtitle={`${total} total entries`} />
              <Button variant="ghost" size="icon-sm" onClick={() => refetch()} className="h-8 w-8 rounded-lg border border-border/50 cursor-pointer">
                 <span className={cn("icon-[solar--refresh-linear] size-3.5", loading && "animate-spin")} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-border/50">
              {requests.length === 0 ? (
                <div className="py-20"><EmptyState title="Inbox empty" icon="solar--chat-square-linear" /></div>
              ) : requests.map((r) => {
                const isSelected = selected?.id === r.id;
                const isUnread = r.status === 'unread';
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={cn(
                      "px-6 py-5 cursor-pointer transition-all relative group",
                      isSelected ? "bg-primary/[0.03]" : "hover:bg-muted/30"
                    )}
                  >
                    {isSelected && <div className="absolute left-0 top-0 w-1 h-full bg-primary" />}
                    <div className="flex items-start gap-4">
                      <ManagedAvatar 
                        userId={r.id} 
                        name={r.contact_name || "Guest"} 
                        fallbackUrl={getAvatarFallbackUrl(r.id, undefined)}
                        className="w-10 h-10 rounded-xl shrink-0 shadow-inner group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={cn("text-sm font-black truncate uppercase tracking-widest", isUnread ? "text-foreground" : "text-muted-foreground")}>
                            {r.contact_name || "Guest User"}
                          </p>
                          <span className="text-[9px] font-black text-muted-foreground uppercase whitespace-nowrap pt-1">
                            {new Date(r.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{r.message}</p>
                        <div className="flex items-center gap-2">
                           <StatusBadge status={channelConfig[r.source]?.variant || 'muted'} label={r.source.toUpperCase()} size="sm" className="h-5" />
                           {isUnread && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail Section */}
          <div className="lg:col-span-3 h-full max-h-full overflow-y-auto pr-1 scrollbar-thin">
             <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
                {!selected ? (
                   <div className="py-32 flex items-center justify-center"><EmptyState title="Select a message" icon="solar--chat-round-line-linear" /></div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                     <div className="p-8 border-b border-border bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                           <ManagedAvatar 
                             userId={selected.id} 
                             name={selected.contact_name || "Guest"} 
                             fallbackUrl={getAvatarFallbackUrl(selected.id, undefined)}
                             className="w-14 h-14 rounded-2xl shadow-lg shadow-primary/20"
                           />
                           <div>
                              <h3 className="text-lg font-black text-foreground uppercase tracking-widest">{selected.contact_name || "Guest User"}</h3>
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">{selected.phone || "No contact digits"}</p>
                           </div>
                        </div>
                        <StatusBadge status={statusMap[selected.status] || 'muted'} label={selected.status.replace('_', ' ').toUpperCase()} dot />
                     </div>

                     <div className="p-8 space-y-8">
                        <div className="space-y-4">
                           <SectionHeader title="Customer Transmission" subtitle={`Channel: ${selected.source.toUpperCase()}`} />
                           <div className="bg-muted/50 rounded-2xl p-6 border border-border relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-5"><span className="icon-[solar--chat-round-line-bold-duotone] size-16" /></div>
                              <p className="text-sm font-medium text-foreground italic leading-relaxed relative z-10">&ldquo;{selected.message}&rdquo;</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <SectionHeader title="Operational Response" subtitle="Draft your professional reply below" />
                           <textarea
                              rows={4}
                              placeholder="Synchronizing professional tone…"
                              className="w-full rounded-2xl bg-background border border-border p-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all animate-in fade-in"
                           />
                        </div>
                     </div>

                     <div className="p-8 pt-0 flex gap-4">
                        <Button className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 cursor-pointer">
                           <span className="icon-[solar--plain-2-bold-duotone] size-4 mr-2" /> Dispatch Reply
                        </Button>
                        {selected.status !== "resolved" && (
                           <Button 
                              variant="outline" 
                              onClick={() => updateStatus(selected.id, "resolved")}
                              className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] border-border hover:bg-muted cursor-pointer"
                           >
                              <span className="icon-[solar--check-read-linear] size-4 mr-2" /> Mark as Handled
                           </Button>
                        )}
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
