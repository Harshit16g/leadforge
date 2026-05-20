"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAutomation, useAutomationStats } from "@/hooks/usePartnerApi";
import { 
  PageHeader, 
  KpiCard, 
  StatusBadge, 
  EmptyState 
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AutomationForm } from "@/components/automation/AutomationForm";
import { AutomationActivity } from "@/components/automation/AutomationActivity";
import { toast } from "sonner";

export default function PartnerAutomationPage() {
  const { data: rules, loading, refetch } = useAutomation();
  const { data: statsResponse, loading: loadingStats, refetch: refetchStats } = useAutomationStats();
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const list = rules ?? [];
  const activeRules = list.filter(r => r.is_active);
  const stats = (statsResponse as any)?.data || { sent: 0, delivered: 0, failed: 0, queued: 0 };
  const recentLogs = stats.logs || [];

  const handleToggle = useCallback(async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/partner/automation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle rule");
      toast.success(currentActive ? "Rule paused" : "Rule resumed");
      await refetch();
    } catch (err) {
      toast.error("Failed to update rule status");
    }
  }, [refetch]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    try {
      const res = await fetch(`/api/partner/automation/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete rule");
      toast.success("Rule deleted");
      await refetch();
    } catch (err) {
      toast.error("Failed to delete rule");
    }
  }, [refetch]);

  const openCreate = () => {
    setEditingRule(null);
    setIsSheetOpen(true);
  };

  const openEdit = (rule: any) => {
    setEditingRule(rule);
    setIsSheetOpen(true);
  };

  return (
    <div className="flex-1 h-full max-h-full overflow-hidden flex flex-col space-y-6 w-full max-w-[1440px] mx-auto pr-1">
      <div className="shrink-0 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Flow Automation</h1>
          <p className="text-sm text-muted-foreground">Configure event-driven triggers to engage customers across lifecycle stages</p>
        </div>
        <Button 
          onClick={openCreate}
          size="sm" 
          className="font-bold rounded-xl shadow-lg shadow-primary/20 cursor-pointer active:scale-95 transition-transform shrink-0"
        >
           <span className="icon-[solar--bolt-bold-duotone] size-4 mr-2" /> Create Logic
        </Button>
      </div>

      {/* ── KPI Grid (Shrink-0) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        <KpiCard title="Active Flows" value={activeRules.length} icon="solar--play-circle-bold-duotone" iconColor="text-primary" />
        <KpiCard 
           title="Messages Sent" 
           value={stats.sent} 
           icon="solar--plain-2-bold-duotone" 
           iconColor="text-status-success-text" 
        />
        <KpiCard 
           title="Queued" 
           value={stats.queued} 
           icon="solar--clock-circle-bold-duotone" 
           iconColor="text-status-warning-text"
           footnote="Pending delivery"
        />
        <KpiCard title="Failed" value={stats.failed} icon="solar--danger-circle-bold-duotone" iconColor="text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Automation Rules (2 cols) */}
        <div className="lg:col-span-2 space-y-4 h-full max-h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-1 shrink-0">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="icon-[solar--list-check-bold-duotone] size-5 text-primary" />
              Automation Rules
            </h3>
            <Button variant="ghost" size="xs" onClick={() => refetch()} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              <span className="icon-[solar--refresh-linear] size-3 mr-1.5" /> Sync Rules
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin space-y-4">
            {loading ? (
              <div className="flex items-center gap-3 p-8 rounded-3xl bg-muted/20 border border-border/50 text-sm text-muted-foreground animate-pulse font-medium justify-center">
                <span className="icon-[solar--refresh-circle-bold-duotone] animate-spin text-primary size-6" /> 
                <span>Syncing Automation state…</span>
              </div>
            ) : list.length === 0 ? (
              <div className="py-12 bg-card rounded-[2.5rem] border border-border border-dashed shadow-inner">
                 <EmptyState 
                    icon="solar--bolt-bold-duotone"
                    title="No automation rules"
                    description="Automate your manual outreach by creating your first event-driven rule."
                    action={{ label: "Create First Rule", onClick: openCreate }}
                 />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 pb-4">
                {list.map((rule) => (
                  <div key={rule.id} className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    <div className={cn("absolute left-0 top-0 w-1 h-full transition-colors", rule.is_active ? "bg-primary" : "bg-muted")} />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-border/10",
                             rule.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                             <span className={cn(rule.is_active ? "icon-[solar--bolt-bold-duotone]" : "icon-[solar--bolt-linear]", "size-6")} />
                          </div>
                          <div>
                             <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">{rule.rule_name}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                                <StatusBadge status={rule.is_active ? 'success' : 'muted'} label={rule.is_active ? 'Active' : 'Paused'} size="sm" dot />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">• {rule.total_fired} fired</span>
                             </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Event Trigger</span>
                            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5 capitalize">
                              <span className="icon-[solar--bolt-bold-duotone] size-3.5 text-primary/60" /> 
                              {rule.trigger_event.replace('.', ' ')}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Dispatch via</span>
                            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5 uppercase">
                              <span className="icon-[solar--plain-2-linear] size-3.5 text-primary/60" /> 
                              {rule.channel}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Latency</span>
                            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                              <span className="icon-[solar--clock-circle-linear] size-3.5 text-primary/60" /> 
                              {rule.trigger_offset_minutes} min delay
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button onClick={() => openEdit(rule)} variant="outline" size="sm" className="h-10 px-4 font-bold rounded-xl border-border hover:bg-muted cursor-pointer active:scale-95 transition-transform">
                          <span className="icon-[solar--pen-linear] size-4 mr-2" /> Edit
                        </Button>
                        <Button onClick={() => handleToggle(rule.id, rule.is_active)} variant={rule.is_active ? "outline" : "default"} size="sm" className={cn("h-10 px-6 font-bold rounded-xl shadow-sm cursor-pointer active:scale-95 transition-transform", rule.is_active ? "text-primary border-primary/20 hover:bg-primary/10" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
                          {rule.is_active ? "Pause" : "Resume"}
                        </Button>
                        <Button onClick={() => handleDelete(rule.id)} variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl text-destructive hover:bg-destructive/10 cursor-pointer active:scale-95 transition-transform">
                          <span className="icon-[solar--trash-bin-trash-linear] size-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Logs & Health */}
        <div className="space-y-4 h-full max-h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-1 shrink-0">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="icon-[solar--history-bold-duotone] size-5 text-primary/40" />
              Recent Logs
            </h3>
            <Button variant="ghost" size="xs" onClick={() => refetchStats()} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              <span className="icon-[solar--refresh-linear] size-3" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin space-y-4 pb-4">
            <AutomationActivity messages={recentLogs} loading={loadingStats} />
            
            <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
                     <span className="icon-[solar--verified-check-bold-duotone] size-4" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-primary">System Health</p>
               </div>
               <p className="text-[11px] text-primary/80 font-medium leading-relaxed">
                  Automated flows are processed with a 99.9% delivery SLA. Delays are typically caused by downstream provider latencies.
               </p>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-0 overflow-hidden border-t border-border shadow-2xl bg-popover ring-1 ring-black/5">
          <div className="mx-auto w-full max-w-2xl px-8 py-10">
            <SheetHeader className="text-left px-0 pb-10">
              <div className="flex items-center gap-4 mb-2">
                 <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="icon-[solar--bolt-bold-duotone] size-6" />
                 </div>
                 <div>
                    <SheetTitle className="text-2xl font-black uppercase tracking-widest text-foreground">
                      {editingRule ? "Refine Flow" : "Create Logic"}
                    </SheetTitle>
                    <SheetDescription className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-0.5">
                      Orchestrate event-driven customer engagement
                    </SheetDescription>
                 </div>
              </div>
            </SheetHeader>
            <div className="pb-6">
              <AutomationForm 
                initialData={editingRule}
                onSuccess={() => { setIsSheetOpen(false); refetch(); refetchStats(); }}
                onCancel={() => setIsSheetOpen(false)}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
