"use client";

import { cn } from "@/lib/utils";
import { m, LazyMotion, domAnimation, AnimatePresence } from "framer-motion";
import React from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface AICategory {
  id: string;
  label: string;
  icon: string; // Solar icon class string e.g. "icon-[solar--calendar-bold-duotone]"
  suggestions: string[];
  contextHint: string;
}

interface AICategoryDockProps {
  categories: AICategory[];
  selected: string;
  onSelect: (categoryId: string) => void;
  className?: string;
}

// =============================================================================
// DEFAULT PARTNER CATEGORIES
// =============================================================================

export const PARTNER_CATEGORIES: AICategory[] = [
  {
    id: "all",
    label: "All",
    icon: "icon-[solar--stars-minimalistic-bold-duotone]",
    suggestions: [
      "What's happening today?",
      "Show me this week's summary",
      "Any alerts I should know about?",
    ],
    contextHint: "You have full access to all business data.",
  },
  {
    id: "bookings_crm",
    label: "Bookings & CRM",
    icon: "icon-[solar--calendar-bold-duotone]",
    suggestions: [
      "Today's bookings",
      "Recent visitors",
      "Customer insights",
    ],
    contextHint: "Manage bookings, view customer history and recent visitor insights.",
  },
  {
    id: "business_analytics",
    label: "Business & Analytics",
    icon: "icon-[solar--chart-bold-duotone]",
    suggestions: [
      "Today's revenue",
      "Monthly revenue report",
      "Revenue by service type",
    ],
    contextHint: "Track revenue, growth, and financial performance metrics.",
  },
  {
    id: "staff_inventory",
    label: "Staff & Inventory",
    icon: "icon-[solar--users-group-rounded-bold-duotone]",
    suggestions: [
      "Staff performance this week",
      "Low stock alerts",
      "Inventory summary",
    ],
    contextHint: "Monitor staff utilization and manage inventory levels.",
  },
  {
    id: "marketing",
    label: "Marketing & Comms",
    icon: "icon-[solar--chat-line-bold-duotone]",
    suggestions: [
      "Message recent visitors",
      "Review contact requests",
      "Send WhatsApp update",
    ],
    contextHint: "Handle communications, marketing messages, and notifications.",
  },
];

export const EMPLOYEE_CATEGORIES: AICategory[] = [
  {
    id: "all",
    label: "All",
    icon: "icon-[solar--stars-minimalistic-bold-duotone]",
    suggestions: ["What's my day like?", "Any updates for me?"],
    contextHint: "You can see your own schedule and performance data.",
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: "icon-[solar--calendar-bold-duotone]",
    suggestions: ["My schedule today", "Upcoming bookings", "My hours this week"],
    contextHint: "Focus on the employee's personal schedule and appointments.",
  },
  {
    id: "performance",
    label: "Performance",
    icon: "icon-[solar--chart-bold-duotone]",
    suggestions: [
      "My bookings this month",
      "My revenue contribution",
      "How am I doing vs target?",
    ],
    contextHint: "Focus on the employee's personal performance metrics.",
  },
  {
    id: "today",
    label: "Today",
    icon: "icon-[solar--sun-bold-duotone]",
    suggestions: ["Today's clients", "Next appointment", "Today's summary"],
    contextHint: "Focus on today's work for this employee.",
  },
];

export const CUSTOMER_CATEGORIES: AICategory[] = [
  {
    id: "all",
    label: "All",
    icon: "icon-[solar--stars-minimalistic-bold-duotone]",
    suggestions: ["Help me book an appointment", "What services are available?"],
    contextHint: "You are a helpful booking assistant.",
  },
  {
    id: "services",
    label: "Services",
    icon: "icon-[solar--scissors-bold-duotone]",
    suggestions: ["What services do you offer?", "How much does a haircut cost?", "How long does it take?"],
    contextHint: "Focus on explaining available services and pricing.",
  },
  {
    id: "availability",
    label: "Availability",
    icon: "icon-[solar--calendar-bold-duotone]",
    suggestions: ["Available slots tomorrow", "Book me for this weekend", "Earliest available slot"],
    contextHint: "Focus on available appointment slots and scheduling.",
  },
  {
    id: "bookings",
    label: "My Bookings",
    icon: "icon-[solar--notebook-bookmark-bold-duotone]",
    suggestions: ["My upcoming bookings", "Cancel my appointment", "Reschedule my booking"],
    contextHint: "Focus on this customer's existing bookings.",
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function AICategoryDock({
  categories,
  selected,
  onSelect,
  className,
}: AICategoryDockProps) {
  return (
    <LazyMotion features={domAnimation}>
      <div
        className={cn(
          "w-full max-w-3xl mx-auto px-4",
          className
        )}
      >
        {/* Desktop: pill row. Mobile: horizontal scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const isActive = selected === cat.id;
            return (
              <div key={cat.id} className="relative shrink-0">
                {isActive && (
                  <m.div
                    layoutId="ai-dock-active"
                    className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-full"
                    transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                  />
                )}
                <button
                  onClick={() => onSelect(cat.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className={cn(cat.icon, "size-3.5")} />
                  {cat.label}
                </button>
              </div>
            );
          })}
        </div>

        {/* Active category suggestions preview (desktop only) */}
        <AnimatePresence mode="wait">
          {categories.find((c) => c.id === selected) && (
            <m.div
              key={selected}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="hidden sm:block mt-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] truncate px-1"
            >
              {categories.find((c) => c.id === selected)?.contextHint}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}

export default AICategoryDock;
