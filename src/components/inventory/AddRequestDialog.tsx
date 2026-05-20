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
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/common";

interface AddRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  products: any[];
  suppliers: any[];
}

export function AddRequestDialog({ 
  open, 
  onOpenChange,
  onSuccess,
  products,
  suppliers
}: AddRequestDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    product_id: "",
    supplier_id: "",
    quantity: "",
    estimated_cost: "",
    expected_at: "",
    notes: ""
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/partner/inventory/supplier-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create request");
      
      onSuccess();
      onOpenChange(false);
      setFormData({
        product_id: "",
        supplier_id: "",
        quantity: "",
        estimated_cost: "",
        expected_at: "",
        notes: ""
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
          <DialogTitle className="text-xl font-black">Create Supplier Request</DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Initiate a stock order from a registered supplier.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asset Identity *</Label>
              <Select value={formData.product_id} onValueChange={(v) => setFormData(p => ({ ...p, product_id: v }))}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 font-medium">
                  <SelectValue placeholder="Select product..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id} className="rounded-xl">{p.name} (Stock: {p.current_stock})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Supplier *</Label>
              <Select value={formData.supplier_id} onValueChange={(v) => setFormData(p => ({ ...p, supplier_id: v }))}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 font-medium">
                  <SelectValue placeholder="Select supplier..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id} className="rounded-xl">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Required Quantity *</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(p => ({ ...p, quantity: e.target.value }))}
                placeholder="0"
                className="h-11 rounded-xl bg-muted/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Estimated Cost (₹)</Label>
              <Input
                type="number"
                value={formData.estimated_cost}
                onChange={(e) => setFormData(p => ({ ...p, estimated_cost: e.target.value }))}
                placeholder="0.00"
                className="h-11 rounded-xl bg-muted/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Expected Delivery</Label>
              <Input
                type="date"
                value={formData.expected_at}
                onChange={(e) => setFormData(p => ({ ...p, expected_at: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Request Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
              placeholder="Urgency, batch preference, or other instructions..."
              className="rounded-xl bg-muted/30 min-h-[80px]"
            />
          </div>

          {error && <p className="text-xs font-bold text-destructive ml-1">{error}</p>}

          <DialogFooter className="pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl font-bold"
            >
              Discard
            </Button>
            <Button
              type="submit"
              disabled={submitting || !formData.product_id || !formData.supplier_id || !formData.quantity}
              className="h-11 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 px-8"
            >
              {submitting ? <LoadingSpinner className="size-4" /> : "Send Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
