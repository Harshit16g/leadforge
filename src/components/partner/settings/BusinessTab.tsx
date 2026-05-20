"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  initial: {
    name?: string;
    legal_name?: string;
    contact_email?: string;
    gst_number?: string;
    description?: string;
    settings?: any;
  };
  isOwner?: boolean;
  highlight?: string | null;
}

export function BusinessTab({ initial, isOwner, highlight }: Props) {
  const [form, setForm] = useState({
    name:          initial.name          ?? "",
    legal_name:    initial.legal_name    ?? "",
    contact_email: initial.contact_email ?? "",
    gst_number:    initial.gst_number    ?? "",
    description:   initial.description   ?? "",
    settings:      initial.settings      ?? {},
  });
  const [targetInput, setTargetInput] = useState(
    initial.settings?.target !== undefined && initial.settings?.target !== null
      ? initial.settings.target
      : ""
  );
  const [saving, setSaving] = useState(false);

  function upd(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/partner/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          settings: {
            ...form.settings,
            target: targetInput !== "" ? Number(targetInput) : null,
          }
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Organisation details saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Brand name */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Brand / Trading Name</label>
        <Input value={form.name} onChange={(e) => upd("name", e.target.value)}
          placeholder="e.g. Glamour Studio & Spa"
          className="h-12 rounded-xl font-bold" />
        <p className="text-[10px] text-muted-foreground/60 px-1">This is what customers see on the booking page and search results.</p>
      </div>

      {/* Legal name */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Legal / Registered Name <span className="text-muted-foreground/40 normal-case font-medium">(for invoices & GST)</span>
        </label>
        <Input value={form.legal_name} onChange={(e) => upd("legal_name", e.target.value)}
          placeholder="e.g. Glamour Studio Pvt. Ltd."
          className="h-12 rounded-xl font-semibold" />
        <p className="text-[10px] text-muted-foreground/60 px-1">Same as brand name for sole proprietors. Used on tax invoices.</p>
      </div>

      {/* Contact email */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Business Email</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 icon-[solar--letter-bold-duotone] size-4 text-muted-foreground/50" />
          <Input type="email" value={form.contact_email} onChange={(e) => upd("contact_email", e.target.value)}
            placeholder="contact@yourstudio.com"
            className="h-12 rounded-xl pl-10 font-semibold" />
        </div>
      </div>

      {/* GST */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          GST Number <span className="text-muted-foreground/40 normal-case font-medium">(optional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 icon-[solar--document-bold-duotone] size-4 text-muted-foreground/50" />
          <Input value={form.gst_number} onChange={(e) => upd("gst_number", e.target.value.toUpperCase())}
            placeholder="22AAAAA0000A1Z5"
            className="h-12 rounded-xl pl-10 font-mono text-sm uppercase placeholder:normal-case placeholder:font-sans" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">About Your Business</label>
        <textarea
          value={form.description}
          onChange={(e) => upd("description", e.target.value.slice(0, 600))}
          placeholder="Tell customers what makes your business special…"
          rows={4}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-[10px] text-muted-foreground/50 text-right">{form.description.length}/600</p>
      </div>

      {/* Target setting (disabled/read-only if not owner) */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Monthly Target Achievement (%) {!isOwner && <span className="text-muted-foreground/50 lowercase font-medium">(read-only for team members)</span>}
        </label>
        <Input
          type="number"
          min={0}
          max={100}
          value={targetInput}
          onChange={(e) => setTargetInput(Number(e.target.value) || 0)}
          disabled={!isOwner}
          placeholder="e.g. 87"
          className="h-12 rounded-xl font-semibold disabled:bg-muted/50 disabled:cursor-not-allowed"
        />
        <p className="text-[10px] text-muted-foreground/60 px-1">Goal percentage shown on the dashboard overview banner.</p>
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button onClick={save} disabled={saving} className="rounded-xl px-8 font-bold">
          {saving ? "Saving…" : "Save Organisation"}
        </Button>
      </div>
    </div>
  );
}
