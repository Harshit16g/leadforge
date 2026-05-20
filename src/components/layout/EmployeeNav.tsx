"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { title: "Today",      url: "/employee/today",      icon: "icon-[solar--calendar-mark-bold-duotone]" },
  { title: "Schedule",   url: "/employee/schedule",   icon: "icon-[solar--calendar-bold-duotone]" },
  { title: "Attendance", url: "/employee/attendance", icon: "icon-[solar--clock-circle-bold-duotone]" },
  { title: "Earnings",   url: "/employee/payroll",    icon: "icon-[solar--wallet-bold-duotone]" },
  { title: "Portfolio",  url: "/employee/works",        icon: "icon-[solar--gallery-bold-duotone]" },
  { title: "AI",         url: "/employee/ai-assistant", icon: "icon-[solar--stars-minimalistic-bold-duotone]" },
  { title: "Messages",   url: "/employee/messages",     icon: "icon-[solar--chat-round-dots-bold-duotone]" },
  { title: "Scanner",    url: "/employee/scanner",    icon: "icon-[solar--scanner-bold-duotone]" },
  { title: "Profile",    url: "/employee/profile",      icon: "icon-[solar--user-bold-duotone]" },
]

export function EmployeeNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 border-r border-border bg-background">
        <div className="h-16 flex items-center px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-background border border-border shadow-sm overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="Leaex" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-semibold text-sm">Leaex</span>
              <span className="text-xs text-muted-foreground">Employee Portal</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.url)
            return (
              <Link
                key={item.url}
                href={item.url}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <span className={cn(item.icon, "size-4 shrink-0")} />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border flex">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.url)
          return (
            <Link
              key={item.url}
              href={item.url}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-xs font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className={cn(item.icon, "size-5")} />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
