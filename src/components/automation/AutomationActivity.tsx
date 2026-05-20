"use client";

import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/common";
import { formatDistanceToNow } from "date-fns";

interface AutomationActivityProps {
  messages: any[];
  loading?: boolean;
}

export function AutomationActivity({ messages, loading }: AutomationActivityProps) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted/20 rounded-2xl border border-border/50" />
        ))}
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="py-12 text-center bg-muted/5 rounded-[2rem] border border-dashed border-border flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
           <span className="icon-[solar--letter-opened-linear] size-6 text-muted-foreground opacity-30" />
        </div>
        <div className="space-y-1">
           <p className="text-sm text-muted-foreground font-bold">Quiescent State</p>
           <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">No recent automated activity recorded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between group hover:border-primary/20 transition-all shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-inner border border-border/5",
              msg.status === "delivered" || msg.status === "read" || msg.status === "sent" 
                ? "bg-status-success-bg text-status-success-text" 
                : msg.status === "failed" 
                ? "bg-status-error-bg text-status-error-text" 
                : "bg-status-warning-bg text-status-warning-text"
            )}>
              <span className={cn(
                msg.status === "delivered" || msg.status === "read" || msg.status === "sent" 
                  ? "icon-[solar--check-circle-bold-duotone]" 
                  : msg.status === "failed" 
                  ? "icon-[solar--danger-circle-bold-duotone]" 
                  : "icon-[solar--clock-circle-bold-duotone]",
                "size-5"
              )} />
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xs font-bold text-foreground truncate max-w-[120px]">
                  {msg.recipient_phone}
                </p>
                <StatusBadge 
                  status={
                    msg.status === "read" || msg.status === "delivered" || msg.status === "sent" 
                      ? "success" 
                      : msg.status === "failed" 
                      ? "danger" 
                      : "warning"
                  } 
                  label={msg.status} 
                  size="sm" 
                />
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                <span className="icon-[solar--document-text-linear] size-3" />
                {msg.rule?.rule_name ?? "Automation Payload"}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-bold text-foreground opacity-80 tabular-nums">
              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
            </p>
            <p className="text-[8px] font-black text-primary/40 uppercase tracking-tighter mt-0.5">
               Message ID: {msg.id.slice(0, 8)}            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
