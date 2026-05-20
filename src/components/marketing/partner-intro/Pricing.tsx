"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    desc: "Perfect for single-chair studios and new startups.",
    features: ["Up to 200 Bookings/mo", "Basic WhatsApp", "Staff Mobile App", "Standard Support"],
    cta: "Start Free",
    popular: false
  },
  {
    name: "Growth",
    price: "₹1,499",
    period: "/mo",
    desc: "Ideal for growing salons with multiple staff members.",
    features: ["Unlimited Bookings", "Advanced Automation", "Inventory Management", "Priority Support"],
    cta: "Start 14-day Trial",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "Scale your multi-branch franchise with ease.",
    features: ["Custom Integrations", "Dedicated Manager", "White-label Options", "SLA Guarantee"],
    cta: "Contact Sales",
    popular: false
  }
];

export function Pricing() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight">
          Simple, transparent <br className="hidden md:block" /> pricing that scales
        </h2>
        <p className="text-muted-foreground font-semibold text-lg max-w-2xl mx-auto">
          No hidden fees. Choose a plan that fits your business stage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={cn(
              "relative p-8 rounded-xl border transition-all duration-500 hover:-translate-y-2 hover:shadow-atmospheric",
              p.popular 
                ? "bg-card border-primary shadow-xl shadow-primary/5" 
                : "bg-card border-border shadow-sm hover:border-primary/30"
            )}
          >
            {p.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
                Most Popular
              </div>
            )}
            
            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">{p.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                {p.period && <span className="text-muted-foreground font-semibold">{p.period}</span>}
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-4 leading-relaxed">{p.desc}</p>
            </div>

            <div className="space-y-4 mb-8">
              {p.features.map((f, j) => (
                <div key={j} className="flex items-center gap-3">
                  <span className="icon-[solar--check-circle-bold] text-primary size-4 shrink-0" />
                  <span className="text-sm font-semibold">{f}</span>
                </div>
              ))}
            </div>

            <Button 
              asChild 
              variant={p.popular ? "default" : "outline"} 
              className={cn(
                "w-full h-14 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                p.popular ? "shadow-lg shadow-primary/20" : "border-2"
              )}
            >
              <Link href="/register">{p.cta}</Link>
            </Button>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-12 text-center">
         <Link href="/admin/plans" className="text-xs font-bold uppercase tracking-[0.2em] text-primary hover:underline">
            Compare all features & tiers
         </Link>
      </div>
    </section>
  );
}
