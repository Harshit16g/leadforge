"use client";

import { useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const ORG_TYPES = [
  { value: "salon",       label: "Salon",         icon: "solar--magic-stick-3-bold-duotone",    color: "from-pink-500/20 to-rose-500/10" },
  { value: "spa",         label: "Spa",            icon: "solar--leaf-bold-duotone",             color: "from-emerald-500/20 to-teal-500/10" },
  { value: "barbershop",  label: "Barbershop",     icon: "solar--scissors-bold-duotone",         color: "from-blue-500/20 to-indigo-500/10" },
  { value: "beauty",      label: "Nail Studio",    icon: "solar--star-bold-duotone",             color: "from-purple-500/20 to-violet-500/10" },
  { value: "clinic",      label: "Clinic",         icon: "solar--heart-pulse-bold-duotone",      color: "from-red-500/20 to-orange-500/10" },
  { value: "wellness",    label: "Wellness",       icon: "solar--meditation-round-bold-duotone", color: "from-amber-500/20 to-yellow-500/10" },
  { value: "fitness",     label: "Fitness",        icon: "solar--dumbbell-bold-duotone",         color: "from-cyan-500/20 to-sky-500/10" },
  { value: "other",       label: "Other",          icon: "solar--widget-bold-duotone",           color: "from-slate-500/20 to-zinc-500/10" },
];

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1] as any, duration: 0.45 } },
};

interface Props {
  data: Record<string, any>;
  updateData: (d: Record<string, any>) => void;
}

