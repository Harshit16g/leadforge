"use client";

import { motion } from "framer-motion";

const LOGOS = [
  "Urban Groom", "Glow Salon", "Serene Spa", "Royal Cuts", 
  "The Barber Shop", "Elite Makeover", "Wellness Hub", "Zenith Spa"
];

export function SocialProof() {
  return (
    <section className="py-12 bg-muted/50 border-y border-border/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">
          Orchestrating operations for 500+ elite service organizations
        </p>
      </div>

      <div className="relative flex overflow-x-hidden group">
        <div className="animate-marquee flex items-center gap-12 whitespace-nowrap px-6 group-hover:pause">
          {[...LOGOS, ...LOGOS].map((logo, i) => (
            <div 
              key={i} 
              className="text-xl md:text-2xl font-bold text-muted-foreground/40 hover:text-primary transition-colors cursor-default select-none uppercase tracking-tighter"
            >
              {logo}
            </div>
          ))}
        </div>

        <style jsx>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
          }
          .pause {
            animation-play-state: paused;
          }
        `}</style>
      </div>
    </section>
  );
}
