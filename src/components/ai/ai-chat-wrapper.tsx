"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import type { AIMessage, AIMessagePart, AIToolTask, BusinessResult } from "./types";
import { useBeacon } from "@/components/providers/BeaconProvider";

export type { AIMessage, AIMessagePart, AIToolTask, BusinessResult };
export type AIRole = "partner" | "employee" | "customer";

interface AIChatState {
  messages: AIMessage[];
  isStreaming: boolean;
  sessionId: string | null;
  error: string | null;
  activeModel: string | null;
  activeLayer: string | null;
}

interface AIChatActions {
  sendMessage: (text: string, categoryContext?: string, mode?: string) => Promise<void>;
  confirmRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  stopStreaming: () => void;
  clearError: () => void;
  resetChat: () => void;
  exportChatLog: () => void;
}

interface AIChatWrapperProps {
  role: AIRole;
  orgId?: string;
  children: (state: AIChatState & AIChatActions) => React.ReactNode;
}

type SSEEvent =
  | { type: "content"; content: string }
  | { type: "reasoning"; content: string; done: boolean }
  | { type: "queue"; tasks: { id: string; name: string; label: string; icon?: string }[] }
  | { type: "queue_update"; taskId: string; toolName: string; status: "done" | "error"; result: unknown }
  | { type: "businesses"; businesses: BusinessResult[] }
  | { type: "model"; layer: string; model: string }
  | { type: "done" }
  | { type: "error"; content: string };

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const STORAGE_KEY = (role: string) => `leaex-ai-chat-${role}`;

export function AIChatWrapper({ role, orgId, children }: AIChatWrapperProps) {
  const [messages, setMessages] = useState<AIMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY(role));
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const beacon = useBeacon();

  useEffect(() => {
    if (messages.length === 0) return;
    try { localStorage.setItem(STORAGE_KEY(role), JSON.stringify(messages)); }
    catch { /* quota exceeded — skip */ }
  }, [messages, role]);

  useEffect(() => {
    async function initSession() {
      try {
        const res = await fetch("/api/ai/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, orgId }),
        });
        if (res.status === 401) {
          setError("Login required. Please sign in to use AI.");
          return;
        }
        if (!res.ok) return;
        const { sessionId: id } = await res.json();
        setSessionId(id);
      } catch {
        // Non-fatal — chat works without session history
      }
    }
    initSession();
  }, [role, orgId]);

  const sendMessage = useCallback(
    async (text: string, _categoryContext?: string, mode?: string) => {
      if (isStreaming || !text.trim()) return;

      const userMsg: AIMessage = {
        id: makeId(),
        role: "user",
        parts: [{ type: "text", content: text }],
      };
      const assistantId = makeId();
      const assistantMsg: AIMessage = {
        id: assistantId,
        role: "ai",
        parts: [],
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);
      setError(null);
      beacon.ai.start();
      abortRef.current = new AbortController();

      // Helper: mutate only the active assistant message's parts
      const updateParts = (fn: (parts: AIMessagePart[]) => AIMessagePart[]) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, parts: fn(m.parts), isLoading: false } : m
          )
        );
      };

      // Signal AI session is starting
      beacon.session.start();

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, sessionId, role, orgId, mode }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) throw new Error(`Chat request failed: ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === "[DONE]") continue;

            let event: SSEEvent;
            try { event = JSON.parse(raw); }
            catch { continue; }

            switch (event.type) {
              case "model":
                setActiveModel(event.model);
                setActiveLayer(event.layer);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, layer: event.layer, model: event.model }
                      : m
                  )
                );
                break;

              case "reasoning":
                updateParts((parts) => {
                  // Find the most recent reasoning part (may not be the last part — a queue
                  // could have been inserted between planning rounds). Always update it in-place
                  // so there is only ever ONE reasoning collapsible per assistant message.
                  const lastReasoningIdx = parts.map((p) => p.type).lastIndexOf("reasoning");
                  if (lastReasoningIdx !== -1) {
                    const updated = [...parts];
                    updated[lastReasoningIdx] = {
                      type: "reasoning",
                      content: event.content,   // server sends full accumulated text
                      isStreaming: !event.done,
                    };
                    return updated;
                  }
                  return [...parts, { type: "reasoning", content: event.content, isStreaming: !event.done }];
                });
                break;

              case "content":
                updateParts((parts) => {
                  const last = parts[parts.length - 1];
                  if (last?.type === "text") {
                    return [
                      ...parts.slice(0, -1),
                      { type: "text", content: last.content + event.content },
                    ];
                  }
                  return [...parts, { type: "text", content: event.content }];
                });
                break;

              case "queue":
                updateParts((parts) => [
                  ...parts,
                  {
                    type: "queue",
                    tasks: event.tasks.map((t) => ({ ...t, status: "pending" as const })),
                  },
                ]);
                break;

              case "queue_update":
                updateParts((parts) =>
                  parts.map((p) => {
                    if (p.type !== "queue") return p;
                    return {
                      ...p,
                      tasks: p.tasks.map((t): AIToolTask =>
                        t.id === event.taskId
                          ? { ...t, status: event.status, result: event.result }
                          : t
                      ),
                    };
                  })
                );
                break;

              case "businesses":
                updateParts((parts) => [
                  ...parts,
                  { type: "businesses", businesses: event.businesses },
                ]);
                break;

              case "error":
                setError(event.content);
                break;

              case "done":
                // Seal any still-streaming reasoning parts
                updateParts((parts) =>
                  parts.map((p) =>
                    p.type === "reasoning" && p.isStreaming ? { ...p, isStreaming: false } : p
                  )
                );
                break;
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const msg = (err as Error).message;
        setError(msg.includes("429") ? "Too many requests. Please wait 30 seconds." : "Failed to connect to AI. Please try again.");
        beacon.ai.failed();
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsStreaming(false);
        if (!error) {
           beacon.ai.completed();
        }
        abortRef.current = null;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, isLoading: false } : m))
        );
      }
    },
    [isStreaming, sessionId, role, orgId]
  );

  const confirmRequest = useCallback(async (requestId: string) => {
    try {
      const res = await fetch("/api/ai/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      if (!res.ok) throw new Error("Confirm failed");
      const { bookingId } = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "ai",
          parts: [{ type: "text", content: `Booking confirmed!${bookingId ? ` Reference: ${bookingId.slice(0, 8).toUpperCase()}` : ""}` }],
        },
      ]);
    } catch {
      setError("Failed to confirm the booking. Please try again.");
    }
  }, []);

  const rejectRequest = useCallback(async (requestId: string) => {
    try {
      await fetch("/api/ai/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "ai",
          parts: [{ type: "text", content: "Request cancelled." }],
        },
      ]);
    } catch {
      setError("Failed to cancel the request.");
    }
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setSessionId(null);
    try { localStorage.removeItem(STORAGE_KEY(role)); } catch { /* ignore */ }
  }, [role]);

  const exportChatLog = useCallback(() => {
    if (messages.length === 0) return;
    const lines = messages.map((m) => {
      const text = m.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { content: string }).content)
        .join(" ");
      return `[${m.role.toUpperCase()}] ${text}`;
    });
    const blob = new Blob([lines.join("\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  return (
    <>
      {children({
        messages,
        isStreaming,
        sessionId,
        error,
        activeModel,
        activeLayer,
        sendMessage,
        confirmRequest,
        rejectRequest,
        stopStreaming,
        clearError,
        resetChat,
        exportChatLog,
      })}
    </>
  );
}

export default AIChatWrapper;
