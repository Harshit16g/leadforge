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

interface EditPurchaseDialogProps {
  purchase: any | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  products: any[];
  suppliers: any[];
}

export function EditPurchaseDialog({ 
  purchase, 
  onOpenChange,
  onSuccess,
  products,
  suppliers
}: EditPurchaseDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    product_id: "",
    supplier_id: "",
    quantity: "",
    unit_price: "",
    invoice_number: "",
    purchase_date: "",
    notes: ""
  });

  useEffect(() => {
    if (purchase) {
      setFormData({
        product_id: purchase.product_id || "",
        supplier_id: purchase.supplier_id || "",
        quantity: purchase.quantity?.toString() || "",
        unit_price: purchase.unit_price?.toString() || "",
        invoice_number: purchase.invoice_number || "",
        purchase_date: purchase.purchase_date || "",
        notes: purchase.notes || ""
      });
    }
  }, [purchase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/partner/inventory/purchases/${purchase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update entry");
      
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={!!purchase} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="max-w-2xl rounded-3xl border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Edit Procurement Entry</DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Correct entry details or update documentation for this purchase.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asset Identity</Label>
              <Select value={formData.product_id} onValueChange={(v) => setFormData(p => ({ ...p, product_id: v }))}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {(products || []).map(p => (
                    <SelectItem key={p.id} value={p.id} className="rounded-xl">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Supplier</Label>
              <Select value={formData.supplier_id} onValueChange={(v) => setFormData(p => ({ ...p, supplier_id: v }))}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {(suppliers || []).map(s => (
                    <SelectItem key={s.id} value={s.id} className="rounded-xl">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Quantity</Label>
              <Input 
                type="number"
                value={formData.quantity} 
                onChange={(e) => setFormData(p => ({ ...p, quantity: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unit Price (₹)</Label>
              <Input 
                type="number"
                value={formData.unit_price} 
                onChange={(e) => setFormData(p => ({ ...p, unit_price: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30" 
              />
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
