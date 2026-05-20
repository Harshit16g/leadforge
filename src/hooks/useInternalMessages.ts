"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface Thread {
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

export interface Message {
  id: string;
  thread_id: string;
  body: string;
  sender_role: string;
  sender_id?: string;
  direction: 'inbound' | 'outbound';
  created_at: string;
}

export function useInternalMessages(activeThreadId: string | null = null) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/partner/messages");
      const json = await res.json();
      setThreads(json.data || []);
    } catch (err) {
      console.error("Failed to load threads:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!activeThreadId) return;
    try {
      const res = await fetch(`/api/partner/messages/${activeThreadId}`);
      const json = await res.json();
      setMessages(json.data || []);
    } catch (err) {
      console.error("Failed to load thread messages:", err);
    }
  }, [activeThreadId]);

  const sendMessage = useCallback(async (bodyText: string, recipientId: string) => {
    if (!bodyText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/partner/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: bodyText.trim(),
          recipient_id: recipientId,
          thread_type: "internal"
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send");
      
      await fetchMessages();
      await fetchThreads();
      return json.data;
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }, [activeThreadId, fetchMessages, fetchThreads, sending]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    if (activeThreadId) {
      fetchMessages();
    }
  }, [activeThreadId, fetchMessages]);

  return {
    threads,
    messages,
    loading,
    sending,
    refetchThreads: fetchThreads,
    refetchMessages: fetchMessages,
    sendMessage
  };
}
