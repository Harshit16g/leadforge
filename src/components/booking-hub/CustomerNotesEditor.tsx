"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Note {
  id: string;
  body: string;
  created_at: string;
}

interface CustomerNotesEditorProps {
  bookingId: string;
  bookingStatus: string;
}

const LOCKED_STATUSES = ["completed", "cancelled", "no_show"];

export function CustomerNotesEditor({ bookingId, bookingStatus }: CustomerNotesEditorProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const locked = LOCKED_STATUSES.includes(bookingStatus);

  useEffect(() => {
    fetch(`/api/customer/bookings/${bookingId}/notes`)
      .then(r => r.json())
      .then(d => setNotes(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingId]);

  async function save() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/customer/bookings/${bookingId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft.trim(), category: "general" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed");
      
      const newNote = {
        ...result.data,
        body: draft.trim(),
        category: "general"
      };
      setNotes(prev => [...prev, newNote as Note]);
      setDraft("");
      toast.success("Note saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  async function remove(noteId: string) {
    try {
      const res = await fetch(`/api/customer/bookings/${bookingId}/notes/${noteId}`, { method: "DELETE" });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? "Failed");
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete note");
    }
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4 shadow-sm">
      <p className="text-sm font-semibold text-foreground">Your Notes</p>

      {loading && <p className="text-xs text-muted-foreground">Loading…</p>}

      {notes.map(note => (
        <div key={note.id} className="flex items-start justify-between gap-3 group">
          <p className="text-sm text-foreground flex-1">{note.body}</p>
          {!locked && (
            <button
              onClick={() => remove(note.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
              aria-label="Delete note"
            >
              <span className="icon-[solar--trash-bin-minimalistic-linear] size-4" />
            </button>
          )}
        </div>
      ))}

      {locked ? (
        <p className="text-xs text-muted-foreground">Notes are locked after the appointment ends.</p>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Add a note for the salon (allergies, preferences…)"
            className="text-sm resize-none"
            rows={3}
          />
          <Button size="sm" onClick={save} disabled={saving || !draft.trim()} className="w-full sm:w-auto">
            {saving ? "Saving…" : "Save Note"}
          </Button>
        </div>
      )}
    </div>
  );
}
