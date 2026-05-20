"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase-client/client";
import { toast } from "sonner";

export function UpiSettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    id: "",
    upi_id: "leaex@upi",
    payee_name: "LEAEX",
    merchant_code: "",
    currency: "INR",
  });

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  async function loadSettings() {
    setLoading(true);
    const { data, error } = await supabase
      .schema("billing")
      .from("upi_settings")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();
      
    if (data) {
      setForm({
        id: data.id,
        upi_id: data.upi_id,
        payee_name: data.payee_name,
        merchant_code: data.merchant_code || "",
        currency: data.currency,
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    
    // We update the active config, or insert if none exists
    const payload = {
      upi_id: form.upi_id,
      payee_name: form.payee_name,
      merchant_code: form.merchant_code || null,
      currency: form.currency,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    let result;
    if (form.id) {
      result = await supabase.schema("billing").from("upi_settings")
        .update(payload)
        .eq("id", form.id)
        .select();
    } else {
      result = await supabase.schema("billing").from("upi_settings")
        .insert(payload)
        .select();
    }

    setSaving(false);

    if (result.error) {
      toast.error(result.error.message || "Failed to save UPI settings.");
    } else if (!result.data || result.data.length === 0) {
      toast.error("No rows were updated. Check your permissions.");
    } else {
      toast.success("UPI Configuration Updated!");
      setIsOpen(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2.5 px-6 h-12 text-sm font-bold uppercase tracking-widest text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-all shadow-sm">
          <span className="icon-[solar--wallet-money-bold-duotone] size-4" /> UPI Config
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md rounded-2xl border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Payment Gateway Configuration</DialogTitle>
          <p className="text-sm text-muted-foreground font-semibold">
            Manage the active UPI Intent parameters for cross-device plan upgrades.
          </p>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center">
            <span className="icon-[solar--refresh-circle-bold-duotone] animate-spin size-8 text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">UPI ID (pa)</label>
              <input 
                value={form.upi_id}
                onChange={e => setForm({...form, upi_id: e.target.value})}
                placeholder="business@upi"
                className="w-full h-11 px-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Payee Name (pn)</label>
              <input 
                value={form.payee_name}
                onChange={e => setForm({...form, payee_name: e.target.value})}
                placeholder="LEAEX INC"
                className="w-full h-11 px-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Merchant Code (mc) <span className="opacity-50 font-normal lowercase tracking-normal">- optional</span></label>
              <input 
                value={form.merchant_code}
                onChange={e => setForm({...form, merchant_code: e.target.value})}
                placeholder="e.g. 5411"
                className="w-full h-11 px-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Currency</label>
              <input 
                value={form.currency}
                onChange={e => setForm({...form, currency: e.target.value})}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background outline-none text-sm font-semibold opacity-70"
                readOnly
              />
            </div>

            <div className="pt-4 mt-2 border-t border-border flex justify-end gap-2">
              <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button className="rounded-xl font-bold uppercase tracking-widest px-8" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Config"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
