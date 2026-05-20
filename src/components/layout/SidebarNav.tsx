"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  KanbanSquare, 
  BarChart3, 
  UsersRound, 
  Megaphone, 
  Settings,
  QrCode
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/team", label: "Team", icon: UsersRound },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/qr", label: "QR Tools", icon: QrCode },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname() || "";

  return (
    <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 font-medium text-sm">
      {NAV_ITEMS.map((item) => {
        // Precise matching for the active state
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
              isActive 
                ? "bg-slate-800/80 text-white shadow-[0_0_10px_rgba(0,0,0,0.1)]" 
                : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
            )}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            )}
            {/* Subtle background glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <Icon className={cn(
              "size-5 transition-all duration-300 relative z-10",
              isActive ? "text-blue-500" : "text-slate-500 group-hover:text-blue-400 group-hover:scale-110"
            )} />
            <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1 font-medium tracking-wide">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
