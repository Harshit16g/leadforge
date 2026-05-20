"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/common/BrandLogo";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Standard hydration safety pattern
        setMounted(true);
    }, []);

    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setIsScrolled(currentScrollY > 20);

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

    const closeMenu = () => setMobileMenuOpen(false);

    const navLinks = [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "About", href: "/about" },
        { label: "Partner with Us", href: "/intro", active: pathname === "/intro" },
    ];

    return (
        <nav
            className={cn(
                "fixed top-0 w-full z-50 transition-all duration-300 border-b ease-in-out",
                isVisible ? "translate-y-0" : "-translate-y-full",
                isScrolled
                    ? "bg-background/80 backdrop-blur-lg border-border py-3 shadow-sm"
                    : "bg-transparent border-transparent py-5"
            )}
        >
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-10">
                <div className="flex items-center gap-10">
                    <Link href="/" className="group flex items-center">
                        <BrandLogo variant="full" size="md" className="group-hover:scale-105 transition-transform duration-300" />
                    </Link>

                    <div className="hidden lg:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={cn(
                                    "text-xs font-bold uppercase tracking-[0.2em] transition-colors hover:text-primary",
                                    link.active ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Theme Toggle */}
                    <AnimatedThemeToggler
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 border border-border text-foreground hover:bg-muted transition-colors"
                    />

                    {/* Login/CTA */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            href="/auth"
                            className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Sign In
                        </Link>
                        <Button asChild size="sm" className="h-10 rounded-xl px-6 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
                            <Link href="/register">Get Started</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Trigger */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20"
                    >
                        <span className={cn(
                            "transition-all duration-300",
                            mobileMenuOpen ? "icon-[solar--close-circle-bold-duotone] size-6" : "icon-[solar--map-bold-duotone] size-6"
                        )} />
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={cn(
                "fixed inset-0 top-[64px] z-40 bg-background lg:hidden transition-all duration-500 ease-in-out transform",
                mobileMenuOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            )}>
                <div className="flex flex-col p-8 gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            onClick={closeMenu}
                            className="text-2xl font-bold uppercase tracking-tighter text-foreground"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="h-px bg-border my-4" />
                    <Link href="/auth" onClick={closeMenu} className="text-xl font-bold text-muted-foreground">Sign In</Link>
                    <Button asChild size="lg" onClick={closeMenu} className="h-16 rounded-xl text-base font-bold uppercase tracking-widest mt-4">
                        <Link href="/register">Register Salon</Link>
                    </Button>
                </div>
            </div>
        </nav>
    );
}

