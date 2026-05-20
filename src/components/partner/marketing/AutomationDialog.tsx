"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import type { AutomationRuleRow, TriggerEvent } from "@/models/comms/automation-rule.model";

const TRIGGER_LABELS: Record<TriggerEvent, string> = {
  "booking.assigned":      "Appointment Assigned",
  "booking.reminder":      "Appointment Reminder",
  "booking.completed":     "Appointment Completed",
  "booking.cancelled":     "Appointment Cancelled",
  "walkin.started":        "Walk-in Started",
  "waitlist.slot_available": "Waitlist Slot Available",
  "payroll.payslip_ready":   "Payslip Ready",
  "attendance.morning":      "Morning Check-in",
  "customer.birthday":       "Customer Birthday",
  "customer.anniversary":    "Customer Anniversary",
  "customer.re_engagement":  "Re-engagement (Idle)",
};

interface Template {
  id: string;
  name: string;
  channel: string;
  body: string;
}

export function AutomationDialog({
  open,
  onOpenChange,
  rule,
  onSuccess
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: AutomationRuleRow | null;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [formData, setFormData] = useState({
    rule_name: "",
    channel: "sms" as "sms" | "email",
    trigger_event: "booking.completed" as TriggerEvent,
    trigger_offset_minutes: 0,
    template_id: "",
  });

  useEffect(() => {
    if (open) {
      fetchTemplates();
      if (rule) {
        setFormData({
          rule_name: rule.rule_name,
          channel: rule.channel as "sms" | "email",
          trigger_event: rule.trigger_event as TriggerEvent,
          trigger_offset_minutes: rule.trigger_offset_minutes,
          template_id: rule.template_id || "",
        });
      } else {
        setFormData({
          rule_name: "",
          channel: "sms",
          trigger_event: "booking.completed",
          trigger_offset_minutes: 0,
          template_id: "",
        });
      }
    }
  }, [open, rule]);

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/partner/automation/templates");
      const json = await res.json();
      if (res.ok) setTemplates(json.data || []);
    } catch (e) {
      console.error("Failed to fetch templates", e);
    }
  }

  async function handleSubmit() {
    if (!formData.rule_name || !formData.template_id) {
      toast.error("Rule name and template are required");
      return;
    }

    setLoading(true);
    try {
      const url = rule ? `/api/partner/automation/${rule.id}` : "/api/partner/automation";
      const method = rule ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");

      toast.success(rule ? "Rule updated" : "Automation rule created");
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl overflow-hidden border-border bg-card p-0">
        <div className="bg-primary/5 p-8 border-b border-border/50">
          <DialogTitle className="text-xl font-black mb-1.5 flex items-center gap-2.5">
            <span className="icon-[solar--bolt-bold-duotone] text-primary size-6" />
            {rule ? "Modify Automation" : "Create New Flow"}
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Configure event-driven logic to engage your customers automatically.
          </DialogDescription>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Internal Rule Name</Label>
            <Input 
              placeholder="e.g. Post-visit Gratitude"
              value={formData.rule_name}
              onChange={(e) => setFormData({...formData, rule_name: e.target.value})}
              className="rounded-xl border-border bg-muted/20 font-bold focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Channel</Label>
              <Select 
                value={formData.channel} 
                onValueChange={(v: any) => setFormData({...formData, channel: v})}
              >
                <SelectTrigger className="rounded-xl border-border bg-muted/20 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Trigger Event</Label>
              <Select 
                value={formData.trigger_event} 
                onValueChange={(v: any) => setFormData({...formData, trigger_event: v})}
              >
                <SelectTrigger className="rounded-xl border-border bg-muted/20 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Delay (Minutes)</Label>
              <Input 
                type="number"
                value={formData.trigger_offset_minutes}
                onChange={(e) => setFormData({...formData, trigger_offset_minutes: parseInt(e.target.value) || 0})}
                className="rounded-xl border-border bg-muted/20 font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Message Template</Label>
              <Select 
                value={formData.template_id} 
                onValueChange={(v) => setFormData({...formData, template_id: v})}
              >
                <SelectTrigger className="rounded-xl border-border bg-muted/20 font-bold">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates
                    .filter(t => t.channel === formData.channel)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))
                  }
                  {templates.filter(t => t.channel === formData.channel).length === 0 && (
                    <div className="p-2 text-[10px] font-bold text-muted-foreground uppercase text-center italic">
                      No {formData.channel} templates found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.template_id && (
            <div className="p-4 rounded-2xl bg-muted/30 border border-dashed border-border">
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Template Preview</p>
               <p className="text-xs text-foreground font-medium leading-relaxed italic">
                 "{templates.find(t => t.id === formData.template_id)?.body}"
               </p>
            </div>
          )}
        </div>

        <DialogFooter className="p-8 pt-0 bg-muted/10 border-t border-border/50">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20"
          >
            {loading ? <span className="icon-[solar--refresh-circle-bold-duotone] animate-spin size-4" /> : <span className="icon-[solar--diskette-bold-duotone] size-4 mr-2" />}
            {rule ? "Update Logic" : "Activate Flow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
