"use client";

import { useState, useEffect } from "react";
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
  SelectValue 
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/common";

interface EditAssetDialogProps {
  asset: any | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditAssetDialog({ 
  asset, 
  onOpenChange,
  onSuccess 
}: EditAssetDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    brand: "",
    sku: "",
    unit: "pcs",
    purchase_price: "",
    selling_price: "",
    gst_rate: "18",
    reorder_level: "5",
    is_active: true
  });

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || "",
        category: asset.category || "",
        brand: asset.brand || "",
        sku: asset.sku || "",
        unit: asset.unit || "pcs",
        purchase_price: asset.purchase_price?.toString() || "",
        selling_price: asset.selling_price?.toString() || "",
        gst_rate: asset.gst_rate?.toString() || "18",
        reorder_level: asset.reorder_level?.toString() || "5",
        is_active: asset.is_active ?? true
      });
    }
  }, [asset]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/partner/inventory/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update asset");
      
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={!!asset} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="max-w-2xl rounded-3xl border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Edit Asset Metadata</DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Update product details, pricing, and restock thresholds.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asset Name *</Label>
              <Input 
                required
                value={formData.name} 
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/30"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {["HAIR", "SKIN", "NAIL", "EQUIPMENT", "OTHER"].map(c => (
                    <SelectItem key={c} value={c} className="rounded-xl">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">SKU / Barcode</Label>
              <Input 
                value={formData.sku} 
                onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Purchase Price (₹)</Label>
              <Input 
                type="number"
                value={formData.purchase_price} 
                onChange={(e) => setFormData(p => ({ ...p, purchase_price: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Selling Price (₹)</Label>
              <Input 
                type="number"
                value={formData.selling_price} 
                onChange={(e) => setFormData(p => ({ ...p, selling_price: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Restock Point (Min Qty)</Label>
              <Input 
                type="number"
                value={formData.reorder_level} 
                onChange={(e) => setFormData(p => ({ ...p, reorder_level: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Status</Label>
              <Select value={formData.is_active ? "active" : "inactive"} onValueChange={(v) => setFormData(p => ({ ...p, is_active: v === "active" }))}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/30"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="active" className="rounded-xl">Active / In Stock</SelectItem>
                  <SelectItem value="inactive" className="rounded-xl">Inactive / Discontinued</SelectItem>
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
              disabled={submitting}
              className="h-11 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 px-8"
            >
              {submitting ? <LoadingSpinner className="size-4" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
