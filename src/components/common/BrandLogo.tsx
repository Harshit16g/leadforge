import React from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "full" | "symbol" | "wordmark";
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}


export function BrandLogo({ variant = "full", className, size = "md" }: BrandLogoProps) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-12",
    lg: "size-16",
    xl: "size-24",
  };

  const wordmarkSizes = {
    sm: "text-xs tracking-[0.3em]",
    md: "text-sm tracking-[0.4em]",
    lg: "text-xl tracking-[0.4em]",
    xl: "text-3xl tracking-[0.5em]",
  };

  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      {(variant === "full" || variant === "symbol") && (
        <div className={cn(
          sizeClasses[size], 
          "relative flex items-center justify-center shrink-0 group"
        )}>
          {/* Subtle Glow Effect */}
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <img 
            src="/logo.png" 
            alt="LEAEX" 
            className="w-full h-full object-contain dark:invert dark:brightness-[2] drop-shadow-sm transition-all duration-500 group-hover:scale-110" 
          />
        </div>
      )}
      {(variant === "full" || variant === "wordmark") && (
        <span
          className={cn(
            "font-black uppercase whitespace-nowrap text-foreground tracking-tighter transition-all duration-300 group-hover:tracking-[0.5em]",
            wordmarkSizes[size]
          )}
          style={{ fontFamily: "var(--font-brand)" }}
        >
          L E Λ Ξ X
        </span>
      )}
    </div>
  );
}
