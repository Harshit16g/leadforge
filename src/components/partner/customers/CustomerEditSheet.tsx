"use client";

import { useState, useEffect } from "react";
import { useCustomerDetail } from "@/hooks/usePartnerApi";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CustomerEditSheetProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CustomerEditSheet({
  customerId,
  open,
  onOpenChange,
  onSuccess,
}: CustomerEditSheetProps) {
  const router = useRouter();
  const { data: customer, loading: fetchLoading, refetch } = useCustomerDetail(customerId);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "",
    birthday: "",
    anniversary: "",
    customer_type: "walk_in",
    notes: "",
    wa_consent: "pending",
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        gender: customer.gender || "",
        birthday: customer.birthday || "",
        anniversary: customer.anniversary || "",
        customer_type: customer.customer_type || "walk_in",
        notes: customer.notes || "",
        wa_consent: customer.wa_consent || "pending",
      });
    }
  }, [customer]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSave() {
    if (!formData.name || !formData.phone) {
      toast.error("Name and phone are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/partner/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          email: formData.email || null,
          gender: formData.gender || null,
          birthday: formData.birthday || null,
          anniversary: formData.anniversary || null,
          notes: formData.notes || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update customer");

      toast.success("Customer profile updated");
      onSuccess?.();
      onOpenChange(false);
      // If we are on the dedicated edit page, we might want to navigate back
      if (window.location.pathname.endsWith("/edit")) {
        router.back();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-xl mx-auto rounded-t-3xl border-x border-t border-border bg-card">
        <DrawerHeader className="px-6 pt-6">
          <DrawerTitle className="text-xl font-black tracking-tight">Edit Customer Profile</DrawerTitle>
          <DrawerDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Update contact details, demographics, and milestone dates.
          </DrawerDescription>
        </DrawerHeader>

        {fetchLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <span className="icon-[solar--refresh-circle-bold-duotone] animate-spin size-8 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Retreiving Profile</span>
          </div>
        ) : (
          <div className="px-6 py-4 space-y-6 overflow-y-auto max-h-[60vh] scrollbar-none">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone Number *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-11 rounded-xl tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
              <Input
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="rahul@example.com"
                className="h-11 rounded-xl"
              />
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gender</Label>
                <Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer Type</Label>
                <Select value={formData.customer_type} onValueChange={(v) => handleChange("customer_type", v)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk_in">Walk-in</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="subscriber">Subscriber</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Birthday</Label>
                <Input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => handleChange("birthday", e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Anniversary</Label>
                <Input
                  type="date"
                  value={formData.anniversary}
                  onChange={(e) => handleChange("anniversary", e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {/* WhatsApp Consent */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">WhatsApp Communication</Label>
              <div className="flex gap-2">
                {["opted_in", "pending", "opted_out"].map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant={formData.wa_consent === c ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChange("wa_consent", c)}
                    className="h-10 flex-1 font-bold text-[10px] rounded-xl capitalize tracking-widest"
                  >
                    {c.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Internal Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Add any specific preferences or history notes..."
                className="rounded-2xl resize-none min-h-[100px]"
              />
            </div>
          </div>
        )}

        <DrawerFooter className="px-6 pb-8 pt-2">
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl font-bold">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || fetchLoading}
              className="flex-[2] rounded-xl font-bold bg-primary shadow-lg shadow-primary/20"
            >
              {saving && <span className="icon-[solar--refresh-circle-bold-duotone] animate-spin mr-2 size-4" />}
              Save Changes
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
