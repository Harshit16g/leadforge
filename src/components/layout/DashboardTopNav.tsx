"use client"

import React from "react"
import { Menu, Globe, Bell, ChevronDown, User, Settings, LifeBuoy, LogOut, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { PartnerGlobalSearch } from "@/components/layout/PartnerGlobalSearch"

import { motion, AnimatePresence } from "framer-motion"
import { useDashboardFilters } from "@/contexts/DashboardFilters"
import { SidebarContent } from "@/components/layout/AppSidebar"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/AuthContext"
import { useMessaging } from "@/contexts/MessagingContext"

interface DashboardTopNavProps {
  user: {
    name: string
    avatar?: string
    email?: string
  }
  businessName?: string
}

export function DashboardTopNav({ user, businessName }: DashboardTopNavProps) {
  const router = useRouter()
  const { role, setRole } = useAuth()
  const { isWelcomeExpanded, setIsWelcomeExpanded } = useDashboardFilters()
  const { unreadCount, markThreadRead } = useMessaging()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const handleLogout = async () => {
    localStorage.removeItem('welcomeShown') // Reset welcome banner on logout
    localStorage.removeItem('leadforge_role')
    router.push("/")
    router.refresh()
    toast.success("Successfully logged out.")
  }

  // Map to Sidebar roles
  const sidebarRole = role === 'manager' ? 'manager' : 'sales'

  return (
    <header className="sticky top-0 z-40 h-[72px] w-full border-b border-border bg-card px-6 flex items-center justify-between shadow-none rounded-t-[12px]">
      {/* Left Group */}
      <div className="flex items-center gap-6">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors lg:hidden cursor-pointer">
              <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-60 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Dealership portal primary navigation links</SheetDescription>
            </SheetHeader>
            <SidebarContent role={sidebarRole} onItemClick={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
        
        {/* Navigation History Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={() => router.back()} 
            className="w-9 h-9 flex items-center justify-center bg-card border border-border hover:bg-muted rounded-lg transition-colors shadow-sm cursor-pointer"
            title="Go Back"
          >
            <ChevronLeft className="size-4 text-foreground/80" />
          </button>
          <button 
            onClick={() => router.forward()} 
            className="w-9 h-9 flex items-center justify-center bg-card border border-border hover:bg-muted rounded-lg transition-colors shadow-sm cursor-pointer"
            title="Go Forward"
          >
            <ChevronRight className="size-4 text-foreground/80" />
          </button>
        </div>

        <div className="hidden md:block">
          <PartnerGlobalSearch />
        </div>
      </div>

      {/* Right Group */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <button 
            onClick={() => toast.success("Region locked to India (IN)")}
            className="p-2 hover:bg-muted rounded-full transition-colors hidden sm:block cursor-pointer"
          >
            <Globe className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 hover:bg-muted rounded-full transition-colors outline-none cursor-pointer">
                <Bell className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-white shadow-sm animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-2xl border border-border p-2 bg-card shadow-2xl">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
                <span className="text-xs font-black uppercase tracking-widest text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <Link href="/messages" className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline cursor-pointer">
                    Open Inbox
                  </Link>
                )}
              </div>
              {unreadCount > 0 && (
                <Link href="/messages" className="flex items-center gap-3 p-3 mt-1 rounded-xl hover:bg-muted cursor-pointer">
                  <div className="relative w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="icon-[solar--chat-round-unread-bold-duotone] size-5 text-primary" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-black text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{unreadCount} unread message{unreadCount > 1 ? 's' : ''}</p>
                    <p className="text-[10px] text-muted-foreground">Tap to open your inbox</p>
                  </div>
                </Link>
              )}
              <div className="py-2 space-y-1 mt-1 border-t border-border/40">
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 rounded-xl hover:bg-muted cursor-pointer focus:bg-muted">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-xs font-bold text-foreground">Hot Lead Received</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Arjun Mehta is interested in Creta SX Diesel</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 rounded-xl hover:bg-muted cursor-pointer focus:bg-muted">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs font-bold text-foreground">Test Drive Scheduled</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Ananya Desai booked at 4:30 PM</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 rounded-xl hover:bg-muted cursor-pointer focus:bg-muted">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                    <span className="text-xs font-bold text-foreground">SLA Breach Warning</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Rohit Khanna untouched for 2hrs</span>
                </DropdownMenuItem>
              </div>
              {unreadCount === 0 && (
                <div className="py-4 text-center flex flex-col items-center gap-2 opacity-50">
                  <span className="icon-[solar--bell-bold-duotone] text-muted-foreground size-7" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">All caught up!</span>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* User Profile */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 py-1 hover:bg-muted rounded-lg transition-colors outline-none pr-2 group">
              <img
                src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"}
                alt={user.name}
                className="h-10 w-10 rounded-full object-cover border border-border"
              />
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-[16px] font-semibold text-gray-800 dark:text-gray-200">
                  {user.name}
                </span>
                <ChevronDown className="h-[18px] w-[18px] text-gray-400 group-data-[state=open]:rotate-180 transition-transform" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64" sideOffset={12}>
            <DropdownMenuLabel className="font-normal px-3 py-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground mt-1">
                  {user.email || "manager@hsrmotors.in"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Personal Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Profile Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4 text-destructive" />
              <span className="font-semibold">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
