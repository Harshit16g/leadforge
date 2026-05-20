"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { HubRole } from "@/models/crm/booking-hub.model";

interface Annotation {
  id: string;
  stream: "internal" | "customer";
  category: string;
  body: string;
  author_role: string;
  author_id: string;
  created_at: string;
}

interface InternalAnnotationsPanelProps {
  bookingId: string;
  role: HubRole;
  actorId?: string;
  stream?: "internal" | "customer" | "all";
}

const CATEGORIES = [
  { value: "allergy",      label: "Allergy" },
  { value: "service_note", label: "Service Note" },
  { value: "staff_note",   label: "Staff Note" },
  { value: "product_used", label: "Product Used" },
  { value: "general",      label: "General" },
];

const basePath = (role: HubRole) =>
  role === "employee"
    ? "employee"
    : role === "partner" || role === "admin"
    ? "partner"
    : null;

export function InternalAnnotationsPanel({
  bookingId,
  role,
  actorId,
  stream = "internal",
}: InternalAnnotationsPanelProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [saving, setSaving] = useState(false);

  const apiBase = basePath(role);

  useEffect(() => {
    if (!apiBase) return;
    fetch(`/api/${apiBase}/bookings/${bookingId}/annotations?stream=${stream}`)
      .then(r => r.json())
      .then(d => setAnnotations(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingId, apiBase, stream]);

  async function save() {
    if (!body.trim() || !apiBase) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/${apiBase}/bookings/${bookingId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stream: "internal", category, body: body.trim() }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed");
      
      const newNote = {
        ...result.data,
        body: body.trim(),
        category: category,
        author_role: role,
        author_id: actorId,
        stream: "internal",
      };
      setAnnotations(prev => [...prev, newNote as Annotation]);
      setBody("");
      toast.success("Note added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(annotationId: string) {
    if (!apiBase) return;
    try {
      const res = await fetch(`/api/${apiBase}/bookings/${bookingId}/annotations/${annotationId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setAnnotations(prev => prev.filter(a => a.id !== annotationId));
    } catch {
      toast.error("Could not delete note");
    }
  }

  const canDelete = (a: Annotation) =>
    role === "admin" ||
    (role === "partner") ||
    (role === "employee" && a.author_id === actorId);

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4 shadow-sm">
      <p className="text-sm font-semibold text-foreground">Internal Notes</p>

      {loading && <p className="text-xs text-muted-foreground">Loading…</p>}

      {annotations.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground">No internal notes yet.</p>
      )}

      {annotations.map(a => {
        const isRecent = Date.now() - new Date(a.created_at).getTime() < 86_400_000;
        return (
          <div key={a.id} className="flex items-start justify-between gap-3 group">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-muted-foreground capitalize">{(a.category ?? "general").replace("_", " ")}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground capitalize">{a.author_role}</span>
                {isRecent && (
                  <span className="text-[10px] font-medium bg-[var(--status-info-bg)] text-[var(--status-info-text)] px-1.5 py-0.5 rounded-full">New</span>
                )}
              </div>
              <p className="text-sm text-foreground">{a.body}</p>
            </div>
            {canDelete(a) && (
              <button
                onClick={() => remove(a.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                aria-label="Delete"
              >
                <span className="icon-[solar--trash-bin-minimalistic-linear] size-4" />
              </button>
            )}
          </div>
        );
      })}

      {/* Add note form */}
      <div className="border-t border-border pt-4 space-y-2">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Add internal note…"
          className="text-sm resize-none"
          rows={2}
        />
        <Button size="sm" onClick={save} disabled={saving || !body.trim()}>
          {saving ? "Saving…" : "Add Note"}
        </Button>
      </div>
    </div>
  );
}
