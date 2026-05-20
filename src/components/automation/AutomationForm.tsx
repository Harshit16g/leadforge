"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TriggerEventSchema } from "@/models/comms/automation-rule.model";
import { useTemplates } from "@/hooks/usePartnerApi";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutomationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

export function AutomationForm({ onSuccess, onCancel, initialData }: AutomationFormProps) {
  const { data: templates, loading: loadingTemplates } = useTemplates();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    rule_name: initialData?.rule_name ?? "",
    trigger_event: initialData?.trigger_event ?? "booking.completed",
    channel: initialData?.channel ?? "sms",
    template_id: initialData?.template_id ?? "",
    trigger_offset_minutes: initialData?.trigger_offset_minutes ?? 0,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.rule_name || !formData.template_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const url = initialData?.id 
        ? `/api/partner/automation/${initialData.id}` 
        : "/api/partner/automation";
      const method = initialData?.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save rule");
      }

      toast.success(initialData?.id ? "Rule updated" : "Rule created");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const triggerEvents = TriggerEventSchema.options;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Configuration */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Flow Identifier</label>
            <Input 
              placeholder="e.g. Booking Confirmation Loop"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              className="h-12 px-5 rounded-2xl border-border bg-muted/20 focus:bg-background transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Triggering Event</label>
            <Select 
              value={formData.trigger_event} 
              onValueChange={(v) => setFormData({ ...formData, trigger_event: v })}
            >
              <SelectTrigger className="h-12 px-5 rounded-2xl border-border bg-muted/20 focus:bg-background transition-all">
                <SelectValue placeholder="Select trigger" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-xl border-border">
                {triggerEvents.map((event) => (
                   <SelectItem key={event} value={event} className="py-2.5 rounded-xl capitalize">
                     <div className="flex items-center gap-2">
                        <span className="icon-[solar--bolt-linear] size-3.5 text-primary/40" />
                        {event.replace(".", " ").replace("_", " ")}
                     </div>
                   </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Channel</label>
              <Select 
                value={formData.channel} 
                onValueChange={(v: any) => setFormData({ ...formData, channel: v })}
              >
                <SelectTrigger className="h-12 px-5 rounded-2xl border-border bg-muted/20">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="sms" className="rounded-xl">SMS</SelectItem>
                  <SelectItem value="email" className="rounded-xl">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Delay (Min)</label>
              <Input 
                type="number"
                min={0}
                value={formData.trigger_offset_minutes}
                onChange={(e) => setFormData({ ...formData, trigger_offset_minutes: parseInt(e.target.value) || 0 })}
                className="h-12 px-5 rounded-2xl border-border bg-muted/20"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Template Selection */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Message Template</label>
            <Select 
              value={formData.template_id} 
              onValueChange={(v) => setFormData({ ...formData, template_id: v })}
              disabled={loadingTemplates}
            >
              <SelectTrigger className="h-12 px-5 rounded-2xl border-border bg-muted/20 focus:bg-background transition-all">
                <SelectValue placeholder={loadingTemplates ? "Scanning Repository..." : "Select template"} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl max-h-[300px]">
                {templates?.map((t: any) => (
                  <SelectItem key={t.id} value={t.id} className="py-3 rounded-xl">
                    <div className="flex flex-col gap-0.5">
                       <span className="font-bold text-sm">{t.name}</span>
                       <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.channel} • Verified Template</span>
                    </div>
                  </SelectItem>
                ))}
                {templates?.length === 0 && !loadingTemplates && (
                  <div className="py-8 px-4 text-center">
                    <p className="text-xs font-bold text-muted-foreground">No templates found.</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase font-black">Register templates in the Marketing hub first.</p>
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="p-6 bg-muted/20 border border-border rounded-3xl flex flex-col items-center justify-center text-center space-y-3">
             <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border shadow-sm">
                <span className="icon-[solar--info-circle-linear] size-5 text-muted-foreground/60" />
             </div>
             <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">Draft Preview</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                   Dynamic variables like <code className="text-[9px] bg-muted px-1 rounded">{"{{customer_name}}"}</code> will be resolved at runtime using real-time CRM data.
                </p>
             </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onCancel} className="h-12 px-8 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-muted transition-all">
          Discard Changes
        </Button>
        <Button 
          type="submit" 
          disabled={loading} 
          className="h-12 px-10 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? "Refine Logic" : "Deploy Flow"}
        </Button>
      </div>
    </form>
  );
}
