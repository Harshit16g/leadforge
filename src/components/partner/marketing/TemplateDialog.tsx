"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PARAMETERS = [
  { label: "First Name", value: "{{name}}", description: "Customer's first name" },
  { label: "Full Name", value: "{{full_name}}", description: "Customer's complete name" },
  { label: "Phone", value: "{{phone}}", description: "Customer's phone number" },
  { label: "Email", value: "{{email}}", description: "Customer's email address" },
  { label: "Business Name", value: "{{business_name}}", description: "Your salon/clinic name" },
  { label: "Business Phone", value: "{{business_phone}}", description: "Your business contact number" },
  { label: "Booking Date", value: "{{booking_date}}", description: "Date of the appointment" },
  { label: "Booking Time", value: "{{booking_time}}", description: "Time of the appointment" },
  { label: "Booking ID", value: "{{booking_id}}", description: "Unique booking reference" },
  { label: "Staff Name", value: "{{staff_name}}", description: "Assigned employee name" },
  { label: "Service Name", value: "{{service_name}}", description: "Primary service booked" },
  { label: "Total Amount", value: "{{amount}}", description: "Final bill amount" },
  { label: "Loyalty Points", value: "{{points}}", description: "Available points balance" },
  { label: "Review Link", value: "{{review_link}}", description: "Direct feedback URL" },
  { label: "Booking Link", value: "{{booking_link}}", description: "Direct link to book again" },
];


export function TemplateDialog({
  open,
  onOpenChange,
  onSuccess
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("compose");
  const [formData, setFormData] = useState({
    name: "",
    body: "",
    subject: "",
    channel: "sms",
    is_public: false
  });

  const insertParameter = (param: string) => {
    setFormData(prev => ({
      ...prev,
      body: prev.body + param
    }));
  };

  const renderPreview = (text: string) => {
    if (!text) return <span className="text-muted-foreground italic">Message preview will appear here...</span>;

    return text
      .replace(/{{name}}/g, "<strong>Sakshi</strong>")
      .replace(/{{full_name}}/g, "<strong>Sakshi Tiwari</strong>")
      .replace(/{{business_name}}/g, "<strong>Leaex Premium</strong>")
      .replace(/{{booking_date}}/g, "<strong>15th June</strong>")
      .replace(/{{booking_time}}/g, "<strong>10:30 AM</strong>")
      .split("\n")
      .map((line, i) => (
        <p key={i} dangerouslySetInnerHTML={{ __html: line }} className="min-h-[1em]" />
      ));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.body) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/partner/automation/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to submit template");

      toast.success("Template submitted for approval!");
      onSuccess();
      onOpenChange(false);
      setFormData({ name: "", body: "", subject: "", channel: "sms", is_public: false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] rounded-[2rem] border border-border p-0 overflow-hidden bg-card shadow-2xl">
        <div className="p-8 space-y-6">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <span className="icon-[solar--document-text-bold-duotone] size-8" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">Create Message Template</DialogTitle>
              <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Design your outreach and verify the look before submission
              </DialogDescription>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/30 p-1 rounded-xl mb-6">
              <TabsTrigger value="compose" className="rounded-lg font-black text-[10px] uppercase tracking-widest">
                <span className="icon-[solar--pen-new-square-bold-duotone] size-3.5 mr-2" /> Compose
              </TabsTrigger>
              <TabsTrigger value="preview" className="rounded-lg font-black text-[10px] uppercase tracking-widest">
                <span className="icon-[solar--eye-bold-duotone] size-3.5 mr-2" /> Live Preview
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-6">
              <TabsContent value="compose" className="space-y-6 animate-in fade-in slide-in-from-left-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Template Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Birthday Promo"
                      className="rounded-xl bg-muted/30 border-border h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Channel</label>
                    <select
                      className="w-full h-11 px-3 rounded-xl bg-muted/30 border border-border text-sm font-medium outline-none"
                      value={formData.channel}
                      onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    >
                      <option value="sms">SMS</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Message Body</label>
                    <span className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      Personalization Enabled
                    </span>
                  </div>
                  <Textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    required
                    rows={6}
                    placeholder="Type your message here..."
                    className="rounded-2xl bg-muted/30 border-border resize-none p-6 text-sm leading-relaxed"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Available Parameters</label>
                  <div className="flex flex-wrap gap-2">
                    {PARAMETERS.map((param) => (
                      <button
                        key={param.value}
                        type="button"
                        onClick={() => insertParameter(param.value)}
                        title={param.description}
                        className="px-3 py-2 rounded-xl bg-muted/50 border border-border hover:border-primary/30 hover:bg-primary/[0.02] transition-all group"
                      >
                        <span className="text-[10px] font-black text-foreground group-hover:text-primary transition-colors">{param.label}</span>
                        <span className="text-[9px] font-bold text-muted-foreground ml-1.5 opacity-50">{param.value}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-6">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Community Sharing</p>
                      <p className="text-[10px] font-bold text-muted-foreground">Allow other partners to use this template once approved</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                        formData.is_public ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-white shadow-sm transition-all",
                        formData.is_public ? "ml-6" : "ml-0"
                      )} />
                    </button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="animate-in fade-in slide-in-from-right-2">
                <div className="space-y-4">
                  <div className="relative mx-auto w-full max-w-[400px]">
                    {/* Phone Frame Appearance */}
                    <div className="bg-[#E5DDD5] rounded-[32px] p-6 min-h-[300px] border-[8px] border-slate-900 shadow-xl relative overflow-hidden">
                      {/* WhatsApp Style Chat Bubble */}
                      <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm relative animate-in zoom-in-95 duration-300 max-w-[90%] ml-2">
                        <div className="text-xs text-foreground space-y-1 font-medium">
                          {renderPreview(formData.body)}
                        </div>
                        <div className="text-[9px] text-muted-foreground text-right mt-1 font-bold">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                        </div>
                        {/* Bubble tail */}
                        <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-white border-l-[10px] border-l-transparent" />
                      </div>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-900 rounded-full" />
                  </div>
                  <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pt-4">
                    This is how the customer will see your message
                  </p>
                </div>
              </TabsContent>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px]"
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !formData.name || !formData.body}
                  className="flex-[2] h-12 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  {submitting ? (
                    <span className="icon-[solar--refresh-linear] size-4 animate-spin mr-2" />
                  ) : (
                    <span className="icon-[solar--plain-2-bold-duotone] size-4 mr-2" />
                  )}
                  Submit for Approval
                </Button>
              </div>
            </form>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
