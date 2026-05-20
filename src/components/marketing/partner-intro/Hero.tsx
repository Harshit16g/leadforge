"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Hero() {
  const words = "Service Infrastructure Reimagined.".split(" ");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 py-24">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 z-0 bg-background">
        <motion.div
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-chart-2/20 blur-[120px]"
          animate={{
            x: [0, -40, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 2 }}
        />
        <motion.div
          className="absolute top-[20%] right-[10%] w-[35%] h-[35%] rounded-full bg-chart-1/10 blur-[120px]"
          animate={{
            x: [0, 30, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 1 }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
        {/* Headline with Staggered Word Reveal */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[0.9] italic" style={{ fontFamily: 'var(--font-brand)' }}>
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.2em]"
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subline */}
        <motion.p
          className="text-lg md:text-xl text-muted-foreground font-bold uppercase tracking-[0.2em] max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          Operational Intelligence for Service Businesses. Unified infrastructure for identity resolution, workflow orchestration, and real-time execution.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.5 }}
        >
          <Button asChild size="lg" className="h-16 px-10 rounded-xl text-base font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Link href="/auth?mode=signup">Get Started Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-16 px-10 rounded-xl text-base font-bold uppercase tracking-widest border-2 transition-all hover:bg-muted/50">
            <button onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
              See a demo
            </button>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
