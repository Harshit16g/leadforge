"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { m, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { AIChatWrapper } from "@/components/ai/ai-chat-wrapper";
import { AIInput } from "@/components/ai/ai-input";
import { AICategoryDock, CUSTOMER_CATEGORIES } from "@/components/ai/ai-dock";
import { AIMessageRenderer } from "@/components/ai/ai-message-renderer";

interface CustomerAIDrawerProps {
  orgId?: string;
}

export function CustomerAIDrawer({ orgId }: CustomerAIDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const activeCategory = CUSTOMER_CATEGORIES.find((c) => c.id === selectedCategory)!;

  return (
    <LazyMotion features={domAnimation}>
      {/* Floating trigger button */}
      <m.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full",
          "bg-primary text-primary-foreground shadow-xl shadow-primary/25",
          "font-black text-[11px] uppercase tracking-widest",
          "transition-opacity",
          isOpen && "opacity-0 pointer-events-none"
        )}
      >
        <Sparkles className="size-4" />
        Ask AI
      </m.button>

      {/* Drawer backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer panel */}
            <m.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl"
              style={{ maxHeight: "90dvh" }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
              </div>

              {/* Drawer header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground uppercase tracking-widest leading-none">
                      Leaex AI
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Book, reschedule, or ask anything
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Chat area */}
              <div style={{ height: "65dvh" }}>
                <AIChatWrapper role="customer" orgId={orgId}>
                  {({ messages, isStreaming, error, sendMessage, confirmRequest, rejectRequest, stopStreaming, clearError }) => (
                    <div className="flex flex-col h-full">
                      {error && (
                        <div className="px-4 py-2 bg-destructive/5 border-b border-destructive/20 flex items-center justify-between">
                          <p className="text-xs font-bold text-destructive">{error}</p>
                          <button
                            onClick={clearError}
                            className="text-[10px] font-black text-destructive/70 hover:text-destructive uppercase tracking-widest"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                      <div className="flex-1 overflow-hidden">
                        <AIInput
                          messages={messages}
                          onSend={(text) => sendMessage(text, activeCategory.contextHint)}
                          isStreaming={isStreaming}
                          onStop={stopStreaming}
                          suggestions={activeCategory.suggestions}
                          placeholder="How can I help you today?"
                          className="h-full"
                          contextSlot={
                            <AICategoryDock
                              categories={CUSTOMER_CATEGORIES}
                              selected={selectedCategory}
                              onSelect={setSelectedCategory}
                            />
                          }
                          renderMessage={(msg, { sendMessage }) => (
                            <AIMessageRenderer
                              message={msg}
                              onConfirm={confirmRequest}
                              onReject={rejectRequest}
                              onSendMessage={sendMessage}
                            />
                          )}
                        />
                      </div>
                    </div>
                  )}
                </AIChatWrapper>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}

export default CustomerAIDrawer;
