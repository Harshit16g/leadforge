"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PlanFeature { name: string; included: boolean }
interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number | null;
  priceYearly:  number | null;
  features: PlanFeature[];
  highlighted: boolean;
  is_public?: boolean;
}

interface Props {
  data: any;
  updateData: (d: any) => void;
}

type BillingCycle = "monthly" | "yearly";
type PaymentMethod = "razorpay" | "cash";

export function Step5Plan({ data, updateData }: Props) {
  const [plans, setPlans]         = useState<Plan[]>([]);
  const [loading, setLoading]     = useState(true);
  const [cycle, setCycle]         = useState<BillingCycle>("monthly");
  const [payMethod, setPayMethod] = useState<PaymentMethod>(data.payment_method ?? "razorpay");
  const [payLoading, setPayLoading] = useState(false);
  const selected = data.plan as string | undefined;
  const razorpayRef = useRef<any>(null);

  useEffect(() => {
    fetch("/api/onboarding/plans")
      .then((r) => r.json())
      .then((res: Plan[]) => setPlans(Array.isArray(res) ? res : []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const selectPlan = (id: string) => {
    updateData({ plan: id, payment_method: payMethod });
  };

  const changePayMethod = (m: PaymentMethod) => {
    setPayMethod(m);
    updateData({ payment_method: m });
  };

  // Load Razorpay script
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).Razorpay) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const initiateRazorpay = async () => {
    if (!selected) return;
    setPayLoading(true);
    try {
      const res = await fetch("/api/payments/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: selected }),
      });
      const { subscriptionId, key, free } = await res.json();

      if (free) {
        // Trial / free plan — proceed directly
        updateData({ payment_method: "razorpay", razorpay_subscription_id: null });
        return;
      }

      if (!subscriptionId || !key) {
        throw new Error("Failed to create Razorpay subscription");
      }

      const RZ = (window as any).Razorpay;
      if (!RZ) throw new Error("Razorpay SDK not loaded");

      const rzp = new RZ({
        key,
        subscription_id: subscriptionId,
        name: "Leaex",
        description: `${selected.charAt(0).toUpperCase() + selected.slice(1)} Plan — 14-day free trial`,
        theme: { color: "#5d87ff" },
        handler: (response: any) => {
          updateData({
            payment_method: "razorpay",
            razorpay_subscription_id: subscriptionId,
            razorpay_payment_id: response.razorpay_payment_id,
          });
        },
      });
      razorpayRef.current = rzp;
      rzp.open();
    } catch (err) {
      console.error("[Razorpay]", err);
    } finally {
      setPayLoading(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selected);
  const price = (p: Plan) => cycle === "yearly" ? p.priceYearly : p.priceMonthly;
  const yearlyDiscount = 17; // 2 months free

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse border-2 border-border/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/50 border-2 border-border">
          {(["monthly","yearly"] as BillingCycle[]).map((c) => (
            <motion.button
              key={c}
              type="button"
              onClick={() => setCycle(c)}
              className={cn(
                "relative px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors",
                cycle === c ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cycle === c && (
                <motion.div layoutId="cycle-bg" className="absolute inset-0 bg-primary rounded-xl shadow-md shadow-primary/25" transition={{ type: "spring", stiffness: 300, damping: 25 }} />
              )}
              <span className="relative">{c}</span>
              {c === "yearly" && (
                <span className={cn("ml-1.5 text-[8px] font-black px-1.5 py-0.5 rounded-full relative", cycle==="yearly" ? "bg-white/20 text-white" : "bg-primary/10 text-primary")}>
                  -{yearlyDiscount}%
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="space-y-3">
        {plans.map((plan, i) => {
          const isSelected = selected === plan.id;
          const displayPrice = price(plan);
          return (
            <motion.button
              key={plan.id}
              type="button"
              onClick={() => selectPlan(plan.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 18 }}
              whileHover={{ scale: 1.015, y: -2 }}
              whileTap={{ scale: 0.985 }}
              className={cn(
                "w-full relative rounded-2xl border-2 p-5 text-left transition-colors duration-200 overflow-hidden group",
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
              )}
            >
              {/* Selection glow */}
              {isSelected && (
                <motion.div
                  layoutId="plan-selected"
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: "radial-gradient(ellipse at top right, hsl(var(--primary)/0.12), transparent 60%)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}

              {/* Shimmer on hover */}
              <motion.div
                className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/5"
                whileHover={{ translateX: "200%" }}
                transition={{ duration: 0.6 }}
              />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Radio dot */}
                    <div className={cn("size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/30")}>
                      {isSelected && (
                        <motion.div layoutId={`dot-${plan.id}`} className="size-1.5 rounded-full bg-white"
                          initial={{ scale: 0 }} animate={{ scale: 1 }} />
                      )}
                    </div>
                    <span className="text-sm font-black text-foreground">{plan.name}</span>
                    {plan.highlighted && (
                      <Badge className="text-[9px] font-black bg-primary/15 text-primary border-primary/20 px-2">
                        Most Popular
                      </Badge>
                    )}
                    {!plan.is_public && (
                      <Badge variant="outline" className="text-[9px] font-black text-amber-500 border-amber-500/30 bg-amber-500/5 px-2">
                        Admin Only
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mb-2 ml-6">{plan.description}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 ml-6">
                    {plan.features.filter((f) => f.included).slice(0, 4).map((f) => (
                      <span key={f.name} className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                        <span className="icon-[solar--check-circle-bold-duotone] text-primary size-3" />
                        {f.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={cycle + plan.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="text-xl font-black text-foreground tabular-nums">
                        {displayPrice == null ? "Custom" : displayPrice === 0 ? "Free" : `₹${displayPrice.toLocaleString("en-IN")}`}
                      </span>
                      {displayPrice != null && displayPrice > 0 && (
                        <span className="text-xs text-muted-foreground">/{cycle === "yearly" ? "yr" : "mo"}</span>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  {cycle === "yearly" && displayPrice && displayPrice > 0 && (
                    <div className="text-[9px] text-emerald-500 font-black mt-0.5">Save {yearlyDiscount}%</div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Payment method — only show once a plan is selected */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Payment Method</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: "razorpay" as PaymentMethod, label: "Online / UPI", icon: "solar--card-bold-duotone", desc: "Razorpay — Cards, UPI, Net Banking" },
                  { id: "cash"     as PaymentMethod, label: "Cash / Admin", icon: "solar--hand-money-bold-duotone", desc: "Pay in person, admin activates" },
                ] as { id: PaymentMethod; label: string; icon: string; desc: string }[]).map((m) => (
                  <motion.button
                    key={m.id}
                    type="button"
                    onClick={() => changePayMethod(m.id)}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "relative rounded-2xl border-2 p-4 text-left transition-colors",
                      payMethod === m.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/20 hover:border-primary/30"
                    )}
                  >
                    <span className={cn(`icon-[${m.icon}] size-5 mb-2`, payMethod===m.id ? "text-primary" : "text-muted-foreground")} />
                    <p className="text-xs font-black text-foreground">{m.label}</p>
                    <p className="text-[9px] text-muted-foreground font-medium mt-0.5">{m.desc}</p>
                    {payMethod === m.id && (
                      <motion.div layoutId="pay-selected" className="absolute top-2 right-2 size-4 rounded-full bg-primary flex items-center justify-center"
                        initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <span className="icon-[solar--check-circle-bold-duotone] text-primary-foreground size-2.5" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>

              {payMethod === "razorpay" && selectedPlan && (selectedPlan.priceMonthly ?? 0) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/3 p-4 text-center space-y-2"
                >
                  <p className="text-xs text-muted-foreground font-semibold">
                    14-day free trial · First charge after trial ends
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">Card saved now, billed later. Cancel anytime.</p>
                </motion.div>
              )}

              {payMethod === "cash" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border-2 border-dashed border-amber-500/30 bg-amber-500/4 p-4 space-y-1"
                >
                  <p className="text-xs text-amber-600 font-black">Admin Activation Required</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Our team will confirm your payment and activate your account within 24 hours.</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
