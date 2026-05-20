"use client";

import { StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AutomationRuleRow } from "@/models/comms/automation-rule.model";

export function AutomationFeed({ 
  rules, 
  onToggle,
  onEdit
}: { 
  rules: AutomationRuleRow[]; 
  onToggle: (id: string, currentActive: boolean) => Promise<void>;
  onEdit: (rule: AutomationRuleRow) => void;
}) {
  if (rules.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4">
      {rules.map((rule) => (
        <div key={rule.id} className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                   rule.is_active ? "bg-status-success-bg text-status-success-text" : "bg-muted text-muted-foreground"
                )}>
                   <span className={cn(rule.is_active ? "icon-[solar--bolt-bold-duotone]" : "icon-[solar--bolt-linear]", "size-5")} />
                </div>
                <div>
                   <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{rule.rule_name}</p>
                   <StatusBadge status={rule.is_active ? 'active' : 'muted'} label={rule.is_active ? 'Active' : 'Paused'} size="sm" dot />
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <span className="flex items-center gap-2"><span className="icon-[solar--bolt-bold-duotone] size-3.5" />Trigger: {rule.trigger_event}</span>
                <span className="flex items-center gap-2"><span className="icon-[solar--plain-2-linear] size-3.5" />Channel: {rule.channel}</span>
                <span className="flex items-center gap-2"><span className="icon-[solar--clock-circle-linear] size-3.5" />Offset: {rule.trigger_offset_minutes}m</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-4 font-bold rounded-xl border-border hover:bg-muted"
                onClick={() => onEdit(rule)}
              >
                <span className="icon-[solar--pen-linear] size-3.5 mr-1.5" /> Edit
              </Button>
              <Button
                onClick={() => onToggle(rule.id, rule.is_active)}
                variant={rule.is_active ? "outline" : "default"}
                size="sm"
                className={cn("h-9 px-6 font-bold rounded-xl shadow-sm",
                   rule.is_active ? "text-status-warning-text border-status-warning-text/20 hover:bg-status-warning-bg" : "bg-chart-1 hover:bg-chart-1/90"
                )}
              >
                {rule.is_active ? "Pause" : "Resume"}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
