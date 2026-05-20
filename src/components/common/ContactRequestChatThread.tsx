"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase-client/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SectionHeader } from "./SectionHeader";

interface ChatMessage {
  id: string;
  direction: "inbound" | "outbound";
  sender_role: string;
  body: string;
  channel: "wa" | "in_app" | "sms" | "email";
  delivery_status: string;
  created_at: string;
}

interface ContactRequestChatThreadProps {
  requestId: string;
  orgId: string;
  canSend?: boolean;
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

export function ContactRequestChatThread({ requestId, orgId, canSend = true }: ContactRequestChatThreadProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/partner/contact-requests/${requestId}/messages`);
    if (res.ok) {
      const { data } = await res.json();
      setMessages(data ?? []);
    }
    setLoading(false);
  }, [requestId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`contact-chat:${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "comms",
          table: "messages",
          filter: `contact_request_id=eq.${requestId}`,
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
  }, [requestId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!draft.trim() || sending) return;
    setSending(true);
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
      direction: "inbound",
      sender_role: "partner",
      body: draft.trim(),
      channel: "in_app",
      delivery_status: "delivered",
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setDraft("");

    try {
      const res = await fetch(`/api/partner/contact-requests/${requestId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: optimistic.body }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
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

  const grouped: { day: string; msgs: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const day = formatDay(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last?.day === day) last.msgs.push(msg);
    else grouped.push({ day, msgs: [msg] });
  }

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-40">
             <span className="icon-[solar--refresh-circle-bold-duotone] animate-spin size-8" />
             <p className="text-[10px] font-black uppercase tracking-widest">Hydrating Thread</p>
          </div>
        )}
        
        {grouped.map(({ day, msgs }) => (
          <div key={day} className="space-y-4">
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border/40" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{day}</span>
              <div className="flex-1 h-px bg-border/40" />
            </div>

            {msgs.map(msg => {
              const isMine = msg.sender_role === 'partner';
              return (
                <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-5 py-3 shadow-sm border transition-all animate-in fade-in slide-in-from-bottom-2",
                    isMine
                      ? "bg-primary text-primary-foreground border-primary rounded-tr-none"
                      : "bg-muted/50 text-foreground border-border rounded-tl-none"
                  )}>
                    {!isMine && (
                      <p className="text-[9px] font-black opacity-60 mb-1 flex items-center gap-2 uppercase tracking-[0.1em]">
                        <span className="icon-[solar--shield-user-bold-duotone] size-3" />
                        Admin Support
                      </p>
                    )}
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                    <div className={cn("flex items-center gap-2 mt-2", isMine ? "justify-end" : "justify-start")}>
                      <span className="text-[9px] opacity-60 font-black">{formatTime(msg.created_at)}</span>
                      {isMine && msg.delivery_status === 'failed' && (
                        <span className="icon-[solar--danger-circle-bold] size-3 text-destructive" />
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

      {canSend && (
        <div className="pt-6 mt-auto border-t border-dashed border-border">
          <SectionHeader title="Operational Response" subtitle="Message Admin Support" />
          <div className="mt-4 relative group">
            <Textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder="Draft your professional reply below…"
              className="w-full rounded-2xl bg-muted/20 border border-border p-6 pr-20 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
              rows={3}
            />
            <Button 
              onClick={send} 
              disabled={sending || !draft.trim()}
              className="absolute bottom-4 right-4 h-10 w-10 rounded-xl shadow-lg shadow-primary/20 bg-primary text-white"
            >
              {sending ? (
                <span className="icon-[solar--refresh-linear] size-4 animate-spin" />
              ) : (
                <span className="icon-[solar--plain-2-bold-duotone] size-4" />
              )}
            </Button>
          </div>
          <p className="mt-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center opacity-60">
            Press Enter to dispatch message • Shift + Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}
