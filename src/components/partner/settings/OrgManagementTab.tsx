"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Branch {
  id: string;
  name: string;
  city: string;
  state: string;
  status: string;
  is_primary: boolean;
  contact_phone: string;
  primary_manager_id: string | null;
}

interface StaffMember {
  id: string;
  name: string;
  employment_type: string;
  phone: string | null;
}

interface Props {
  orgId: string;
  isOwner: boolean;
}

export function OrgManagementTab({ orgId, isOwner }: Props) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff]       = useState<StaffMember[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/partner/settings").then((r) => r.json()),
      fetch("/api/partner/staff?active_only=true").then((r) => r.json()),
    ]).then(([settings, team]) => {
      setBranches(settings.data?.branches ?? []);
      setStaff(team.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <span className="icon-[solar--lock-bold-duotone] size-12 text-muted-foreground/40" />
        <p className="text-sm font-bold text-muted-foreground">Organisation management is restricted to the business owner.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Branches */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Branch Network</p>
            <p className="text-xs text-muted-foreground mt-0.5">{branches.length} branch{branches.length !== 1 ? "es" : ""} under this organisation</p>
          </div>
          <Link href="/partner/branches/new">
            <Button size="sm" variant="outline" className="rounded-xl font-bold text-xs gap-2">
              <span className="icon-[solar--add-circle-bold-duotone] size-4" />
              Add Branch
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          {branches.map((b) => (
            <div key={b.id} className={cn(
              "flex items-center justify-between p-4 rounded-2xl border transition-all",
              b.is_primary ? "border-primary/30 bg-primary/5" : "border-border bg-card"
            )}>
              <div className="flex items-center gap-4">
                <div className={cn("size-10 rounded-xl flex items-center justify-center font-black text-[10px]",
                  b.is_primary ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {b.is_primary ? "HQ" : "BR"}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground flex items-center gap-2">
                    {b.name}
                    {b.is_primary && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">Primary</span>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">{[b.city, b.state].filter(Boolean).join(", ") || "Address not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-[9px] font-black uppercase px-2.5 py-1 rounded-full",
                  b.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                )}>
                  {b.status}
                </span>
                <Link href={`/partner/branches/${b.id}`}>
                  <Button size="sm" variant="ghost" className="rounded-xl h-8 text-xs font-bold">
                    Manage
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Staff overview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Staff Members</p>
            <p className="text-xs text-muted-foreground mt-0.5">{staff.length} active staff across all branches</p>
          </div>
          <Link href="/partner/team">
            <Button size="sm" variant="outline" className="rounded-xl font-bold text-xs gap-2">
              <span className="icon-[solar--users-group-rounded-bold-duotone] size-4" />
              Manage Team
            </Button>
          </Link>
        </div>
        {staff.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-3 rounded-2xl border border-dashed border-border bg-muted/20">
            <span className="icon-[solar--users-group-rounded-bold-duotone] size-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground font-medium">No staff members added yet</p>
            <Link href="/partner/team">
              <Button size="sm" className="rounded-xl font-bold text-xs">Add First Staff Member</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {staff.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium capitalize">{s.employment_type}</p>
                </div>
              </div>
            ))}
            {staff.length > 6 && (
              <Link href="/partner/team" className="flex items-center justify-center p-3 rounded-xl border-2 border-dashed border-border text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                +{staff.length - 6} more →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quick Actions</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Manage Services",     icon: "solar--scissors-bold-duotone",              href: "/partner/services" },
            { label: "View Payroll",        icon: "solar--wallet-money-bold-duotone",           href: "/partner/payroll" },
            { label: "Roster & Schedule",   icon: "solar--calendar-mark-bold-duotone",          href: "/partner/scheduler" },
            { label: "WhatsApp Instance",   icon: "solar--chat-round-like-bold-duotone",        href: "/partner/whatsapp" },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all group">
              <span className={cn(`icon-[${item.icon}] size-5 text-muted-foreground group-hover:text-primary transition-colors`)} />
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
