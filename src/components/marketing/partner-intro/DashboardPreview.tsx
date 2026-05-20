"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// --- Mock Components for the "In-App" Dashboard ---

const SidebarItem = ({ icon, active = false }: { icon: string; active?: boolean }) => (
  <div className={cn(
    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
    active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted/50"
  )}>
    <span className={cn(icon, "size-4")} />
  </div>
);

const StatCard = ({ label, value, trend, trendUp = true }: { label: string; value: string; trend: string; trendUp?: boolean }) => (
  <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-1">
    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
    <div className="flex items-baseline justify-between">
      <h4 className="text-lg font-black text-foreground">{value}</h4>
      <span className={cn(
        "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
        trendUp ? "text-status-success-text bg-status-success-bg" : "text-status-danger-text bg-status-danger-bg"
      )}>
        {trend}
      </span>
    </div>
  </div>
);

const OperationRow = ({ time, user, action, status = "active" }: { time: string; user: string; action: string; status?: "active" | "completed" }) => (
  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
      {user.charAt(0)}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-bold text-foreground truncate">{user} <span className="font-medium text-muted-foreground">{action}</span></p>
      <p className="text-[9px] text-muted-foreground">{time}</p>
    </div>
    <div className={cn(
      "w-1.5 h-1.5 rounded-full shrink-0",
      status === "active" ? "bg-primary animate-pulse" : "bg-muted-foreground/40"
    )} />
  </div>
);

export function DashboardPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.5], [15, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.9, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [100, 0]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section id="demo" ref={containerRef} className="py-24 px-6 bg-muted/30 overflow-hidden">
      <div className="max-w-7xl mx-auto text-center mb-16 space-y-4">
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight italic" style={{ fontFamily: 'var(--font-brand)' }}>
          Command Center <br className="hidden md:block" /> at your fingertips
        </h2>
        <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-sm max-w-2xl mx-auto leading-relaxed">
          One unified infrastructure to manage your entire business operation from anywhere.
        </p>
      </div>

      <motion.div
        style={{ rotateX, scale, y, perspective: 1000 }}
        className="max-w-6xl mx-auto"
      >
        {/* Browser Frame */}
        <div className="rounded-2xl border-4 border-border shadow-atmospheric overflow-hidden bg-card transition-all duration-700">
          <div className="h-10 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            </div>
            <div className="mx-auto bg-background/50 rounded-md h-6 w-64 md:w-96 flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-border/50">
              app.leaex.com/partner/dashboard
            </div>
            <div className="w-20" /> {/* Spacer */}
          </div>

          <div className="aspect-[16/10] bg-background relative flex overflow-hidden">
            
            {/* 1. Sidebar */}
            <div className="w-14 border-r border-border flex flex-col items-center py-6 gap-6 shrink-0">
               <SidebarItem icon="icon-[solar--widget-bold-duotone]" active />
               <SidebarItem icon="icon-[solar--calendar-bold-duotone]" />
               <SidebarItem icon="icon-[solar--users-group-two-rounded-bold-duotone]" />
               <SidebarItem icon="icon-[solar--box-bold-duotone]" />
               <SidebarItem icon="icon-[solar--chart-bold-duotone]" />
               <div className="mt-auto">
                 <SidebarItem icon="icon-[solar--settings-bold-duotone]" />
               </div>
            </div>

            {/* 2. Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
               {/* Header */}
               <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-foreground">Operational Overview</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase border border-emerald-500/20">Live</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-8 h-8 rounded-full bg-muted border border-border" />
                  </div>
               </header>

               {/* Content Scroll Area */}
               <div className="flex-1 overflow-hidden p-6 space-y-6">
                  {/* KPI Strip */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                     <StatCard label="Today Revenue" value="₹24,840" trend="+12.5%" />
                     <StatCard label="Active Sessions" value="18" trend="+2" />
                     <StatCard label="Utilization" value="85%" trend="High" trendUp={false} />
                     <StatCard label="Queue Length" value="4" trend="-15%" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                     {/* Execution Graph Mockup */}
                     <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8">
                           <h4 className="text-xs font-black uppercase tracking-widest">Revenue Velocity</h4>
                           <div className="flex gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <div className="w-2 h-2 rounded-full bg-muted" />
                           </div>
                        </div>
                        
                        {/* Mock Chart SVG */}
                        <svg className="w-full h-48 text-primary/20" viewBox="0 0 400 100" preserveAspectRatio="none">
                           <path d="M0,80 Q50,75 100,60 T200,40 T300,50 T400,20 L400,100 L0,100 Z" fill="currentColor" />
                           <path d="M0,80 Q50,75 100,60 T200,40 T300,50 T400,20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-primary/40" />
                        </svg>

                        <div className="absolute bottom-8 left-8 right-8 flex justify-between opacity-30 text-[10px] font-bold uppercase tracking-widest">
                           <span>09:00</span>
                           <span>12:00</span>
                           <span>15:00</span>
                           <span>18:00</span>
                           <span>21:00</span>
                        </div>
                     </div>

                     {/* Live Operations Feed */}
                     <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
                        <h4 className="text-xs font-black uppercase tracking-widest mb-6">Live Execution</h4>
                        <div className="space-y-1">
                           <OperationRow user="Rahul" action="started Haircut" time="2 mins ago" />
                           <OperationRow user="Anita" action="completed Massage" time="15 mins ago" status="completed" />
                           <OperationRow user="Suresh" action="updated Inventory" time="45 mins ago" status="completed" />
                           <OperationRow user="Priya" action="signed in" time="1 hour ago" status="completed" />
                           <OperationRow user="Kiran" action="started Styling" time="1 hour ago" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Overlays for depth (Subtle) */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