export function Step0Organization({ data, updateData }: Props) {
  const org = data.organization || {};
  const upd = (k: string, v: string) => updateData({ organization: { ...org, [k]: v } });

  const fileRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(org.logo_preview || null);
  const [logoHover, setLogoHover] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
    // Store file name + preview URL — actual upload happens on completion
    updateData({ organization: { ...org, logo_preview: url, logo_file_name: file.name } });
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-7">

      {/* Logo + Org Name row */}
      <motion.div variants={itemVariants} className="flex items-start gap-5">
        {/* Logo picker */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Logo</p>
          <motion.button
            type="button"
            onClick={() => fileRef.current?.click()}
            onMouseEnter={() => setLogoHover(true)}
            onMouseLeave={() => setLogoHover(false)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="relative size-20 rounded-2xl border-2 border-dashed border-border bg-muted/30 overflow-hidden flex items-center justify-center group transition-colors hover:border-primary/50"
          >
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <span className="icon-[solar--camera-add-bold-duotone] size-7 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
            <motion.div
              className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: logoHover && logoPreview ? 1 : 0 }}
            >
              <span className="icon-[solar--pen-bold-duotone] size-5 text-white" />
            </motion.div>
          </motion.button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          <p className="text-[9px] text-muted-foreground/60 font-medium mt-1.5 text-center">Optional</p>
        </div>

        {/* Name + Tagline */}
        <div className="flex-1 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Organization Name</Label>
            <div className="relative group">
              <Input
                placeholder="e.g. Glamour Studio & Spa"
                autoFocus
                value={org.name || ""}
                onChange={(e) => upd("name", e.target.value)}
                className="h-14 px-5 rounded-2xl border-2 border-border bg-muted/30 text-base font-bold tracking-tight text-foreground placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
              />
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: org.name ? "100%" : 0 }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tagline <span className="text-muted-foreground/40 normal-case font-medium">(optional)</span></Label>
            <Input
              placeholder="e.g. Where Beauty Meets Wellness"
              value={org.tagline || ""}
              onChange={(e) => upd("tagline", e.target.value)}
              className="h-12 px-5 rounded-xl border-2 border-border bg-muted/30 font-medium placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
            />
          </div>
        </div>
      </motion.div>

      {/* Organization Type */}
      <motion.div variants={itemVariants} className="space-y-2.5">
        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Business Type</Label>
        <div className="grid grid-cols-4 gap-2">
          {ORG_TYPES.map((t, i) => {
            const selected = org.industry_type === t.value;
            return (
              <motion.button
                key={t.value}
                type="button"
                onClick={() => upd("industry_type", t.value)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 260, damping: 18 }}
                whileHover={{ scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  "relative rounded-2xl border-2 p-3 text-left transition-all duration-200 overflow-hidden group",
                  selected
                    ? "border-primary bg-primary/8 shadow-md shadow-primary/15"
                    : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                {/* Gradient bg when selected */}
                {selected && (
                  <motion.div
                    layoutId="org-type-bg"
                    className={cn("absolute inset-0 bg-gradient-to-br opacity-60 rounded-2xl", t.color)}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <div className="relative flex flex-col items-center gap-1.5 text-center">
                  <motion.span
                    className={cn(`icon-[${t.icon}] size-5 transition-colors`, selected ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}
                    animate={selected ? { rotate: [0, -8, 8, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  />
                  <span className={cn("text-[9px] font-black uppercase tracking-tight leading-none", selected ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
                    {t.label}
                  </span>
                </div>

                {/* Selected checkmark */}
                {selected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1.5 right-1.5 size-3.5 rounded-full bg-primary flex items-center justify-center"
                  >
                    <span className="icon-[solar--check-circle-bold-duotone] text-primary-foreground size-2" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Legal Name + Contact row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Legal / Registered Name <span className="text-muted-foreground/40 normal-case font-medium">(optional)</span>
          </Label>
          <Input
            placeholder="e.g. Glamour Studio Pvt. Ltd."
            value={org.legal_name || ""}
            onChange={(e) => upd("legal_name", e.target.value)}
            className="h-12 px-5 rounded-xl border-2 border-border bg-muted/30 font-medium placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
          />
          <p className="text-[9px] text-muted-foreground/50 font-medium mt-0.5">Same as business name for sole proprietors</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Business Phone</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2">
              <span className="icon-[solar--phone-bold-duotone] size-4 text-muted-foreground/50" />
            </span>
            <Input
              type="tel"
              placeholder="+91 98765 43210"
              value={org.contact_phone || ""}
              onChange={(e) => upd("contact_phone", e.target.value)}
              className="h-12 pl-10 pr-4 rounded-xl border-2 border-border bg-muted/30 font-medium placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
            />
          </div>
        </div>
      </motion.div>

      {/* Contact Email */}
      <motion.div variants={itemVariants} className="space-y-1.5">
        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Business Email</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2">
            <span className="icon-[solar--letter-bold-duotone] size-4 text-muted-foreground/50" />
          </span>
          <Input
            type="email"
            placeholder="contact@yourstudio.com"
            value={org.contact_email || ""}
            onChange={(e) => upd("contact_email", e.target.value)}
            className="h-12 pl-10 pr-4 rounded-xl border-2 border-border bg-muted/30 font-medium placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
          />
        </div>
      </motion.div>

      {/* GST + Website row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            GST Number <span className="text-muted-foreground/40 normal-case font-medium">(optional)</span>
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2">
              <span className="icon-[solar--document-bold-duotone] size-4 text-muted-foreground/50" />
            </span>
            <Input
              placeholder="22AAAAA0000A1Z5"
              value={org.gst_number || ""}
              onChange={(e) => upd("gst_number", e.target.value.toUpperCase())}
              className="h-12 pl-10 pr-4 rounded-xl border-2 border-border bg-muted/30 font-mono text-sm uppercase placeholder:normal-case placeholder:font-sans placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Website <span className="text-muted-foreground/40 normal-case font-medium">(optional)</span>
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2">
              <span className="icon-[solar--global-bold-duotone] size-4 text-muted-foreground/50" />
            </span>
            <Input
              placeholder="yourwebsite.com"
              type="url"
              value={org.website || ""}
              onChange={(e) => upd("website", e.target.value)}
              className="h-12 pl-10 pr-4 rounded-xl border-2 border-border bg-muted/30 font-medium placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
            />
          </div>
        </div>
      </motion.div>

      {/* Description */}
      <motion.div variants={itemVariants} className="space-y-1.5">
        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          About Your Business <span className="text-muted-foreground/40 normal-case font-medium">(optional)</span>
        </Label>
        <Textarea
          placeholder="Tell clients what makes your establishment special..."
          value={org.description || ""}
          onChange={(e) => upd("description", e.target.value)}
          rows={3}
          className="px-5 py-4 rounded-xl border-2 border-border bg-muted/30 font-medium resize-none placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
        />
        {org.description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-muted-foreground/50 text-right"
          >
            {(org.description as string).length} characters
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
