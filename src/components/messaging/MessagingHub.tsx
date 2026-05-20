"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { SectionHeader, EmptyState, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-client/client";
import { getAvatarFallbackUrl } from "@/lib/utils/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useMessaging } from "@/contexts/MessagingContext";

interface Thread {
  id: string;
  type: 'booking' | 'contact_request' | 'internal' | 'admin_support';
  lastMessage: string;
  updatedAt: string;
  metadata: {
    title: string;
    booking_id?: string;
    contact_request_id?: string;
    recipient_id?: string;
  };
}

interface Message {
  id: string;
  thread_id: string;
  body: string;
  sender_id: string;
  sender_name?: string;
  created_at: string;
}

function parseAndRenderMessageBody(body: string, isMine: boolean) {
  if (body.includes("sharing the following") && body.includes("View:")) {
    try {
      const lines = body.split("\n");
      const intro = lines[0];
      
      const leadLines = lines.filter(l => l.trim().startsWith("•") && l.includes("View:"));
      const notesLine = lines.find(l => l.startsWith("Additional Notes:"));

      return (
        <div className="space-y-3.5 my-1">
          <p className="text-sm font-bold opacity-90 leading-snug">{intro}</p>
          
          <div className="space-y-2 mt-2">
            {leadLines.map((line, idx) => {
              const match = line.match(/•\s*(.*?)\s*\((.*?)\)\s*-\s*View:\s*(https?:\/\/\S+)/);
              if (match) {
                const name = match[1];
                const phone = match[2];
                const url = match[3];
                const leadId = url.split("/").pop();

                return (
                  <a
                    key={idx}
                    href={`/leads/${leadId}`}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl border transition-all hover:-translate-y-0.5",
                      isMine 
                        ? "bg-white/10 hover:bg-white/15 border-white/10 text-white shadow-inner" 
                        : "bg-muted/40 hover:bg-muted/60 border-border text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0",
                        isMine ? "bg-white/20 text-white" : "bg-blue-500/10 text-blue-500 border border-blue-500/15"
                      )}>
                        👤
                      </div>
                      <div className="flex flex-col text-left min-w-0">
                        <span className="font-extrabold text-xs tracking-wide truncate max-w-[150px]">{name}</span>
                        <span className={cn("text-[10px] font-semibold", isMine ? "text-white/60" : "text-muted-foreground")}>{phone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-sm",
                        isMine ? "bg-white/15 text-white" : "bg-blue-600 text-white"
                      )}>
                        View Profile
                      </span>
                    </div>
                  </a>
                );
              }
              return <p key={idx} className="text-xs leading-relaxed">{line}</p>;
            })}
          </div>

          {notesLine && (
            <div className={cn(
              "p-3 rounded-2xl text-xs mt-3 border shadow-sm",
              isMine 
                ? "bg-white/5 border-white/10 text-white/90" 
                : "bg-amber-500/5 border-amber-500/10 text-foreground/90"
            )}>
              <span className="font-black uppercase tracking-wider text-[9px] text-amber-500 block mb-1">📌 Instructions Notes</span>
              <p className="leading-relaxed font-semibold">{notesLine.replace("Additional Notes:", "").trim()}</p>
            </div>
          )}
        </div>
      );
    } catch (e) {
      // Fallback
    }
  }

  return <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{body}</p>;
}

