"use client";

import { StatusBadge } from "@/components/common";
import { type StatusVariant } from "@/components/common/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
export interface Campaign {
  id: string;
  name: string;
  status: "draft" | "running" | "paused" | "completed" | "cancelled";
  template_name?: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  deferred_count: number;
  completed_at?: string;
  created_at: string;
}

const STATUS_MAP: Record<Campaign["status"], StatusVariant> = {
  draft:     "muted",
  running:   "info",
  paused:    "warning",
  completed: "success",
  cancelled: "danger",
};

export function CampaignFeed({ campaigns }: { campaigns: Campaign[] }) {
  if (campaigns.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-6">
      {campaigns.map((c) => {
        const progress = c.total_recipients > 0 ? (c.sent_count / c.total_recipients) * 100 : 0;
        const deliveryPercent = c.sent_count > 0 ? (c.delivered_count / c.sent_count) * 100 : 0;

        return (
          <div
            key={c.id}
            className="bg-card rounded-[2rem] border border-border p-8 flex flex-col gap-6 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-3">
                   <div className={cn(
                     "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                     c.status === 'running' ? "bg-primary/10 text-primary animate-pulse" : "bg-muted text-muted-foreground"
                   )}>
                      <span className="icon-[solar--volume-loud-bold-duotone] size-6" />
                   </div>
                   <div>
                     <h4 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">{c.name}</h4>
                     <div className="flex items-center gap-2 mt-0.5">
                       <StatusBadge status={STATUS_MAP[c.status] ?? 'muted'} label={c.status} size="sm" dot />
                       <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">• {c.template_name || "Custom Creative"}</span>
                     </div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 md:gap-12">
                 <div className="text-center md:text-right">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Reach</p>
                    <p className="text-sm font-black text-foreground">{c.total_recipients}</p>
                 </div>
                 <div className="text-center md:text-right">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Sent</p>
                    <p className="text-sm font-black text-foreground">{c.sent_count}</p>
                 </div>
                 <div className="text-center md:text-right">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Delivered</p>
                    <p className="text-sm font-black text-emerald-500 tabular-nums">{Math.round(deliveryPercent)}%</p>
                 </div>
              </div>
            </div>

            {/* Progress Bar for Active Campaigns */}
            {c.status === 'running' && (
              <div className="space-y-2">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-primary">
                    <span>Dispatch Progress</span>
                    <span>{Math.round(progress)}%</span>
                 </div>
                 <Progress value={progress} className="h-2 rounded-full bg-primary/10" />
              </div>
            )}

            {/* Detailed breakdown footer */}
            <div className="pt-6 border-t border-dashed border-border flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                   <span className="w-2 h-2 rounded-full bg-blue-500" />
                   <span>{c.delivered_count} Delivered</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                   <span className="w-2 h-2 rounded-full bg-amber-500" />
                   <span>{c.deferred_count} Retrying</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                   <span className="w-2 h-2 rounded-full bg-destructive" />
                   <span>{c.failed_count} Failed</span>
                </div>
              </div>
              
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                {c.completed_at ? `COMPLETED ${new Date(c.completed_at).toLocaleDateString()}` : `CREATED ${new Date(c.created_at).toLocaleDateString()}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
