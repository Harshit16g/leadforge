"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { createClient } from "@/lib/supabase-client/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getAvatarFallbackUrl } from "@/lib/utils/avatar";
import { REP_MAP } from "@/lib/constants/reps";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationContextType {
  unreadCount: number;
  markThreadRead: (threadId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  markThreadRead: async () => {},
});

export const useMessaging = () => useContext(NotificationContext);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function showRichToast(opts: {
  title: string;
  body: string;
  avatarId?: string;
  actions?: React.ReactNode;
  duration?: number;
}) {
  toast(
    <div className="flex items-start gap-3 w-full">
      {opts.avatarId && (
        <img
          src={getAvatarFallbackUrl(opts.avatarId)}
          className="w-9 h-9 rounded-xl object-cover shrink-0 mt-0.5"
          alt=""
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-foreground">{opts.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{opts.body}</p>
        {opts.actions && <div className="flex items-center gap-2 mt-2">{opts.actions}</div>}
      </div>
    </div>,
    { duration: opts.duration ?? 6000, className: "p-4" }
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { user: currentUser } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Unread count ────────────────────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!currentUser?.id) return;
    const { count } = await supabase
      .from("internal_messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", currentUser.id)
      .eq("is_read", false);
    setUnreadCount(count ?? 0);
  }, [currentUser?.id]);

  useEffect(() => { fetchUnreadCount(); }, [fetchUnreadCount]);

  // ── Mark thread read ────────────────────────────────────────────────────────
  const markThreadRead = useCallback(async (threadId: string) => {
    if (!currentUser?.id) return;
    await supabase
      .from("internal_messages")
      .update({ is_read: true })
      .eq("thread_id", threadId)
      .eq("recipient_id", currentUser.id)
      .eq("is_read", false);
    fetchUnreadCount();
  }, [currentUser?.id, fetchUnreadCount]);

  // ── Realtime subscriptions ──────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // 1. INCOMING MESSAGES ─────────────────────────────────────────────────────
    const msgChannel = supabase
      .channel(`notif-msg:${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "internal_messages",
          filter: `recipient_id=eq.${currentUser.id}`,
        },
        async (payload: { new: any }) => {
          const msg = payload.new;
          setUnreadCount((n) => n + 1);

          const { data: sender } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", msg.sender_id)
            .single();
          const senderName = sender?.name ?? "A colleague";

          showRichToast({
            title: `💬 ${senderName}`,
            body: msg.body,
            avatarId: msg.sender_id,
            duration: 8000,
            actions: (
              <>
                <button
                  onClick={() => { router.push("/messages"); toast.dismiss(); }}
                  className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  View
                </button>
                <QuickReplyButton
                  threadId={msg.thread_id}
                  recipientId={msg.sender_id}
                  senderId={currentUser.id}
                  onSent={() => setUnreadCount((n) => Math.max(0, n - 1))}
                />
              </>
            ),
          });
        }
      )
      // Mark-as-read updates keep counter accurate
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "internal_messages",
        filter: `recipient_id=eq.${currentUser.id}`,
      }, () => { fetchUnreadCount(); })
      .subscribe();
    channels.push(msgChannel);

    // 2. NEW LEAD ASSIGNED TO ME ───────────────────────────────────────────────
    const leadAssignChannel = supabase
      .channel(`notif-lead-assign:${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
          filter: `assigned_to=eq.${currentUser.id}`,
        },
        (payload: { new: any }) => {
          const lead = payload.new;
          showRichToast({
            title: "🆕 New Lead Assigned",
            body: `${lead.name} (${lead.phone || lead.email || lead.source}) has been assigned to you.`,
            avatarId: lead.id,
            duration: 7000,
            actions: (
              <button
                onClick={() => { router.push(`/leads/${lead.id}`); toast.dismiss(); }}
                className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Open Lead
              </button>
            ),
          });
        }
      )
      .subscribe();
    channels.push(leadAssignChannel);

    // 3. LEAD TRANSFERRED TO ME (UPDATE where assigned_to changes to my ID) ───
    const leadTransferChannel = supabase
      .channel(`notif-lead-transfer:${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "leads",
          filter: `assigned_to=eq.${currentUser.id}`,
        },
        (payload: { new: any; old: any }) => {
          const lead = payload.new;
          const oldAssignee = payload.old?.assigned_to;
          // Only notify if assignee actually changed TO me
          if (oldAssignee === currentUser.id) return;
          const prevRep = oldAssignee ? (REP_MAP[oldAssignee] ?? "someone") : "unassigned";
          showRichToast({
            title: "🔀 Lead Transferred to You",
            body: `${lead.name} was transferred from ${prevRep}. Score: ${lead.score} | Status: ${lead.status}`,
            avatarId: lead.id,
            duration: 7000,
            actions: (
              <button
                onClick={() => { router.push(`/leads/${lead.id}`); toast.dismiss(); }}
                className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open Lead
              </button>
            ),
          });
        }
      )
      .subscribe();
    channels.push(leadTransferChannel);

    // 4. INTERACTION / NOTE ADDED ON MY LEADS ─────────────────────────────────
    // (Manager always sees these; sales reps only for their own leads)
    if (currentUser.role === "manager") {
      const interactionChannel = supabase
        .channel(`notif-interactions:manager`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "interactions",
          },
          (payload: { new: any }) => {
            const ev = payload.new;
            if (ev.type === "status_change") {
              showRichToast({
                title: "📊 Lead Stage Updated",
                body: `A lead status changed: ${ev.content ?? ""}`,
                avatarId: ev.lead_id,
              });
            }
          }
        )
        .subscribe();
      channels.push(interactionChannel);
    }

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [currentUser?.id, currentUser?.role, fetchUnreadCount, router]);

  return (
    <NotificationContext.Provider value={{ unreadCount, markThreadRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

// ─── Quick Reply (inline in toast) ───────────────────────────────────────────

function QuickReplyButton({
  threadId,
  recipientId,
  senderId,
  onSent,
}: {
  threadId: string;
  recipientId: string;
  senderId: string;
  onSent: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-muted border border-border text-foreground rounded-lg hover:bg-muted/80 transition-colors"
      >
        Reply
      </button>
    );
  }

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await fetch("/api/partner/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), sender_id: senderId, recipient_id: recipientId }),
      });
      setText(""); setOpen(false); onSent();
      toast.success("Reply sent!");
    } catch { toast.error("Failed to send reply"); }
    finally { setSending(false); }
  }

  return (
    <div className="flex gap-1 mt-1 w-full">
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") send(); }}
        placeholder="Type reply…"
        className="flex-1 text-xs px-2 py-1 bg-background border border-border rounded-lg outline-none focus:border-primary"
      />
      <button
        onClick={send}
        disabled={sending || !text.trim()}
        className="text-[10px] font-black px-2 py-1 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
      >
        {sending ? "…" : "↑"}
      </button>
    </div>
  );
}
