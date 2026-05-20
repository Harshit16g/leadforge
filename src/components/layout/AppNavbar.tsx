"use client"

import Link from "next/link"
import { Bell, User, Settings, LifeBuoy, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client/client"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import Search from "@/components/search"
import { PartnerGlobalSearch } from "@/components/layout/PartnerGlobalSearch"

interface AppNavbarProps {
  role?: "partner" | "employee" | "admin"
  user: { name: string; email?: string; avatar?: string }
}

export function AppNavbar({ role, user }: AppNavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error("Logout failed")
    } else {
      localStorage.removeItem('welcomeShown') // Reset welcome banner on logout
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center gap-4 px-4 lg:px-6">
        {/* Global Search Trigger - Conditional based on Role */}
        <div className="hidden md:block">
          {role === "admin" ? (
            <Search
              applicationId="1A50FOE4WK"
              apiKey="7067edc2ccac1b512af352e17463f112"
              indexName="algolia"
              attributes={{
                primaryText: "name",
                secondaryText: "email",
                tertiaryText: "city",
                url: "",
                image: "avatar_url"
              }}
              placeholder="Search global users..."
              buttonProps={{
                className: "h-9 md:min-w-[240px] lg:min-w-[320px] bg-muted/50 border-border hover:bg-muted transition-all rounded-lg py-0 px-3 shadow-none text-muted-foreground font-normal"
              }}
            />
          ) : (
            <PartnerGlobalSearch />
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <button className="grid place-items-center h-9 w-9 rounded-lg hover:bg-muted relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {/* User Profile Dropdown */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-muted transition-colors outline-none">
                <img 
                  src={user.avatar || "https://github.com/shadcn.png"} 
                  alt={user.name} 
                  className="h-7 w-7 rounded-full object-cover border border-border" 
                />
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium leading-none">{user.name}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5">
                    {role === "partner" ? "Partner" : role === "employee" ? "Staff" : "Admin"}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
              <DropdownMenuLabel className="font-normal px-3 py-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground mt-1">
                    {user.email || "lodhi.ji.16@gmail.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${role}/settings?tab=profile`} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span className="whitespace-nowrap">Personal Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${role}/settings`} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span className="whitespace-nowrap">Profile Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${role}/help`} className="cursor-pointer">
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  <span className="whitespace-nowrap">Support Center</span>
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
      </div>
    </header>
  )
}
