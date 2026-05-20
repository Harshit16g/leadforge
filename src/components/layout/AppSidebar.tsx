"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronDown, Sparkles } from "lucide-react"
import { useState } from "react"

const navConfig = {
  manager: [
    {
      label: "Overview",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: "icon-[solar--widget-2-linear]" },
        { href: "/leads", label: "Leads", icon: "icon-[solar--users-group-two-rounded-linear]" },
      ]
    },
    {
      label: "Messaging",
      items: [
        { href: "/messages", label: "Inbox", icon: "icon-[solar--chat-round-dots-linear]" },
      ]
    },
    {
      label: "Workflow",
      items: [
        { href: "/pipeline", label: "Deal Board", icon: "icon-[solar--calendar-mark-linear]" },
        { href: "/tasks", label: "Tasks", icon: "icon-[solar--list-bold-duotone]" },
        { href: "/test-drives", label: "Test Drives", icon: "icon-[solar--route-bold-duotone]" },
        { href: "/automation", label: "Automation", icon: "icon-[solar--history-line-duotone]" },
      ]
    },
    {
      label: "Insights & Ops",
      items: [
        { href: "/analytics", label: "Analytics", icon: "icon-[solar--graph-up-linear]" },
        { href: "/campaigns", label: "Campaigns", icon: "icon-[solar--volume-loud-bold-duotone]" },
        { href: "/ledger", label: "Ledger", icon: "icon-[solar--notebook-bookmark-bold-duotone]" },
        { href: "/qr", label: "QR Tools", icon: "icon-[solar--qr-code-bold-duotone]" },
      ]
    },
    {
      label: "System",
      items: [
        { href: "/settings", label: "Settings", icon: "icon-[solar--settings-linear]" },
      ]
    }
  ],
  sales: [
    {
      label: "Overview",
      items: [
        { href: "/leads", label: "Leads", icon: "icon-[solar--users-group-two-rounded-linear]" },
      ]
    },
    {
      label: "Messaging",
      items: [
        { href: "/messages", label: "Inbox", icon: "icon-[solar--chat-round-dots-linear]" },
      ]
    },
    {
      label: "Workflow",
      items: [
        { href: "/pipeline", label: "Deal Board", icon: "icon-[solar--calendar-mark-linear]" },
        { href: "/tasks", label: "My Tasks", icon: "icon-[solar--list-bold-duotone]" },
        { href: "/test-drives", label: "Test Drives", icon: "icon-[solar--route-bold-duotone]" },
      ]
    },
    {
      label: "System",
      items: [
        { href: "/settings", label: "Settings", icon: "icon-[solar--settings-linear]" },
      ]
    }
  ]
}

interface SidebarContentProps {
  role: "manager" | "sales"
  onItemClick?: () => void
}

export function SidebarContent({ role, onItemClick }: SidebarContentProps) {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<string[]>([
    "Overview", "Messaging", "Workflow", "Insights & Ops", "System"
  ])

  const groups = navConfig[role] || navConfig.sales

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 px-5 shrink-0">
        <div className="grid place-items-center h-9 w-9 rounded-xl bg-primary text-primary-foreground font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(37,99,235,0.3)] text-base">
          L
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-white leading-none">LeadForge</div>
          <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 font-bold mt-1">
            {role === "manager" ? "Executive Ops" : "Sales Terminal"}
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-hide">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1.5">
            <button
              onClick={() => setOpenGroups(prev =>
                prev.includes(group.label)
                  ? prev.filter(g => g !== group.label)
                  : [...prev, group.label]
              )}
              className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 hover:text-sidebar-foreground/80 transition-colors"
            >
              {group.label}
              <ChevronDown className={cn("h-3 w-3 transition-transform", openGroups.includes(group.label) && "rotate-180")} />
            </button>
            {openGroups.includes(group.label) && (
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onItemClick}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 group relative",
                        active
                          ? "bg-sidebar-accent/90 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.06)]"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white hover:translate-x-0.5"
                      )}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full" />
                      )}
                      <span className={cn(item.icon, "size-4.5 transition-transform duration-200 group-hover:scale-110", active ? "text-blue-500" : "text-sidebar-foreground/50 group-hover:text-blue-400")} />
                      <span className="font-medium tracking-wide">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

    </div>
  )
}

export function AppSidebar({ role }: { role: "manager" | "sales" }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 bg-sidebar/95 text-sidebar-foreground border-r border-sidebar-border/80 lg:block backdrop-blur-md">
      <SidebarContent role={role} />
    </aside>
  )
}
