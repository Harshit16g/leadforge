"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/common";

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newProductId?: string) => void;
}

export function AddAssetDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: AddAssetDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "Hair",
    brand: "",
    sku: "",
    unit: "pcs",
    purchase_price: "",
    selling_price: "",
    reorder_level: "5",
    gst_rate: "18"
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/partner/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          purchase_price: Number(formData.purchase_price) || 0,
          selling_price: Number(formData.selling_price) || 0,
          reorder_level: Number(formData.reorder_level) || 5,
          gst_rate: Number(formData.gst_rate) || 0
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add asset");
      
      onSuccess(json.data?.id);
      onOpenChange(false);
      setFormData({
        name: "",
        category: "Hair",
        brand: "",
        sku: "",
        unit: "pcs",
        purchase_price: "",
        selling_price: "",
        reorder_level: "5",
        gst_rate: "18"
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Define New Asset</DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Create a new item in your inventory catalog.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Product Name *</Label>
              <Input 
                required
                value={formData.name} 
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. L'Oreal Professional Shampoo"
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {["Hair", "Skin", "Nail", "Other"].map(c => (
                    <SelectItem key={c} value={c} className="rounded-xl">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Brand</Label>
              <Input 
                value={formData.brand} 
                onChange={(e) => setFormData(p => ({ ...p, brand: e.target.value }))}
                placeholder="e.g. L'Oreal"
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">SKU / Barcode</Label>
              <Input 
                value={formData.sku} 
                onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                placeholder="Unique identifier"
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unit</Label>
              <Select value={formData.unit} onValueChange={(v) => setFormData(p => ({ ...p, unit: v }))}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {["pcs", "ml", "gm", "box", "bottle"].map(u => (
                    <SelectItem key={u} value={u} className="rounded-xl">{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Reorder Level (Safety Stock)</Label>
              <Input 
                type="number" 
                value={formData.reorder_level} 
                onChange={(e) => setFormData(p => ({ ...p, reorder_level: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">GST Rate (%)</Label>
              <Select value={formData.gst_rate} onValueChange={(v) => setFormData(p => ({ ...p, gst_rate: v }))}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {["0", "5", "12", "18", "28"].map(r => (
                    <SelectItem key={r} value={r} className="rounded-xl">{r}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-xs font-bold text-destructive ml-1">{error}</p>}

          <DialogFooter className="pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)} 
              className="h-11 rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !formData.name || !formData.category}
              className="h-11 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 px-8"
            >
              {submitting ? <LoadingSpinner className="size-4" /> : "Create Asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
