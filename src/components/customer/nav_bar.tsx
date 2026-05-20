"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/common/BrandLogo";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useLocation, SUPPORTED_CITIES } from "@/components/providers/LocationProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const NAV_HEIGHT = "h-16";

export function CustomerNavbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { city, setCity, isLoading, refreshLocation } = useLocation();

  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Show if scrolling up or at the very top
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      }
      // Hide if scrolling down and past a threshold
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);


  const isSearch = pathname?.startsWith("/search");
  const isLanding = pathname === "/" || pathname === "/customer";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 z-50 w-full border-b transition-all duration-300 ease-in-out",
          isVisible ? "translate-y-0" : "-translate-y-full",
          isLanding
            ? "bg-background/80 border-border/10 backdrop-blur-xl"
            : "bg-card/95 border-border backdrop-blur-xl shadow-sm"
        )}
      >
        <div className={cn("mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6", NAV_HEIGHT)}>
          {/* Logo */}
          <Link href="/" className="group flex shrink-0 items-center">
            <BrandLogo variant="full" size="md" className="group-hover:scale-105 transition-transform duration-300" />
          </Link>

          {/* Inline search (hidden on landing hero) */}
          {!isLanding && (
            <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-lg">
                <span className="icon-[solar--magnifer-bold-duotone] absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Haircut, Spa, Massage…"
                  className="h-10 rounded-xl pl-10 text-xs font-medium border-border bg-muted/50 focus-visible:bg-card"
                />
              </div>
            </form>
          )}

          {isLanding && <div className="flex-1" />}

          {/* Right section */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Location Selection */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors sm:flex border-border bg-muted/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  <span className={cn(
                    "icon-[solar--compass-bold-duotone] size-3.5",
                    isLoading && "animate-spin"
                  )} />
                  {isLoading ? "Locating..." : city}
                  <span className="icon-[solar--alt-arrow-down-linear] size-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 rounded-2xl p-2 shadow-2xl backdrop-blur-xl">
                <div className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Select City
                </div>
                <DropdownMenuSeparator className="opacity-50" />
                <div className="max-h-64 overflow-y-auto no-scrollbar">
                  {SUPPORTED_CITIES.map((c) => (
                    <DropdownMenuItem
                      key={c}
                      onClick={() => setCity(c)}
                      className={cn(
                        "rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                        city === c ? "bg-primary text-white" : "hover:bg-muted"
                      )}
                    >
                      {c}
                      {city === c && <span className="icon-[solar--check-read-bold-duotone] ml-auto size-3" />}
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator className="opacity-50" />
                <DropdownMenuItem
                  onClick={() => refreshLocation()}
                  className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10"
                >
                  <span className="icon-[solar--gps-bold-duotone] size-3.5" />
                  Auto-detect location
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle */}
            <AnimatedThemeToggler
              className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors border-border bg-muted/40 text-foreground hover:bg-muted"
            />


            {/* Auth buttons */}
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className={cn(
                  "text-xs font-bold uppercase tracking-widest transition-colors text-muted-foreground hover:text-foreground"
                )}
              >
                Sign In
              </Link>
              <Button
                asChild
                size="sm"
                className="h-9 rounded-xl px-5 text-xs font-bold uppercase tracking-widest shadow-md shadow-primary/20"
              >
                <Link href="/register">Join Free</Link>
              </Button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl md:hidden",
                "bg-primary text-white shadow-md shadow-primary/20"
              )}
            >
              <span
                className={cn(
                  "size-5 transition-all",
                  mobileOpen
                    ? "icon-[solar--close-circle-bold-duotone]"
                    : "icon-[solar--map-bold-duotone]"
                )}
              />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div
            className={cn(
              "border-t px-6 py-6 md:hidden",
              "border-border bg-card shadow-xl"
            )}
          >
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <span className="icon-[solar--magnifer-bold-duotone] absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search services or salons…"
                  className="h-11 rounded-xl pl-10 text-sm"
                />
              </div>
            </form>

            <div className="space-y-1">
              {[
                { label: "Find Services", href: "/search", icon: "solar--magnifer-bold-duotone" },
                { label: "My Bookings", href: "/customer/bookings", icon: "solar--calendar-mark-bold-duotone" },
                { label: "Offers & Deals", href: "/search?offers=true", icon: "solar--tag-bold-duotone" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-colors text-foreground hover:bg-muted"
                  )}
                >
                  <span className={cn(`icon-[${link.icon}] size-5 text-muted-foreground`)} />
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" asChild className="flex-1 h-11 rounded-xl font-bold">
                <Link href="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
              </Button>
              <Button asChild className="flex-1 h-11 rounded-xl font-bold shadow-md shadow-primary/20">
                <Link href="/register" onClick={() => setMobileOpen(false)}>Join Free</Link>
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile bottom tab bar */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 border-t md:hidden",
          "bg-card border-border shadow-lg"
        )}
      >
        <div className="grid grid-cols-4 px-2 py-2">
          {[
            { label: "Home", href: "/", icon: "solar--home-2-bold-duotone" },
            { label: "Explore", href: "/search", icon: "solar--magnifer-bold-duotone" },
            { label: "Bookings", href: "/customer/bookings", icon: "solar--calendar-mark-bold-duotone" },
            { label: "Account", href: "/login", icon: "solar--user-circle-bold-duotone" },
          ].map((tab) => {
            const active = pathname === tab.href || (tab.href !== "/" && pathname?.startsWith(tab.href));
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-colors"
              >
                <span
                  className={cn(
                    `icon-[${tab.icon}] size-5`,
                    active
                      ? "text-primary"
                      : isLanding ? "text-white/30" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-bold",
                    active
                      ? "text-primary"
                      : isLanding ? "text-white/30" : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
