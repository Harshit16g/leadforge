"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, AlertOctagon, RefreshCw, Loader2, Check } from "lucide-react";
import { updateLead } from "@/app/actions/leads";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const STAGES = ["new", "contacted", "qualified", "negotiation", "converted", "completed"];

export function LeadStageControl({ leadId, currentStatus }: { leadId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isLost = currentStatus === "lost";
  
  const currentIndex = STAGES.indexOf(currentStatus);

  async function handleStatusChange(newStatus: string) {
    setLoading(true);
    try {
      await updateLead(leadId, { status: newStatus });
      toast.success(`Pipeline updated: Lead is now in ${newStatus.toUpperCase()} stage`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update pipeline stage");
    } finally {
      setLoading(false);
    }
  }

  const canGoBackward = currentIndex > 0 && !isLost;
  const canGoForward = currentIndex < STAGES.length - 1 && currentIndex !== -1 && !isLost;

  return (
    <div className="flex items-center gap-2 bg-muted/30 border border-border p-1.5 rounded-xl shadow-inner">
      {/* Move Backward */}
      <button
        onClick={() => canGoBackward && handleStatusChange(STAGES[currentIndex - 1])}
        disabled={loading || !canGoBackward}
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border transition-all disabled:opacity-30 disabled:pointer-events-none"
        )}
        title="Move Stage Backward"
      >
        <ChevronLeft className="size-4" />
      </button>
 
      {/* Current Stage Pill */}
      <div className="px-3 h-8 flex items-center justify-center bg-card border border-border rounded-lg shadow-sm">
        {loading ? (
          <Loader2 className="size-3.5 animate-spin text-blue-500" />
        ) : (
          <span className={cn(
            "text-xs font-bold uppercase tracking-wider",
            isLost ? "text-rose-500" : currentStatus === "completed" ? "text-purple-600 dark:text-purple-400" : currentStatus === "converted" ? "text-emerald-500" : "text-blue-500"
          )}>
            Stage: {currentStatus}
          </span>
        )}
      </div>
 
      {/* Move Forward */}
      <button
        onClick={() => canGoForward && handleStatusChange(STAGES[currentIndex + 1])}
        disabled={loading || !canGoForward}
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border transition-all disabled:opacity-30 disabled:pointer-events-none"
        )}
        title="Move Stage Forward"
      >
        <ChevronRight className="size-4" />
      </button>
 
      <div className="w-px h-5 bg-border mx-1" />
 
      {/* Mark Lost / Reactivate */}
      {isLost ? (
        <button
          onClick={() => handleStatusChange("contacted")}
          disabled={loading}
          className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
        >
          <RefreshCw className="size-3" /> Reactivate
        </button>
      ) : (
        <button
          onClick={() => handleStatusChange("lost")}
          disabled={loading || currentStatus === "converted" || currentStatus === "completed"}
          className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-all disabled:opacity-30"
        >
          <AlertOctagon className="size-3" /> Mark Lost
        </button>
      )}
    </div>
  );
}
