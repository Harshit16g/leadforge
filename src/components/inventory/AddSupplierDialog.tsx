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
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/common";

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddSupplierDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: AddSupplierDialogProps) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/partner/inventory/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add supplier");
      
      onSuccess();
      onOpenChange(false);
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        gst_number: "",
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
          <DialogTitle className="text-xl font-black">Register New Supplier</DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Add a new vendor or source to your supply chain database.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Company / Supplier Name *</Label>
              <Input 
                required
                value={formData.name} 
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Acme Cosmetics Pvt Ltd"
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Contact Phone</Label>
              <Input 
                value={formData.phone} 
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                placeholder="+91 ..."
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Contact Email</Label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="vendor@example.com"
                className="h-11 rounded-xl bg-muted/30" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">GST Number</Label>
              <Input 
                value={formData.gst_number} 
                onChange={(e) => setFormData(p => ({ ...p, gst_number: e.target.value }))}
                placeholder="22AAAAA0000A1Z5"
                className="h-11 rounded-xl bg-muted/30 uppercase" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Office Address</Label>
            <Textarea 
              value={formData.address} 
              onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
              placeholder="Full mailing address..."
              className="rounded-xl bg-muted/30 min-h-[80px]" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Internal Notes</Label>
            <Textarea 
              value={formData.notes} 
              onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
              placeholder="Payment terms, lead times, key contact person..."
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
              disabled={submitting || !formData.name}
              className="h-11 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 px-8"
            >
              {submitting ? <LoadingSpinner className="size-4" /> : "Register Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
