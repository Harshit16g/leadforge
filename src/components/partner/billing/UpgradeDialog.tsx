"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase-client/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  display_name: string;
  price_monthly: number;
  max_staff: number;
  max_branches: number;
}

export function UpgradeDialog({ orgId, currentPlanId, plans }: { orgId: string, currentPlanId: string | undefined, plans: Plan[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionShortId, setSessionShortId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [upiSettings, setUpiSettings] = useState<any>(null);
  const [utr, setUtr] = useState("");
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Basic mobile detection
    setIsMobile(/Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 768);
    
    // Fetch UPI settings and active sessions
    const loadData = async () => {
      const supabase = createClient();
      
      // 1. Load Settings
      const { data: settings } = await supabase.schema("billing").from("upi_settings").select("*").eq("is_active", true).maybeSingle();
      if (settings) setUpiSettings(settings);

      // 2. Check for existing pending session
      const { data: existing } = await supabase.schema("billing").from("payment_sessions")
        .select("id, short_id, status, plan_id, amount, payload")
        .eq("org_id", orgId)
        .eq("status", "pending_verification")
        .maybeSingle();

      if (existing) {
        setSessionId(existing.id);
        setSessionShortId(existing.short_id);
        const plan = plans.find(p => p.id === existing.plan_id);
        if (plan) setSelectedPlan(plan);
        setUtr(existing.payload?.utr || "");
        toast.info("Resuming your pending verification...");
      }
    };
    loadData();
  }, [orgId, plans]);

  // Listen for realtime payment success
  useEffect(() => {
    if (!sessionId) return;
    const supabase = createClient();
    
    const channel = supabase.channel(`payment_sync_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "billing",
          table: "payment_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload: { new: { status: string } }) => {
          if (payload.new.status === "success" || payload.new.status === "pending_verification") {
            toast.success("Payment received! The admin is verifying your transaction.");
            setIsOpen(false);
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, router]);

  const handleSelectPlan = async (plan: Plan) => {
    const supabase = createClient();
    const amount = Math.round(billingPeriod === "yearly" ? (plan.price_monthly * 12 * 0.9) : plan.price_monthly);

    // 1. Check for ANY existing open session (pending, initiated, or pending_verification)
    const { data: existing } = await supabase.schema("billing").from("payment_sessions")
      .select("id, status")
      .eq("org_id", orgId)
      .in("status", ["pending", "initiated", "pending_verification"])
      .maybeSingle();

    if (existing) {
      if (existing.status === "pending_verification") {
        toast.info("Resuming your pending verification...");
        setSessionId(existing.id);
        setSelectedPlan(plan);
        return;
      }

      // If it's just 'pending' or 'initiated', update it with the new plan choice
      const { data: updated, error: updateErr } = await supabase.schema("billing").from("payment_sessions").update({
        plan_id: plan.id,
        amount: amount,
        status: "pending", // Reset to pending
        payload: { billing_period: billingPeriod, updated_at: new Date().toISOString() }
      }).eq("id", existing.id).select("id, short_id").single();

      if (!updateErr && updated) {
        setSessionId(updated.id);
        setSessionShortId(updated.short_id);
        setSelectedPlan(plan);
        return;
      }
    }

    // 2. No session exists, create a fresh one
    const { data, error } = await supabase.schema("billing").from("payment_sessions").insert({
      org_id: orgId,
      plan_id: plan.id,
      amount: amount,
      status: "pending",
      payload: { billing_period: billingPeriod }
    }).select("id, short_id").single();

    if (error || !data) {
      toast.error("Failed to initialize payment session");
      return;
    }

    setSessionId(data.id);
    setSessionShortId(data.short_id);
    setSelectedPlan(plan);
  };

  const handleVerify = async () => {
    if (!utr || utr.length < 12) {
      toast.error("Please enter a valid 12-digit UTR/Transaction ID");
      return;
    }

    setVerifying(true);
    try {
      const formData = new FormData();
      formData.append("utr", utr);

      const res = await fetch(`/api/payments/upi-callback?manual=true&session_id=${sessionId}`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Verification request sent!");
        // The realtime listener will handle closing the dialog if successful
      } else {
        toast.error("Failed to submit verification. Please try again.");
      }
    } catch (e) {
      toast.error("An error occurred during verification.");
    } finally {
      setVerifying(false);
    }
  };

  const renderPaymentStep = () => {
    if (!selectedPlan || !sessionId) return null;

    const upiId = upiSettings?.upi_id || "leaex@upi";
    const payeeName = upiSettings?.payee_name || "LEAEX";
    const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${selectedPlan.price_monthly}&cu=INR&tn=${encodeURIComponent(selectedPlan.display_name)}`;
    const verifyUrl = `${window.location.origin}/pay/${sessionId}`;

    return (
      <div className="space-y-10 py-2 animate-in fade-in zoom-in duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Step 1: Payment */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-black text-sm mb-2 shadow-lg shadow-primary/20">1</div>
            <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Scan to Pay</h4>
            <div className="mx-auto p-4 bg-white rounded-3xl w-fit shadow-xl border-2 border-primary/5">
              <QRCodeSVG value={upiUri} size={160} level="H" />
            </div>
            <p className="text-[11px] text-muted-foreground font-bold leading-relaxed px-4">
              Use any UPI app (PhonePe, GPay, etc.) to scan and pay <strong>₹{selectedPlan.price_monthly}</strong>
            </p>
          </div>

          {/* Step 2: Verification */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-black text-sm mb-2 shadow-lg shadow-primary/20">2</div>
            <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Scan to Verify</h4>
            <div className="mx-auto p-4 bg-white rounded-3xl w-fit shadow-xl border-2 border-primary/5">
              <QRCodeSVG value={verifyUrl} size={160} level="H" />
            </div>
            <p className="text-[11px] text-muted-foreground font-bold leading-relaxed px-4">
              Scan this after payment to <strong>paste your UTR</strong> from your mobile for activation.
            </p>
          </div>

        </div>

        <div className="max-w-md mx-auto pt-8 border-t border-border">
          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border">
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Manual Entry (Desktop)</p>
              <input 
                type="text" 
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="Enter 12-digit UTR"
                className="w-full bg-transparent outline-none text-sm font-black tracking-widest placeholder:font-bold placeholder:text-muted-foreground/30"
              />
            </div>
            <Button onClick={handleVerify} disabled={verifying || !utr} size="sm" className="rounded-xl font-black px-6 shadow-lg shadow-primary/20">
              {verifying ? "..." : "Verify"}
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground font-bold mt-4 uppercase tracking-[0.1em] opacity-60">
            Waiting for verification from your device...
          </p>
        </div>

        <div className="flex justify-center">
          <Button variant="ghost" className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60" onClick={() => setSelectedPlan(null)}>
            Cancel & Change Plan
          </Button>
        </div>
      </div>
    );
  };

  const renderPlanSelection = () => (
    <div className="space-y-6">
      <div className="flex justify-center p-1 bg-muted rounded-2xl w-fit mx-auto border border-border">
        <button 
          className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", billingPeriod === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
          onClick={() => setBillingPeriod("monthly")}
        >
          Monthly
        </button>
        <button 
          className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2", billingPeriod === "yearly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
          onClick={() => setBillingPeriod("yearly")}
        >
          Yearly <span className="text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded-lg">-10%</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {plans.filter(p => p.price_monthly > 0).map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const displayPrice = billingPeriod === "yearly" ? Math.round(plan.price_monthly * 0.9) : plan.price_monthly;
          
          return (
            <div 
              key={plan.id}
              className={`p-6 rounded-[1.5rem] border-2 transition-all ${isCurrent ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            >
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">{plan.display_name}</h4>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-black">₹{displayPrice}</span>
                <span className="text-xs font-bold text-muted-foreground">/mo {billingPeriod === "yearly" && "(billed yearly)"}</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm font-bold text-foreground/80">
                <li className="flex items-center gap-2"><span className="icon-[solar--check-circle-bold] text-primary size-4" /> {plan.max_staff} Staff Limit</li>
                <li className="flex items-center gap-2"><span className="icon-[solar--check-circle-bold] text-primary size-4" /> {plan.max_branches} Branches</li>
              </ul>
              <Button 
                className="w-full h-11 rounded-xl font-bold uppercase tracking-widest text-xs" 
                variant={isCurrent ? "secondary" : "default"}
                disabled={isCurrent}
                onClick={() => handleSelectPlan(plan)}
              >
                {isCurrent ? "Active" : "Select Tier"}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setSelectedPlan(null);
        setUtr("");
      }
    }}>
      <DialogTrigger asChild>
        <Button className="rounded-xl font-bold shadow-xl shadow-primary/10 h-11 px-8 uppercase tracking-widest text-xs">Upgrade Plan</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-10 border-border shadow-2xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            {selectedPlan ? "Activate Premium" : "Scale your Business"}
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold text-muted-foreground leading-relaxed">
            {selectedPlan ? "Follow the steps below to complete your secure payment." : "Choose the perfect tier for your expanding salon or service network."}
          </DialogDescription>
        </DialogHeader>

        {selectedPlan ? renderPaymentStep() : renderPlanSelection()}
      </DialogContent>
    </Dialog>
  );
}
