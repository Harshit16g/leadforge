"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { OnboardingData } from "@/hooks/useOnboarding";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1] as any, duration: 0.45 } },
};

const MANAGER_OPTIONS = [
  {
    value: "self" as const,
    label: "I manage it myself",
    desc: "You're the owner and directly running this branch.",
    icon: "solar--user-bold-duotone",
  },
  {
    value: "dedicated" as const,
    label: "Dedicated branch manager",
    desc: "A separate manager handles day-to-day operations.",
    icon: "solar--users-group-two-rounded-bold-duotone",
  },
];

interface Props {
  data: OnboardingData;
  updateData: (d: Partial<OnboardingData>) => void;
}

export function Step1Establishment({ data, updateData }: Props) {
  const branch = data.branch || {};
  const org = data.organization || {};
  const managerType = branch.manager_type ?? "self";

  const updBranch = (k: string, v: string) =>
    updateData({ branch: { ...branch, [k]: v } });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

      {/* Org context banner */}
      {org.name && (
        <motion.div
          variants={itemVariants}
          className="rounded-xl bg-muted/40 border border-border px-4 py-3 space-y-0.5"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Organisation</p>
          <div className="flex items-center gap-2">
            <span className="icon-[solar--buildings-bold-duotone] size-4 text-foreground shrink-0" />
            <span className="text-sm font-bold text-foreground truncate">{org.name}</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium pt-0.5">
            You're setting up the <span className="font-bold text-primary">primary branch</span> for this organisation. You can add more branches later.
          </p>
        </motion.div>
      )}

      {/* Branch name */}
      <motion.div variants={itemVariants} className="space-y-1.5">
        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Branch Name</Label>
        <div className="relative group">
          <Input
            placeholder="e.g. Main Branch, Koramangala, City Centre"
            autoFocus
            value={branch.name || ""}
            onChange={(e) => updBranch("name", e.target.value)}
            className="h-14 px-5 rounded-2xl border-2 border-border bg-muted/30 text-base font-bold tracking-tight text-foreground placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
          />
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: branch.name ? "100%" : 0 }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground/60 font-medium pl-1">
          A short name to identify this location — by area, floor, or just "Main Branch".
        </p>
      </motion.div>

      {/* Contact phone + email */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Branch Phone</Label>
          <div className="flex h-12 relative">
            <span className="flex items-center px-3 bg-muted/50 border-2 border-r-0 border-border rounded-l-xl text-[11px] font-black text-muted-foreground select-none whitespace-nowrap">
              +91
            </span>
            <Input
              placeholder="9876543210"
              maxLength={10}
              value={branch.contact_phone || ""}
              onChange={(e) => updBranch("contact_phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="rounded-l-none h-12 rounded-r-xl border-2 border-border bg-muted/30 font-bold tabular-nums placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
            />
          </div>
          <p className="text-[10px] text-muted-foreground/50 pl-1">Shown to customers on invoices.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Branch Email</Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
              <span className="icon-[solar--letter-bold-duotone] size-4 text-muted-foreground/40" />
            </span>
            <Input
              type="email"
              placeholder="branch@yourbusiness.com"
              value={branch.contact_email || ""}
              onChange={(e) => updBranch("contact_email", e.target.value)}
              className="h-12 pl-9 pr-4 rounded-xl border-2 border-border bg-muted/30 font-medium placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
            />
          </div>
          <p className="text-[10px] text-muted-foreground/50 pl-1">Optional — for booking confirmations.</p>
        </div>
      </motion.div>

      {/* Branch manager */}
      <motion.div variants={itemVariants} className="space-y-3">
        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Who manages this branch?</Label>

        <div className="grid grid-cols-2 gap-3">
          {MANAGER_OPTIONS.map((opt) => {
            const selected = managerType === opt.value;
            return (
              <motion.button
                key={opt.value}
                type="button"
                onClick={() => updateData({ branch: { ...branch, manager_type: opt.value } })}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative rounded-2xl border-2 p-4 text-left transition-all duration-200 overflow-hidden",
                  selected
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                    : "border-border bg-muted/20 hover:border-primary/30 hover:bg-muted/30"
                )}
              >
                {selected && (
                  <motion.div
                    layoutId="manager-type-bg"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/8 to-transparent"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <div className="relative space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn(`icon-[${opt.icon}] size-5 mt-0.5 shrink-0`, selected ? "text-primary" : "text-muted-foreground")} />
                    {selected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="size-4 rounded-full bg-primary flex items-center justify-center shrink-0"
                      >
                        <span className="icon-[solar--check-circle-bold-duotone] text-primary-foreground size-2.5" />
                      </motion.div>
                    )}
                  </div>
                  <p className={cn("text-xs font-black leading-tight", selected ? "text-primary" : "text-foreground")}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium leading-snug">{opt.desc}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Dedicated manager fields */}
        <AnimatePresence>
          {managerType === "dedicated" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-4">
                <div className="rounded-2xl border-2 border-dashed border-primary/25 bg-primary/3 px-4 py-3">
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-0.5">Manager Account</p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    They'll receive an email invite to create their manager account and access this branch.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Manager Name</Label>
                    <Input
                      placeholder="PRIYA KAPOOR"
                      value={branch.manager_name || ""}
                      onChange={(e) => updBranch("manager_name", e.target.value.toUpperCase())}
                      className="h-12 px-4 rounded-xl border-2 border-border bg-muted/30 font-bold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Manager Phone</Label>
                    <div className="flex h-12 relative">
                      <span className="flex items-center px-3 bg-muted/50 border-2 border-r-0 border-border rounded-l-xl text-[11px] font-black text-muted-foreground select-none">
                        +91
                      </span>
                      <Input
                        placeholder="9876543210"
                        maxLength={10}
                        value={branch.manager_phone || ""}
                        onChange={(e) => updBranch("manager_phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="rounded-l-none h-12 rounded-r-xl border-2 border-border bg-muted/30 font-bold tabular-nums placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Manager Email</Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
                      <span className="icon-[solar--letter-bold-duotone] size-4 text-muted-foreground/40" />
                    </span>
                    <Input
                      type="email"
                      placeholder="manager@yourbusiness.com"
                      value={branch.manager_email || ""}
                      onChange={(e) => updBranch("manager_email", e.target.value)}
                      className="h-12 pl-9 pr-4 rounded-xl border-2 border-border bg-muted/30 font-medium placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Self-manage note */}
        <AnimatePresence>
          {managerType === "self" && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15"
            >
              <span className="icon-[solar--check-circle-bold-duotone] size-4 text-emerald-500 shrink-0" />
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                You'll be set as the primary manager of this branch. You can assign a dedicated manager later from settings.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
