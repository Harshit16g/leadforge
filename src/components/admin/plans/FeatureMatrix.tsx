"use client";

import { useState, useEffect } from "react";
import { FEATURE_CATALOG } from "@/lib/billing/features";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function FeatureMatrix() {
  const [data, setData] = useState<{ plans: any[], features: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plans/features");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const handleToggle = async (planId: string, featureKey: string, currentEnabled: boolean) => {
    const key = `${planId}-${featureKey}`;
    setSaving(key);
    try {
      const res = await fetch("/api/admin/plans/features", {
        method: "POST",
        body: JSON.stringify({ planId, featureKey, enabled: !currentEnabled }),
      });
      if (!res.ok) throw new Error();
      toast.success("Feature updated");
      fetchMatrix();
    } catch (e) {
      toast.error("Failed to update feature");
    } finally {
      setSaving(null);
    }
  };

  const handleLimitUpdate = async (planId: string, featureKey: string, value: string) => {
    const key = `${planId}-${featureKey}-limit`;
    setSaving(key);
    try {
      const res = await fetch("/api/admin/plans/features", {
        method: "POST",
        body: JSON.stringify({ planId, featureKey, limitValue: parseInt(value) || 0, enabled: true }),
      });
      if (!res.ok) throw new Error();
      toast.success("Limit updated");
      fetchMatrix();
    } catch (e) {
      toast.error("Failed to update limit");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="py-20 text-center animate-pulse">Loading Matrix...</div>;

  return (
    <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground w-1/3">Feature / Capability</th>
              {data?.plans.map(p => (
                <th key={p.id} className="px-6 py-4 text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-foreground">{p.display_name}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-tight">{p.plan_key}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {FEATURE_CATALOG.map(f => (
              <tr key={f.key} className="hover:bg-muted/10 transition-colors">
                <td className="px-6 py-5">
                  <p className="text-sm font-bold text-foreground">{f.name}</p>
                  <p className="text-[10px] font-medium text-muted-foreground">{f.description}</p>
                </td>
                {data?.plans.map(p => {
                  const feature = data.features.find(feat => feat.plan_id === p.id && feat.feature_key === f.key);
                  const isSaving = saving === `${p.id}-${f.key}` || saving === `${p.id}-${f.key}-limit`;
                  
                  return (
                    <td key={p.id} className="px-6 py-5">
                      <div className="flex flex-col items-center gap-3">
                        <Switch 
                          checked={feature?.enabled || false} 
                          disabled={isSaving}
                          onCheckedChange={() => handleToggle(p.id, f.key, feature?.enabled || false)}
                        />
                        {'isLimit' in f && f.isLimit && (
                          <div className="w-16">
                            <Input 
                              type="number" 
                              className="h-7 text-[10px] font-bold text-center p-0 rounded-lg" 
                              defaultValue={feature?.limit_value || 0}
                              onBlur={(e) => handleLimitUpdate(p.id, f.key, e.target.value)}
                              disabled={isSaving}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
