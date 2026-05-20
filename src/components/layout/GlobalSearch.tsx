"use client"

import * as React from "react"
import { Search } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface GlobalSearchProps {
  role?: "partner" | "employee" | "admin"
}

export function GlobalSearch({ role }: GlobalSearchProps) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (url: string) => {
    window.open(url, "_blank")
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "relative h-9 w-full max-w-sm flex items-center justify-start rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring",
          "md:w-64 lg:w-80"
        )}
      >
        <Search className="mr-2 h-4 w-4 shrink-0" />
        <span className="inline-flex">Search everything...</span>
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} className="sm:max-w-2xl">
        <CommandInput placeholder="Search anything (Booking ID, User, Payment, etc.)" />
        <CommandList className="max-h-[60vh] md:max-h-[500px]">
          <CommandEmpty className="py-12 flex flex-col items-center gap-3">
            <span className="icon-[solar--magnifer-zoom-in-bold-duotone] size-10 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No results found for this query.</p>
          </CommandEmpty>
          
          <CommandGroup heading="Global Results (Algolia Integrated)">
            <CommandItem onSelect={() => handleSelect("/partner/bookings/BK-9021")}>
              <div className="flex items-center gap-3 w-full">
                <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <span className="icon-[solar--calendar-bold-duotone] size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">Booking #BK-9021</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Harshit Lodhi • Tomorrow at 2:30 PM</span>
                </div>
                <span className="ml-auto text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-black uppercase">Confirmed</span>
              </div>
            </CommandItem>

            <CommandItem onSelect={() => handleSelect("/partner/customers/USR-772")}>
              <div className="flex items-center gap-3 w-full">
                <div className="size-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <span className="icon-[solar--user-bold-duotone] size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">Ananya Sharma</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">ananya.s@example.com • 12 Bookings</span>
                </div>
                <span className="ml-auto text-[10px] text-muted-foreground font-bold">Customer ID: 772</span>
              </div>
            </CommandItem>

            <CommandItem onSelect={() => handleSelect("/partner/payments/TX-4402")}>
              <div className="flex items-center gap-3 w-full">
                <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <span className="icon-[solar--wallet-bold-duotone] size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">Payment #TX-4402</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">₹4,250.00 • Razorpay • 15 May, 2026</span>
                </div>
                <span className="ml-auto text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-black uppercase">Captured</span>
              </div>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="System Navigation">
            <CommandItem onSelect={() => handleSelect("/partner/analytics")}>
              <span className="icon-[solar--chart-bold-duotone] mr-2 h-4 w-4" />
              <span>Revenue Analytics</span>
              <CommandShortcut>⌘A</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/partner/settings")}>
              <span className="icon-[solar--settings-bold-duotone] mr-2 h-4 w-4" />
              <span>Business Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
