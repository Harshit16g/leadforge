"use client";

import { useState } from "react";
import { Save, Edit2, Loader2, StickyNote } from "lucide-react";
import { updateLead } from "@/app/actions/leads";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SpecialNotesEditor({ leadId, rawNotes }: { leadId: string, rawNotes: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Safely parse JSON structure
  let parsed = { notes: "", vehicle: "", budget: "", fuel: "", financing: "", location: "" };
  try {
    if (rawNotes && rawNotes.trim().startsWith("{")) {
      parsed = { ...parsed, ...JSON.parse(rawNotes) };
    } else {
      parsed.notes = rawNotes || "";
    }
  } catch (e) {
    parsed.notes = rawNotes || "";
  }

  const [notes, setNotes] = useState(parsed.notes);

  async function handleSave() {
    setLoading(true);
    try {
      const updatedSerialized = JSON.stringify({
        ...parsed,
        notes: notes
      });

      await updateLead(leadId, { notes: updatedSerialized });
      toast.success("Negotiation notes updated successfully");
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update negotiation notes");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between flex-shrink-0 mb-3">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <StickyNote className="size-3.5 text-blue-500 animate-pulse" /> Specific Negotiation Notes
        </h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-[11px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Edit2 className="size-3" /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsEditing(false)}
              disabled={loading}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="text-[11px] font-bold text-emerald-500 hover:text-emerald-600 flex items-center gap-0.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Save className="size-3" />
              )}
              Save
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="flex-1 overflow-y-auto bg-muted/30 p-2.5 rounded-lg border border-border/50 text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap scrollbar-thin min-h-[60px]">
          {notes.trim() ? notes : "No specific negotiation notes or special instructions recorded yet. Click Edit to add details."}
        </div>
      ) : (
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Type specific negotiation instructions, customer demands, or special delivery specifics..."
          disabled={loading}
          className="flex-1 w-full text-xs p-2.5 bg-muted/50 border border-border focus:border-blue-500 focus:bg-card rounded-lg outline-none resize-none leading-relaxed text-foreground transition-all"
        />
      )}
    </div>
  );
}
