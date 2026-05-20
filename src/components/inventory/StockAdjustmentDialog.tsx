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
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner, StatusBadge } from "@/components/common";

interface StockAdjustmentDialogProps {
  product: { id: string; name: string; current_stock: number; category?: string } | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const REASONS = [
  { value: "breakage", label: "Breakage / Damage" },
  { value: "expiry", label: "Expired Product" },
  { value: "theft", label: "Theft / Missing" },
  { value: "correction", label: "Stock Correction" },
  { value: "return", label: "Customer Return" },
  { value: "recount", label: "Physical Recount" },
  { value: "other", label: "Other" },
];

export function StockAdjustmentDialog({
  product,
  onOpenChange,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    adjustment_type: "remove" as "add" | "remove",
    quantity: "",
    reason: "correction",
    notes: "",
  });

  const newStock = product
    ? formData.adjustment_type === "add"
      ? product.current_stock + Number(formData.quantity || 0)
      : product.current_stock - Number(formData.quantity || 0)
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/partner/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          adjustment_type: formData.adjustment_type,
          quantity: Number(formData.quantity),
          reason: formData.reason,
          notes: formData.notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to adjust stock");

      onSuccess();
      onOpenChange(false);
      setFormData({ adjustment_type: "remove", quantity: "", reason: "correction", notes: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Adjust Stock</DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Manual stock correction for {product?.name}
          </DialogDescription>
        </DialogHeader>

        {product && (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Current stock display */}
            <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Stock</p>
                <p className="text-2xl font-black tabular-nums">{product.current_stock}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">After Adjustment</p>
                <p className={`text-2xl font-black tabular-nums ${newStock < 0 ? "text-destructive" : "text-primary"}`}>
                  {Number(formData.quantity) > 0 ? newStock : "—"}
                </p>
              </div>
            </div>

            {/* Type toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, adjustment_type: "remove" }))}
                className={`flex-1 h-11 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${
                  formData.adjustment_type === "remove"
                    ? "bg-destructive/10 border-destructive/30 text-destructive"
                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="icon-[solar--minus-circle-bold] size-4 mr-1.5 inline-block align-text-bottom" />
                Remove
              </button>
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, adjustment_type: "add" }))}
                className={`flex-1 h-11 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${
                  formData.adjustment_type === "add"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="icon-[solar--add-circle-bold] size-4 mr-1.5 inline-block align-text-bottom" />
                Add
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(p => ({ ...p, quantity: e.target.value }))}
                  placeholder="0"
                  className="h-11 rounded-xl bg-muted/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Reason *</Label>
                <Select value={formData.reason} onValueChange={(v) => setFormData(p => ({ ...p, reason: v }))}>
                  <SelectTrigger className="h-11 rounded-xl bg-muted/30 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {REASONS.map(r => (
                      <SelectItem key={r.value} value={r.value} className="rounded-xl">{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="Why is this adjustment needed..."
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
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !formData.quantity || Number(formData.quantity) <= 0 || newStock < 0}
                className="h-11 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 px-8"
              >
                {submitting ? <LoadingSpinner className="size-4" /> : "Apply Adjustment"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
