"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    name: "Priya S.",
    business: "Glow Salon, Jaipur",
    quote: "We reduced our booking chaos by 80%. Customers love the automated WhatsApp updates and the professional look it gives our business.",
    rating: 5
  },
  {
    name: "Rahul M.",
    business: "Urban Groom, Pune",
    quote: "The scheduler pays for itself. My staff utilization went from 60% to 85% within the first two months. Highly recommended for any serious owner.",
    rating: 5
  },
  {
    name: "Anita K.",
    business: "Serene Spa, Lucknow",
    quote: "Finally, a platform that understands Indian salons. The pricing is perfect and the support team is always there to help with onboarding.",
    rating: 5
  }
];

export function Testimonials() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000, stopOnInteraction: false })]);

  return (
    <section className="py-24 bg-muted/50 border-y border-border/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight">
          Success stories <br className="hidden md:block" /> from our partners
        </h2>
      </div>

      <div className="embla" ref={emblaRef}>
        <div className="embla__container flex">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="embla__slide flex-[0_0_100%] min-w-0 px-6">
              <div className="max-w-3xl mx-auto bg-card border border-border p-8 md:p-12 rounded-xl shadow-atmospheric relative text-center">
                <div className="flex justify-center gap-1 mb-8">
                  {[...Array(t.rating)].map((_, i) => (
                    <span key={i} className="icon-[solar--star-bold] text-status-warning-text size-5" />
                  ))}
                </div>
                
                <blockquote className="text-xl md:text-2xl font-bold italic leading-relaxed text-foreground mb-8">
                  &quot;{t.quote}&quot;
                </blockquote>
                
                <div>
                  <p className="font-bold uppercase tracking-widest text-primary text-sm">{t.name}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{t.business}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .embla {
          overflow: hidden;
        }
        .embla__container {
          display: flex;
        }
        .embla__slide {
          flex: 0 0 100%;
          min-w: 0;
        }
      `}</style>
    </section>
  );
}
