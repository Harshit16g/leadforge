"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingData } from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";

interface Service { id: string; name: string; duration: number; price: number; category?: string }

const QUICK_ADD = [
  { name: "Haircut", duration: 30, price: 300 },
  { name: "Hair Colour", duration: 90, price: 1200 },
  { name: "Facial", duration: 60, price: 800 },
  { name: "Manicure", duration: 45, price: 500 },
  { name: "Pedicure", duration: 45, price: 600 },
  { name: "Waxing", duration: 30, price: 400 },
];

interface Props {
  data: OnboardingData;
  updateData: (d: Partial<OnboardingData>) => void;
}

export function Step3Services({ data, updateData }: Props) {
  const services: Service[] = (data.services || []).map((s) => ({
    id: s.id, name: s.name, duration: s.duration, price: s.price,
  }));
  const [name, setName]         = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice]       = useState("");

  const add = (overrides?: Partial<Service>) => {
    const n = overrides?.name ?? name.trim();
    if (!n) return;
    updateData({
      services: [...services, {
        id: crypto.randomUUID(),
        name: n,
        duration: overrides?.duration ?? (parseInt(duration) || 30),
        price:    overrides?.price    ?? (parseFloat(price)   || 0),
      }],
    });
    if (!overrides) { setName(""); setDuration("30"); setPrice(""); }
  };

  const remove = (id: string) => updateData({ services: services.filter((s) => s.id !== id) });

  return (
    <div className="space-y-5">
      {/* Quick add chips */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Quick Add</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ADD.filter((q) => !services.some((s) => s.name === q.name)).map((q, i) => (
            <motion.button
              key={q.name}
              type="button"
              onClick={() => add(q)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 250, damping: 18 }}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.94 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-dashed border-border bg-muted/30 text-[10px] font-black text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors"
            >
              <span className="icon-[solar--add-circle-linear] size-3" />
              {q.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Manual input row */}
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Service Name</Label>
          <Input
            placeholder="e.g. Deep Tissue Massage"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            className="h-12 px-4 rounded-xl border-2 border-border bg-muted/30 font-semibold placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
          />
        </div>
        <div className="w-20 space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Min</Label>
          <Input
            type="number" min={5} placeholder="30" value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="h-12 px-3 rounded-xl border-2 border-border bg-muted/30 font-bold text-center placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all"
          />
        </div>
        <div className="w-24 space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">₹ Price</Label>
          <Input
            type="number" min={0} placeholder="500" value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-12 px-3 rounded-xl border-2 border-border bg-muted/30 font-bold placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all"
          />
        </div>
        <motion.button
          type="button"
          onClick={() => add()}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-shadow shrink-0"
        >
          <span className="icon-[solar--add-circle-bold-duotone] size-5" />
        </motion.button>
      </div>

      {/* Service list */}
      <AnimatePresence>
        {services.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-8"
          >
            <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              <span className="icon-[solar--list-bold-duotone] text-muted-foreground size-7" />
            </div>
            <p className="text-sm text-muted-foreground font-semibold">Add at least one service to continue</p>
          </motion.div>
        ) : (
          <motion.div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {services.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: 20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-border bg-card px-4 py-3 group hover:border-primary/30 transition-colors">
                    <div className="size-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-primary">{i+1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.duration} min · ₹{s.price.toLocaleString("en-IN")}</p>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => remove(s.id)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <span className="icon-[solar--trash-bin-trash-bold-duotone] size-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Count badge */}
      {services.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <span className="icon-[solar--check-circle-bold-duotone] text-emerald-500 size-4" />
          <span className="font-semibold">{services.length} service{services.length !== 1 ? "s" : ""} added</span>
        </motion.div>
      )}
    </div>
  );
}
