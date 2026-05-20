"use client";

import { cn } from "@/lib/utils";

/**
 * CampaignPreview — Interactive phone-frame mockup showing exactly how
 * the WhatsApp message will look on a customer's device.
 */
export function CampaignPreview({
  message,
  orgName,
  className,
}: {
  message: string;
  orgName?: string;
  className?: string;
}) {
  // Process WhatsApp formatting: *bold*, _italic_, ~strikethrough~
  function formatWA(text: string): string {
    return text
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/~(.*?)~/g, '<del>$1</del>')
      .replace(/\n/g, '<br/>');
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">
        Message Preview
      </p>

      {/* Phone Frame */}
      <div className="w-[300px] rounded-[2.5rem] border-[3px] border-neutral-800 dark:border-neutral-600 bg-neutral-900 p-1.5 shadow-2xl">
        {/* Notch */}
        <div className="flex justify-center mb-1">
          <div className="w-20 h-5 bg-neutral-800 dark:bg-neutral-700 rounded-full" />
        </div>

        {/* Screen */}
        <div className="bg-[#ECE5DD] dark:bg-[#0B141A] rounded-[2rem] overflow-hidden min-h-[380px] flex flex-col">
          {/* WA Header */}
          <div className="bg-[#075E54] dark:bg-[#202C33] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-bold">
              {orgName?.charAt(0)?.toUpperCase() || "B"}
            </div>
            <div>
              <p className="text-white text-xs font-bold leading-none">
                {orgName || "Business"}
              </p>
              <p className="text-green-200 text-[9px] font-medium mt-0.5">online</p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 p-3 space-y-2">
            {/* Date chip */}
            <div className="flex justify-center">
              <span className="bg-white/80 dark:bg-[#1F2C34] text-[9px] font-bold px-3 py-1 rounded-lg text-neutral-500 dark:text-neutral-400 shadow-sm">
                TODAY
              </span>
            </div>

            {/* Message Bubble */}
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-white dark:bg-[#202C33] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm relative">
                {/* Message content */}
                <div
                  className="text-[12px] leading-[1.6] text-neutral-800 dark:text-neutral-200 font-medium"
                  dangerouslySetInnerHTML={{
                    __html: message
                      ? formatWA(message)
                      : '<span class="text-neutral-400 italic">Type your message to see the preview...</span>',
                  }}
                />

                {/* Timestamp + Read receipt */}
                <div className="flex items-center justify-end gap-1 mt-1.5">
                  <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-medium">
                    {timeStr}
                  </span>
                  <span className="text-blue-400 text-[10px]">✓✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Input Bar */}
          <div className="bg-[#F0F0F0] dark:bg-[#1F2C34] px-3 py-2 flex items-center gap-2">
            <div className="flex-1 bg-white dark:bg-[#2A3942] rounded-full px-4 py-2">
              <span className="text-[10px] text-neutral-400 font-medium">Type a message</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#075E54] dark:bg-[#00A884] flex items-center justify-center">
              <span className="text-white text-sm">🎤</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
