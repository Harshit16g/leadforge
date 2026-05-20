"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="py-24 px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto rounded-xl bg-card border border-border p-12 md:p-24 text-center relative overflow-hidden group shadow-lg"
      >
        {/* Decorative background accent */}
        <div className="absolute top-0 right-0 p-24 opacity-10 group-hover:scale-110 transition-transform duration-700">
           <span className="icon-[solar--star-bold-duotone] size-64 text-primary" />
        </div>
        
        <div className="relative z-10 space-y-8">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground leading-tight italic" style={{ fontFamily: 'var(--font-brand)' }}>
            Ready to deploy your <br className="hidden md:block" /> infrastructure?
          </h2>
          <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-sm max-w-xl mx-auto">
            Join the elite organizations powered by LEAEX. Start your execution journey today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="h-16 px-10 rounded-xl text-base font-bold uppercase tracking-widest shadow-lg shadow-primary/20 bg-primary text-primary-foreground border-none transition-all hover:scale-[1.02]">
              <Link href="/register">Get Started Free</Link>
            </Button>
            <div className="text-left hidden md:block border-l border-border pl-6 ml-2">
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Talk to an expert</p>
               <p className="text-foreground font-bold tabular-nums">+91 9876 543 210</p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-border bg-muted/20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="space-y-6">
          <span className="text-2xl font-black tracking-widest uppercase text-primary italic" style={{ fontFamily: "var(--font-brand)" }}>LEAEX</span>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground leading-relaxed">
            The standard in unified service infrastructure. Engineered for mission-critical service execution.
          </p>
          <div className="flex gap-4">
             <span className="icon-[solar--videocamera-record-bold-duotone] text-muted-foreground hover:text-primary transition-colors cursor-pointer size-5" />
             <span className="icon-[solar--camera-bold-duotone] text-muted-foreground hover:text-primary transition-colors cursor-pointer size-5" />
             <span className="icon-[solar--chat-round-line-bold-duotone] text-muted-foreground hover:text-primary transition-colors cursor-pointer size-5" />
          </div>
        </div>
        
        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground mb-6">Platform</h4>
          <ul className="space-y-4">
            {["Features", "Scheduling", "Inventory", "WhatsApp Hub"].map(l => (
              <li key={l}><Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground mb-6">Company</h4>
          <ul className="space-y-4">
            {["About Us", "Pricing", "Careers", "Contact"].map(l => (
              <li key={l}><Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground mb-6">Legal</h4>
          <ul className="space-y-4">
            {["Privacy Policy", "Terms of Service", "Cookie Policy", "SLA"].map(l => (
              <li key={l}><Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          © 2026 LEAEX Technologies. All rights reserved.
        </p>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          Made with <span className="icon-[solar--heart-bold] text-primary size-3" /> in India
        </p>
      </div>
    </footer>
  );
}
