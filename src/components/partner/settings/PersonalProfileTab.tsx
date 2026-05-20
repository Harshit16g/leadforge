"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ManagedAvatar } from "@/components/common/ManagedAvatar";
import { createClient } from "@/lib/supabase-client/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
  name: string;
  email: string;
  phone: string;
  initialAvatarUrl?: string | null;
  highlight?: string | null;
}

export function PersonalProfileTab({ userId, name: initName, email, phone, initialAvatarUrl, highlight }: Props) {
  const [name, setName] = useState(initName);
  const [gender, setGender] = useState("unspecified");
  const [saving, setSaving] = useState(false);
  const db = createClient();

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data, error } = await db
          .from("profiles")
          .select("gender")
          .eq("id", userId)
          .single();
        if (data && data.gender) {
          setGender(data.gender);
        }
      } catch (e) {
        console.error("Failed to load gender:", e);
      }
    }
    if (userId) loadProfile();
  }, [userId]);

  async function save() {
    setSaving(true);
    try {
      // 1. Update basic profile fields via complete-profile route
      const res = await fetch("/api/auth/complete-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Save failed");

      // 2. Update gender directly in database
      const { error: genderErr } = await db
        .from("profiles")
        .update({ gender })
        .eq("id", userId);
      
      if (genderErr) throw genderErr;

      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <div className="flex items-center gap-6 p-6 rounded-2xl bg-muted/30 border border-border">
        <ManagedAvatar userId={userId} name={name || "Partner"} initialUrl={initialAvatarUrl} editable className="w-20 h-20 rounded-2xl" />
        <div>
          <p className="text-sm font-bold text-foreground">Profile Photo</p>
          <p className="text-xs text-muted-foreground mt-0.5">Click the photo to choose from public avatars or upload custom ones.</p>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          className="h-12 rounded-xl font-semibold"
        />
      </div>

      {/* Gender Selector */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gender</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "male", label: "Male", icon: "icon-[solar--lightning-bold-duotone]" },
            { id: "female", label: "Female", icon: "icon-[solar--hearts-bold-duotone]" },
            { id: "unspecified", label: "Rather not say", icon: "icon-[solar--shield-user-bold-duotone]" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setGender(item.id)}
              className={cn(
                "flex items-center justify-center gap-2 h-12 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer",
                gender === item.id
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                  : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className={cn(item.icon, "size-4")} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Email — read-only */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 icon-[solar--letter-bold-duotone] size-4 text-muted-foreground/50" />
          <Input
            value={email}
            readOnly
            className="h-12 rounded-xl pl-10 font-semibold bg-muted/30 cursor-not-allowed text-muted-foreground"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 icon-[solar--lock-bold-duotone] size-4 text-muted-foreground/50" />
        </div>
        <p className="text-[10px] text-muted-foreground/60 font-medium">Email is your login credential — contact admin to change.</p>
      </div>

      {/* Phone — locked, requires admin verification */}
      <div className="space-y-2 relative">
        {highlight === "contact_phone" && (
          <span className="absolute -inset-2 rounded-2xl ring-2 ring-primary animate-pulse pointer-events-none z-10" />
        )}
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Registered Phone</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 icon-[solar--phone-bold-duotone] size-4 text-muted-foreground/50" />
          <Input
            value={phone}
            readOnly
            className="h-12 rounded-xl pl-10 font-semibold bg-muted/30 cursor-not-allowed text-muted-foreground"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 icon-[solar--lock-bold-duotone] size-4 text-amber-500" />
        </div>
        <div className="flex items-center gap-2 px-1">
          <span className="icon-[solar--shield-warning-bold-duotone] size-3.5 text-amber-500" />
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
            Phone is locked after registration. Contact your Leaex admin to update.
          </p>
        </div>
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button onClick={save} disabled={saving} className="rounded-xl px-8 font-black text-xs uppercase tracking-widest h-12">
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
