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
  SelectValue 
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/common";

interface RecordSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  products: any[];
}

export function RecordSaleDialog({ 
  open, 
  onOpenChange,
  onSuccess,
  products
}: RecordSaleDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "1",
    unit_price: "",
    customer_id: null
  });

  const selectedProduct = (products || []).find(p => p.id === formData.product_id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/partner/inventory/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to record sale");
      
      onSuccess();
      onOpenChange(false);
      setFormData({
        product_id: "",
        quantity: "1",
        unit_price: "",
        customer_id: null
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Record Direct Sale</DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Sell items directly to customers as retail (resell).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Product *</Label>
            <Select 
              value={formData.product_id} 
              onValueChange={(v) => {
                const p = (products || []).find(x => x.id === v);
                setFormData(prev => ({ 
                  ...prev, 
                  product_id: v,
                  unit_price: p ? p.selling_price.toString() : ""
                }));
              }}
            >
              <SelectTrigger className="h-11 rounded-xl bg-muted/30">
                <SelectValue placeholder="Pick an item..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {(products || []).map(p => (
                  <SelectItem key={p.id} value={p.id} className="rounded-xl">
                    {p.name} (Stock: {p.current_stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Quantity *</Label>
              <Input 
                type="number"
                min="1"
                value={formData.quantity} 
                onChange={(e) => setFormData(p => ({ ...p, quantity: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unit Price (₹) *</Label>
              <Input 
                type="number"
                value={formData.unit_price} 
                onChange={(e) => setFormData(p => ({ ...p, unit_price: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-2xl flex items-center justify-between border border-border/50">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Sale Value</span>
            <span className="text-xl font-black text-foreground tabular-nums">
              ₹{(Number(formData.quantity) * Number(formData.unit_price) || 0).toLocaleString()}
            </span>
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
              disabled={submitting || !formData.product_id || !formData.quantity || !formData.unit_price}
              className="h-11 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 px-8"
            >
              {submitting ? <LoadingSpinner className="size-4" /> : "Complete Sale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
