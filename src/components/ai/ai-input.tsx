"use client";

import { cn } from "@/lib/utils";
import {
  m,
  LazyMotion,
  domMax,
  AnimatePresence,
} from "framer-motion";
import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import { Mic, ArrowUp, Square, X } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

import type { AIMessage } from "./types";
export type { AIMessage };

interface AIInputContextType {
  activeDropdown: null;
  setActiveDropdown: (v: null) => void;
}

const AIInputContext = createContext<AIInputContextType | undefined>(undefined);

export const useAIInput = () => {
  const context = useContext(AIInputContext);
  if (!context) throw new Error("useAIInput must be used within AIInput");
  return context;
};

// =============================================================================
// MESSAGES AREA
// =============================================================================

interface RenderMessageContext {
  sendMessage: (text: string) => void;
}

interface AIInputMessagesProps {
  messages: AIMessage[];
  hasSubmitted: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  renderMessage?: (msg: AIMessage, ctx: RenderMessageContext) => React.ReactNode;
  sendMessage: (text: string) => void;
}

export function AIInputMessages({
  messages,
  hasSubmitted,
  messagesEndRef,
  scrollContainerRef,
  renderMessage,
  sendMessage,
}: AIInputMessagesProps) {
  // Outer div: flex-1 min-h-0 makes this shrink-to-fit inside the flex column
  // and overflow-y-auto enables scrolling. Inner div constrains content width.
  return (
    <div ref={scrollContainerRef} className={cn("flex-1 min-h-0 overflow-y-auto no-scrollbar", !hasSubmitted && "hidden")}>
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 px-4 pt-10">
        {hasSubmitted && (
          <>
            {messages.map((msg) =>
              renderMessage ? (
                <div key={msg.id}>{renderMessage(msg, { sendMessage })}</div>
              ) : (
                <m.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  key={msg.id}
                  className={cn(
                    "flex flex-col gap-2 max-w-[85%]",
                    msg.role === "user" ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-5 py-3.5 rounded-3xl text-sm font-medium leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-card border border-border text-foreground rounded-tl-none"
                    )}
                  >
                    {msg.parts.find((p) => p.type === "text")?.content ?? ""}
                  </div>
                </m.div>
              )
            )}
            <div className="h-32 flex-shrink-0" />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
}
AIInputMessages.displayName = "AIInputMessages";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface AIInputProps {
  messages: AIMessage[];
  onSend: (text: string) => void;
  isStreaming?: boolean;
  onStop?: () => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
  renderMessage?: (msg: AIMessage, ctx: RenderMessageContext) => React.ReactNode;
  /** Slot rendered between the messages area and the input box (e.g. category dock) */
  contextSlot?: React.ReactNode;
}

export function AIInput({
  messages,
  onSend,
  isStreaming = false,
  onStop,
  suggestions = [],
  placeholder = "Ask anything…",
  className,
  renderMessage,
  contextSlot,
}: AIInputProps) {
  const [value, setValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasSubmitted = messages.length > 0;
  const hasText = value.length > 0;

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSubmit = () => {
    if (!value.trim() || isStreaming) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <LazyMotion features={domMax}>
      <AIInputContext.Provider value={{ activeDropdown: null, setActiveDropdown: () => {} }}>
        <div className={cn("w-full h-full flex flex-col relative overflow-hidden", className)}>
          <AIInputMessages
            messages={messages}
            hasSubmitted={hasSubmitted}
            messagesEndRef={messagesEndRef}
            scrollContainerRef={scrollContainerRef}
            renderMessage={renderMessage}
            sendMessage={onSend}
          />



          <m.div
            layout
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "w-full px-4 flex flex-col z-20",
              hasSubmitted ? "pb-6 shrink-0" : "flex-1 justify-center items-center"
            )}
          >



            <div className="w-full max-w-3xl mx-auto relative">
              <m.div
                layoutId="input-container"
                layout
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="relative bg-card rounded-3xl border border-border shadow-sm"
              >
                <div className="p-4 pb-14">
                  <m.textarea
                    layout
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isListening}
                    placeholder={isListening ? "Listening…" : placeholder}
                    className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/50 resize-none outline-none min-h-[44px] max-h-[200px]"
                    rows={1}
                    style={{ height: "auto" }}
                    onInput={(e) => {
                      const t = e.target as HTMLTextAreaElement;
                      t.style.height = "auto";
                      t.style.height = `${t.scrollHeight}px`;
                    }}
                  />
                </div>

                {/* Controls */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-end items-center z-10">
                  <div className="flex items-center gap-2">
                    <AnimatePresence mode="wait" initial={false}>
                      {isStreaming ? (
                        <m.button
                          key="stop"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.15 }}
                          onClick={onStop}
                          className="p-2.5 rounded-full bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                        >
                          <Square className="w-4 h-4" fill="currentColor" />
                        </m.button>
                      ) : hasText ? (
                        <m.div
                          key="active"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-2"
                        >
                          <button
                            onClick={() => setValue("")}
                            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleSubmit}
                            className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm shadow-primary/20"
                          >
                            <ArrowUp className="w-5 h-5" />
                          </button>
                        </m.div>
                      ) : (
                        <m.div
                          key="idle"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-2"
                        >
                          <button
                            onClick={() => setIsListening(!isListening)}
                            className={cn(
                              "p-2 transition-all duration-300 relative cursor-pointer",
                              isListening
                                ? "text-destructive bg-destructive/10 rounded-full"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {isListening ? (
                              <Square className="w-4 h-4" fill="currentColor" />
                            ) : (
                              <Mic className="w-4 h-4" />
                            )}
                            {isListening && (
                              <span className="absolute inset-0 rounded-full animate-ping bg-destructive/20" />
                            )}
                          </button>
                          <button
                            disabled
                            className="p-2.5 rounded-full bg-muted text-muted-foreground cursor-not-allowed"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </m.div>
            </div>

            {/* Suggestion chips — now below the input and instant */}
            {suggestions.length > 0 && (
              <m.div
                initial={false}
                animate={{ opacity: hasSubmitted ? 0.6 : 1 }}
                whileHover={{ opacity: 1 }}
                className="w-full max-w-3xl mx-auto mt-4 mb-1 flex items-center gap-2 flex-wrap transition-all"
              >
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSend(s)}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary border border-primary/10 bg-primary/5 hover:bg-primary/10 hover:border-primary/20 transition-all shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </m.div>
            )}

            {/* Context slot (e.g. category dock) — now below the input */}
            {contextSlot && (
              <m.div
                initial={false}
                animate={{ opacity: hasSubmitted ? 0.6 : 1 }}
                whileHover={{ opacity: 1 }}
                className="w-full mt-3"
              >
                {contextSlot}
              </m.div>
            )}
          </m.div>
        </div>
      </AIInputContext.Provider>
    </LazyMotion>
  );
}
AIInput.displayName = "AIInput";

export default AIInput;
