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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { usePartnerSettings } from "@/hooks/usePartnerApi";

export function RequestCampaignDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [sampleDetails, setSampleDetails] = useState("");
  const { data: settings } = usePartnerSettings();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/partner/contact-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_name: settings?.name || "Partner",
          phone: settings?.contact_phone || "N/A",
          email: settings?.contact_email || "",
          message: `OBJECTIVE:\n${message}\n\nSAMPLE DETAILS:\n${sampleDetails || "None provided"}`,
          source: "campaign_request",
          business_name: settings?.name,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit request");

      toast.success("Campaign request submitted! Redirecting to communication hub...");
      onOpenChange(false);
      setMessage("");
      router.push("/partner/contact-requests");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] border border-border p-0 overflow-hidden bg-card shadow-2xl">
        <div className="p-8 space-y-6">
          <DialogHeader className="space-y-4">
             <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="icon-[solar--plain-2-bold-duotone] size-8" />
             </div>
             <div>
                <DialogTitle className="text-2xl font-black tracking-tight">Request New Campaign</DialogTitle>
                <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  Our marketing experts will help you design the perfect flow
                </DialogDescription>
             </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Campaign Objective</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Example: We want to target clients who haven't visited in 45 days with a 20% discount coupon..."
                  className="w-full rounded-2xl bg-muted/30 border border-border p-5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Sample Details (Optional)</label>
                <textarea
                  value={sampleDetails}
                  onChange={(e) => setSampleDetails(e.target.value)}
                  rows={2}
                  placeholder="e.g. Test Number: +919876543210, Promo Code: WELCOME25"
                  className="w-full rounded-2xl bg-muted/30 border border-border p-4 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                />
                <p className="text-[9px] text-muted-foreground font-bold italic ml-1">Provide any specific numbers or data for validation.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] text-muted-foreground"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="flex-[2] h-12 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                {submitting ? (
                  <span className="icon-[solar--refresh-linear] size-4 animate-spin mr-2" />
                ) : (
                  <span className="icon-[solar--plain-2-bold-duotone] size-4 mr-2" />
                )}
                Initialize Request
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
