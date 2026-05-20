"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase-client/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { HubRole } from "@/models/crm/booking-hub.model";

interface ChatMessage {
  id: string;
  direction: "inbound" | "outbound";
  sender_role: string;
  body: string;
  channel: "wa" | "in_app" | "sms" | "email";
  delivery_status: string;
  created_at: string;
}

interface BookingChatThreadProps {
  bookingId: string;
  orgId: string;
  role: HubRole;
  canSend?: boolean;
  branchName?: string | null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const statusIcon: Record<string, string> = {
  pending: "icon-[solar--clock-circle-linear]",
  sent: "icon-[solar--check-read-linear]",
  delivered: "icon-[solar--check-read-linear]",
  read: "icon-[solar--check-read-bold]",
  failed: "icon-[solar--close-circle-linear]",
};

const channelBadge: Record<string, string> = {
  wa: "WhatsApp",
  in_app: "In-Hub",
};

function apiPath(role: HubRole, bookingId: string): string {
  if (role === "customer") return `/api/customer/bookings/${bookingId}/chat`;
  if (role === "employee") return `/api/employee/bookings/${bookingId}/chat`;
  return `/api/partner/bookings/${bookingId}/chat`;
}

export function BookingChatThread({ bookingId, orgId, role, canSend = true, branchName }: BookingChatThreadProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const path = apiPath(role, bookingId);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(path);
    if (res.ok) {
      const { data } = await res.json();
      setMessages(data ?? []);
    }
    setLoading(false);
  }, [path]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Supabase Realtime — new messages on comms.messages for this booking
  useEffect(() => {
    const channel = supabase
      .channel(`booking-chat:${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "comms",
          table: "messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload: { new: ChatMessage }) => {
          const msg = payload.new;
          setMessages(prev =>
            prev.some(m => m.id === msg.id) ? prev : [...prev, msg]
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [bookingId, supabase]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!draft.trim() || sending) return;
    setSending(true);
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
      direction: "outbound",
      sender_role: role,
      body: draft.trim(),
      channel: "in_app",
      delivery_status: "pending",
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setDraft("");

    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: optimistic.body }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      // Realtime will deliver the confirmed message; remove optimistic
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === optimisticId ? { ...m, delivery_status: "failed" } : m
      ));
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  // Group messages by day
  const grouped: { day: string; msgs: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const day = formatDay(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last?.day === day) last.msgs.push(msg);
    else grouped.push({ day, msgs: [msg] });
  }

  const isMine = (msg: ChatMessage) => {
    if (role === "customer") return msg.direction === "inbound";
    return msg.direction === "outbound";
  };

  return (
    <div className="rounded-2xl bg-card border border-border shadow-sm flex flex-col overflow-hidden" style={{ minHeight: 320, maxHeight: 560 }}>
      {/* Header */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0">
        <p className="text-sm font-semibold text-foreground">Messages</p>
        <span className="text-xs text-muted-foreground">In-hub only — not synced to WhatsApp</span>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {loading && <p className="text-xs text-muted-foreground text-center py-6">Loading…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No messages yet.</p>
        )}

        {grouped.map(({ day, msgs }) => (
          <div key={day}>
            {/* Day divider */}
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground font-medium px-2">{day}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {msgs.map(msg => {
              const mine = isMine(msg);
              const isWa = msg.channel === "wa";

              return (
                <div key={msg.id} className={cn("flex mb-3", mine ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm border transition-all",
                    mine
                      ? "bg-primary text-primary-foreground border-primary rounded-tr-none"
                      : "bg-background text-foreground border-border rounded-tl-none"
                  )}>
                    {/* Sender label for staff messages visible to others */}
                    {!mine && (
                      <p className="text-[10px] font-bold opacity-80 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className={cn(
                          "size-1.5 rounded-full",
                          msg.direction === "inbound" ? "bg-blue-400" : "bg-emerald-400"
                        )} />
                        {role === "customer" && msg.direction === "outbound" && branchName ? branchName : msg.sender_role}
                      </p>
                    )}
                    {/* WA origin badge */}
                    {isWa && !mine && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 mb-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        <span className="icon-[solar--chat-square-like-linear] size-3" />
                        {channelBadge.wa}
                      </span>
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                    <div className={cn("flex items-center gap-1.5 mt-1.5", mine ? "justify-end" : "justify-start")}>
                      <span className="text-[9px] opacity-60 font-medium">{formatTime(msg.created_at)}</span>
                      {mine && (
                        <span className={cn(
                          statusIcon[msg.delivery_status] ?? statusIcon.pending,
                          "size-3 opacity-80",
                          msg.delivery_status === "failed" && "text-destructive opacity-100"
                        )} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      {canSend && (
        <div className="border-t border-border px-4 py-3 flex gap-2 items-end shrink-0">
          <Textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            className="text-sm resize-none flex-1 min-h-[40px] max-h-[120px]"
            rows={1}
          />
          <Button size="sm" onClick={send} disabled={sending || !draft.trim()} className="shrink-0">
            <span className="icon-[solar--plain-2-bold-duotone] size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
