"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export function ThemeToggle() {
  return (
    <AnimatedThemeToggler 
      className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 border border-border text-foreground hover:bg-muted transition-colors"
    />
  );
}
