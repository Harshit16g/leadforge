"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    title: "Lifecycle Orchestration",
    icon: "icon-[solar--calendar-mark-bold-duotone]",
    desc: "AI-driven scheduling and execution paths to optimize resource utilization and throughput."
  },
  {
    title: "Identity Resolution",
    icon: "icon-[solar--users-group-two-rounded-bold-duotone]",
    desc: "Unified customer infrastructure with behavioral intelligence and automated lifecycle triggers."
  },
  {
    title: "Signal Gateway",
    icon: "icon-[solar--chat-round-dots-bold-duotone]",
    desc: "Mission-critical communication layer for real-time notifications and automated outreach."
  },
  {
    title: "Operational Intelligence",
    icon: "icon-[solar--graph-up-bold-duotone]",
    desc: "Deep analytics and real-time execution monitoring to drive data-informed growth strategies."
  },
  {
    title: "Workforce Governance",
    icon: "icon-[solar--user-check-bold-duotone]",
    desc: "Comprehensive team orchestration with performance tracking and automated commission logic."
  },
  {
    title: "Supply Chain Grid",
    icon: "icon-[solar--box-bold-duotone]",
    desc: "Real-time inventory infrastructure with automated replenishment and operational visibility."
  }
];

export function Features() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight italic" style={{ fontFamily: 'var(--font-brand)' }}>
          Infrastructure for <br className="hidden md:block" /> Unified Operations
        </h2>
        <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-sm max-w-2xl mx-auto">
          Built for precision execution and scalable service infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ 
              duration: 0.5, 
              delay: i * 0.1,
              type: "spring",
              damping: 20
            }}
            className="group p-8 rounded-xl bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-500"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
              <span className={cn(f.icon, "size-7 text-primary group-hover:text-white transition-colors")} />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-3">{f.title}</h3>
            <p className="text-muted-foreground font-medium leading-relaxed">
              {f.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