export function MessagingHub() {
  const { user: currentUser } = useAuth();
  const { markThreadRead } = useMessaging();
  const supabase = createClient();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);

  // Ref to keep selectedThread stable inside subscription callbacks
  const selectedThreadRef = useRef<Thread | null>(null);
  selectedThreadRef.current = selectedThread;

  // Scroll-to-bottom ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // ─── Data fetchers ──────────────────────────────────────────────────────────

  const fetchThreads = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/messages?userId=${currentUser.id}`);
      const { data } = await res.json();
      setThreads(data ?? []);
    } catch {
      toast.error("Failed to load threads");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchMessages = useCallback(async (threadId: string) => {
    setMsgLoading(true);
    try {
      const res = await fetch(`/api/partner/messages/${threadId}`);
      const { data } = await res.json();
      setMessages(data ?? []);
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setMsgLoading(false);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/partner/employees?exclude=${currentUser.id}`);
      const { data } = await res.json();
      setContacts(data ?? []);
    } catch { /* silent */ }
  }, [currentUser]);

  // ─── Initial load ───────────────────────────────────────────────────────────

  useEffect(() => {
    fetchThreads();
    fetchContacts();
  }, [fetchThreads, fetchContacts]);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);
      markThreadRead(selectedThread.id); // Mark as read when thread is opened
    }
  }, [selectedThread, fetchMessages, markThreadRead]);

  // ─── Realtime subscriptions ─────────────────────────────────────────────────

  useEffect(() => {
    if (!currentUser?.id) return;

    /**
     * SUB 1 — "inbox" channel:
     * Listen for any new message where the current user is the recipient.
     * • If the message is in the ACTIVE thread → append it live.
     * • If it's in a DIFFERENT thread → show a toast + refresh thread list.
     */
    const inboxChannel = supabase
      .channel(`inbox:${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "internal_messages",
          filter: `recipient_id=eq.${currentUser.id}`,
        },
        (payload: { new: Message }) => {
          const newMsg = payload.new as Message;
          const activeThread = selectedThreadRef.current;

          if (activeThread && newMsg.thread_id === activeThread.id) {
            // Append directly — no re-fetch needed
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev; // dedupe
              return [...prev, newMsg];
            });
          } else {
            // Out-of-view thread — refresh list + notify
            fetchThreads();
            toast(`💬 New message from a colleague`, {
              description: newMsg.body.slice(0, 60) + (newMsg.body.length > 60 ? "…" : ""),
              duration: 4000,
            });
          }
        }
      )
      .subscribe();

    /**
     * SUB 2 — "sent-echo" channel:
     * Listen for messages WE sent so both browser tabs stay in sync
     * (e.g. Sarah has two tabs open, sends from one, both update).
     */
    const echoChannel = supabase
      .channel(`echo:${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "internal_messages",
          filter: `sender_id=eq.${currentUser.id}`,
        },
        (payload: { new: Message }) => {
          const newMsg = payload.new as Message;
          const activeThread = selectedThreadRef.current;

          if (activeThread && newMsg.thread_id === activeThread.id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev; // dedupe
              return [...prev, newMsg];
            });
            // Also bump thread list preview
            fetchThreads();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inboxChannel);
      supabase.removeChannel(echoChannel);
    };
  }, [currentUser?.id, fetchThreads]);

  // ─── Send ───────────────────────────────────────────────────────────────────

  async function sendMessage() {
    if (!draft.trim() || !selectedThread || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/partner/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: draft.trim(),
          sender_id: currentUser?.id,
          recipient_id: selectedThread.metadata.recipient_id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send");
      setDraft("");
      // Realtime echo subscription handles appending — no manual re-fetch needed
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error sending message");
    } finally {
      setSending(false);
    }
  }

  // ─── New chat ───────────────────────────────────────────────────────────────

  const startInternalChat = (recipientId: string | null, name: string) => {
    setIsNewChatOpen(false);
    if (!currentUser) return;

    const sorted = recipientId
      ? [recipientId, currentUser.id].sort()
      : ["admin", currentUser.id].sort();
    const threadKey = `direct:${sorted[0]}-${sorted[1]}`;

    setSelectedThread({
      id: threadKey,
      type: "internal",
      lastMessage: "",
      updatedAt: new Date().toISOString(),
      metadata: { title: name, recipient_id: recipientId ?? undefined },
    });
    setMessages([]);
  };

  // ─── UI ─────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch flex-1 min-h-0 overflow-hidden">

        {/* ── Sidebar: Threads ─────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-card rounded-3xl border border-border overflow-hidden shadow-sm flex flex-col h-full max-h-full">
          <div className="px-6 py-5 border-b border-border bg-muted/30 flex items-center justify-between">
            <SectionHeader title="Conversations" subtitle={`${threads.length} active threads`} />
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsNewChatOpen(true)} size="xs" className="font-bold rounded-xl shadow-md cursor-pointer active:scale-95 transition-all text-[10px] uppercase tracking-wider py-1.5 px-3">
                <span className="icon-[solar--add-circle-bold-duotone] size-3 mr-1.5" /> New Chat
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={fetchThreads} className="h-8 w-8 rounded-lg cursor-pointer">
                <span className={cn("icon-[solar--refresh-linear] size-3.5", loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-border/50">
            {loading ? (
              <div className="py-20 flex justify-center">
                <span className="icon-[solar--refresh-circle-bold-duotone] animate-spin size-8 text-primary/30" />
              </div>
            ) : threads.length === 0 ? (
              <div className="py-20"><EmptyState title="No messages" icon="solar--chat-square-linear" /></div>
            ) : threads.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedThread(t)}
                className={cn(
                  "px-6 py-5 cursor-pointer transition-all relative group",
                  selectedThread?.id === t.id ? "bg-primary/[0.03]" : "hover:bg-muted/30"
                )}
              >
                {selectedThread?.id === t.id && <div className="absolute left-0 top-0 w-1 h-full bg-primary" />}
                <div className="flex items-start gap-4">
                  <img
                    src={getAvatarFallbackUrl(t.metadata.recipient_id || t.id)}
                    alt={t.metadata.title}
                    className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-inner group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-black truncate uppercase tracking-widest">{t.metadata.title}</p>
                      <span className="text-[9px] font-black text-muted-foreground uppercase">
                        {new Date(t.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2 opacity-80">
                      {t.lastMessage || "Start of conversation..."}
                    </p>
                    <div className="flex items-center gap-2">
                      <StatusBadge status="muted" label="INTERNAL" size="sm" className="h-4 text-[7px]" />
                      <span className="icon-[solar--users-group-rounded-bold-duotone] size-3 text-primary/40" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main: Chat ───────────────────────────────────────────── */}
        <div className="lg:col-span-3 h-full max-h-full overflow-hidden flex flex-col">
          <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm flex flex-col h-full relative">
            {!selectedThread ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center">
                  <span className="icon-[solar--chat-round-line-bold-duotone] size-10 text-muted-foreground/40" />
                </div>
                <EmptyState title="Select a conversation" icon="" description="Choose a thread from the left or start a new internal chat" />
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-8 py-6 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-5">
                    <img
                      src={getAvatarFallbackUrl(selectedThread.metadata.recipient_id || selectedThread.id)}
                      alt={selectedThread.metadata.title}
                      className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-primary/20 animate-in zoom-in-50 duration-300"
                    />
                    <div>
                      <h3 className="text-lg font-black text-foreground uppercase tracking-widest">
                        {selectedThread.metadata.title}
                      </h3>
                      {/* Live indicator */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight">Live</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl border border-border/40">
                    <span className="icon-[solar--info-circle-linear] size-5" />
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
                  {msgLoading ? (
                    <div className="flex justify-center py-20">
                      <span className="icon-[solar--refresh-circle-bold-duotone] animate-spin size-6 text-primary/30" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-4 opacity-30">
                      <span className="icon-[solar--letter-unread-bold-duotone] size-12" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Start of a secure conversation</p>
                    </div>
                  ) : messages.map((m) => {
                    const isMine = m.sender_id === currentUser?.id;
                    return (
                      <div key={m.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                        {!isMine && (
                          <img
                            src={getAvatarFallbackUrl(m.sender_id)}
                            className="w-7 h-7 rounded-full mr-2 mt-1 shrink-0 self-end"
                            alt=""
                          />
                        )}
                        <div className={cn(
                          "max-w-[75%] rounded-2xl px-5 py-3.5 border shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200",
                          isMine
                            ? "bg-primary text-primary-foreground border-primary rounded-tr-none"
                            : "bg-card text-foreground border-border rounded-tl-none"
                        )}>
                          {parseAndRenderMessageBody(m.body, isMine)}
                          <div className={cn("mt-1.5 flex items-center gap-1.5 opacity-60", isMine ? "justify-end" : "justify-start")}>
                            <span className="text-[9px] font-black uppercase tracking-tighter">
                              {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                            </span>
                            {isMine && <span className="icon-[solar--check-read-linear] size-3" />}
                          </div>
                        </div>
                        {isMine && (
                          <img
                            src={getAvatarFallbackUrl(currentUser.id)}
                            className="w-7 h-7 rounded-full ml-2 mt-1 shrink-0 self-end"
                            alt=""
                          />
                        )}
                      </div>
                    );
                  })}
                  {/* Auto-scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <div className="p-6 border-t border-border bg-muted/10 shrink-0">
                  <div className="flex gap-3 items-end">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Write your message… (Enter to send)"
                      className="flex-1 bg-background border border-border rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all h-24 shadow-inner"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!draft.trim() || sending}
                      className="h-12 w-12 rounded-2xl shadow-xl shadow-primary/30 shrink-0 bg-primary hover:scale-105 active:scale-95 transition-all"
                    >
                      {sending
                        ? <span className="icon-[solar--refresh-linear] animate-spin size-5" />
                        : <span className="icon-[solar--plain-2-bold-duotone] size-5" />
                      }
                    </Button>
                  </div>
                  <p className="mt-2 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center opacity-50">
                    Enter to send • Shift+Enter for new line • End-to-end encrypted
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── New Chat Modal ────────────────────────────────────────── */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsNewChatOpen(false)} />
          <div className="relative bg-card rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-border/50 animate-in zoom-in-95 duration-300">
            <div className="p-10 bg-muted/30 border-b border-border">
              <h2 className="text-2xl font-black uppercase tracking-widest text-foreground">Start New Chat</h2>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Select an internal contact to begin</p>
            </div>

            <div className="p-6 max-h-[400px] overflow-y-auto no-scrollbar space-y-2">
              <p className="px-4 py-2 text-[10px] font-black text-primary uppercase tracking-[0.3em]">Organization Contacts</p>
              {contacts.length === 0 ? (
                <p className="p-8 text-center text-xs font-bold text-muted-foreground uppercase">No contacts found</p>
              ) : contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => startInternalChat(c.id, c.name)}
                  className="w-full flex items-center gap-5 px-6 py-4 rounded-3xl hover:bg-primary/[0.03] transition-all group border border-transparent hover:border-primary/10"
                >
                  <img
                    src={getAvatarFallbackUrl(c.id)}
                    alt={c.name}
                    className="w-12 h-12 rounded-2xl object-cover shadow-md shadow-primary/20 group-hover:scale-110 transition-transform"
                  />
                  <div className="text-left flex-1">
                    <p className="text-sm font-black uppercase tracking-widest group-hover:text-primary transition-colors">{c.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight opacity-70">{c.role || "Staff"}</p>
                  </div>
                  <span className="icon-[solar--chat-round-dots-bold-duotone] text-primary/40 group-hover:text-primary transition-all size-6" />
                </button>
              ))}
            </div>

            <div className="p-8 bg-muted/30 border-t border-border flex justify-between items-center">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">End-to-end encrypted</p>
              <Button variant="ghost" onClick={() => setIsNewChatOpen(false)} className="font-black uppercase tracking-[0.2em] text-[10px] h-10 px-6 rounded-xl hover:bg-muted">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
