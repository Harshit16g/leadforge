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
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"

export function PartnerGlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const debouncedQuery = useDebounce(query, 300)
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

  React.useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([])
      return
    }

    async function performSearch() {
      setLoading(true)
      try {
        const res = await fetch(`/api/partner/search?q=${encodeURIComponent(debouncedQuery)}`)
        const json = await res.json()
        setResults(json.data || [])
      } catch (e) {
        console.error("Search failed", e)
      } finally {
        setLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery])

  const handleSelect = (url: string) => {
    window.open(url, "_blank")
    setOpen(false)
  }

  const groupedResults = results.reduce((acc: any, curr: any) => {
    if (!acc[curr.category]) acc[curr.category] = []
    acc[curr.category].push(curr)
    return acc
  }, {})

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "relative h-[46px] w-[380px] flex items-center justify-start rounded-[10px] bg-[#F5F7FA] dark:bg-muted/50 px-3 py-2 text-[15px] text-gray-600 dark:text-gray-300 transition-all hover:bg-gray-100 dark:hover:bg-muted focus:outline-none focus:ring-1 focus:ring-gray-200 dark:focus:ring-border border-none shadow-none"
        )}
      >
        <Search className="mr-3 h-5 w-5 shrink-0 text-gray-400" />
        <span className="inline-flex text-gray-400 font-normal">Search org data...</span>
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center gap-1 rounded border bg-white dark:bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex text-gray-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} className="sm:max-w-2xl">
        <CommandInput 
          placeholder="Search bookings, users, profile..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[60vh] md:max-h-[500px]">
          {loading && <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>}
          {!loading && results.length === 0 && query.length >= 2 && (
            <CommandEmpty className="py-12 flex flex-col items-center gap-3">
              <span className="icon-[solar--magnifer-zoom-in-bold-duotone] size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">No results found in your organisation.</p>
            </CommandEmpty>
          )}
          
          {Object.entries(groupedResults).map(([category, items]: [string, any]) => (
            <CommandGroup key={category} heading={category}>
              {items.map((item: any) => (
                <CommandItem key={item.id + item.type} onSelect={() => handleSelect(item.url)}>
                  <div className="flex items-center gap-3 w-full">
                    {item.image ? (
                      <div className="size-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-secondary">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    ) : item.type === "customer" ? (
                      <div className="size-8 rounded-full flex items-center justify-center shrink-0 bg-purple-500/10 text-purple-500 font-bold text-xs uppercase">
                        {item.title ? item.title.charAt(0) : "?"}
                      </div>
                    ) : item.type === "staff" ? (
                      <div className="size-8 rounded-full flex items-center justify-center shrink-0 bg-amber-500/10 text-amber-500 font-bold text-xs uppercase">
                        {item.title ? item.title.charAt(0) : "?"}
                      </div>
                    ) : (
                      <div className={cn(
                        "size-8 rounded-lg flex items-center justify-center shrink-0",
                        item.type === "booking" ? "bg-blue-500/10 text-blue-500" :
                        "bg-amber-500/10 text-amber-500"
                      )}>
                        <span className={cn(
                          "size-4",
                          item.type === "booking" ? "icon-[solar--calendar-bold-duotone]" :
                          "icon-[solar--settings-bold-duotone]"
                        )} />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-semibold">{item.title}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{item.subtitle}</span>
                    </div>
                    <span className="ml-auto icon-[solar--arrow-right-up-linear] size-4 opacity-30" />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

          <CommandSeparator />
          <CommandGroup heading="Recent Actions">
             <CommandItem onSelect={() => handleSelect("/partner/bookings")}>
               <span className="icon-[solar--history-bold-duotone] mr-2 h-4 w-4" />
               <span>View All Bookings</span>
             </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
