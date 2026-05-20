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
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/common";

interface EditSupplierDialogProps {
  supplier: any | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditSupplierDialog({ 
  supplier, 
  onOpenChange,
  onSuccess 
}: EditSupplierDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gst_number: "",
    notes: ""
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        gst_number: supplier.gst_number || "",
        notes: supplier.notes || ""
      });
    }
  }, [supplier]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/partner/inventory/suppliers/${supplier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update supplier");
      
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={!!supplier} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="max-w-2xl rounded-3xl border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Edit Supplier Details</DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Update contact info and business identity for this vendor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Supplier Name *</Label>
              <Input 
                required
                value={formData.name} 
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone</Label>
              <Input 
                value={formData.phone} 
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">GST Number</Label>
              <Input 
                value={formData.gst_number} 
                onChange={(e) => setFormData(p => ({ ...p, gst_number: e.target.value }))}
                className="h-11 rounded-xl bg-muted/30 uppercase" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Address</Label>
            <Textarea 
              value={formData.address} 
              onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
              className="rounded-xl bg-muted/30 min-h-[80px]" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Internal Notes</Label>
            <Textarea 
              value={formData.notes} 
              onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
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
