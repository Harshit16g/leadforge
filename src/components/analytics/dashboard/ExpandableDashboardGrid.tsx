"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { CloseIcon } from "@/components/ExpandableCardGrid";

export interface DashboardCard {
  title: string;
  description: string;
  thumbnail: React.ReactNode;
  content: React.ReactNode | (() => React.ReactNode);
  ctaText?: string;
  ctaLink?: string;
  className?: string;
}

interface ExpandableDashboardGridProps {
  cards: DashboardCard[];
  gridClassName?: string;
}

export function ExpandableDashboardGrid({ cards, gridClassName }: ExpandableDashboardGridProps) {
  const [active, setActive] = useState<DashboardCard | null>(null);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null);
      }
    }

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm h-full w-full z-[60]"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 grid place-items-center z-[100] p-4">
            <motion.button
              key={`button-${active.title}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="flex absolute top-6 right-6 items-center justify-center bg-white dark:bg-neutral-800 rounded-full h-8 w-8 shadow-lg z-[110]"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="w-full max-w-4xl h-full md:h-fit md:max-h-[90%] flex flex-col bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl"
            >
              <motion.div 
                layoutId={`image-${active.title}-${id}`}
                className="w-full bg-neutral-50 dark:bg-neutral-800 p-6 flex justify-center items-center"
              >
                {active.thumbnail}
              </motion.div>

              <div className="flex-1 overflow-y-auto">
                <div className="flex justify-between items-start p-6 border-b border-neutral-100 dark:border-neutral-800">
                  <div>
                    <motion.h3
                      layoutId={`title-${active.title}-${id}`}
                      className="font-bold text-neutral-800 dark:text-neutral-200 text-2xl"
                    >
                      {active.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active.description}-${id}`}
                      className="text-neutral-600 dark:text-neutral-400 text-lg"
                    >
                      {active.description}
                    </motion.p>
                  </div>

                  {active.ctaLink && (
                    <motion.a
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      href={active.ctaLink}
                      className="px-6 py-2 text-sm rounded-full font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      {active.ctaText || "View Details"}
                    </motion.a>
                  )}
                </div>
                <div className="p-6 relative">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-neutral-700 dark:text-neutral-300"
                  >
                    {typeof active.content === "function" ? active.content() : active.content}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      
      <div className={`grid grid-cols-1 gap-6 ${gridClassName ?? "md:grid-cols-2 lg:grid-cols-3"}`}>
        {cards.map((card) => (
          <motion.div
            layoutId={`card-${card.title}-${id}`}
            key={card.title}
            onClick={() => setActive(card)}
            className={`p-4 flex flex-col bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl cursor-pointer hover:shadow-xl transition-all group ${card.className || ""}`}
          >
            <div className="flex gap-4 flex-col w-full h-full">
              <motion.div 
                layoutId={`image-${card.title}-${id}`}
                className="h-48 w-full bg-neutral-50 dark:bg-neutral-800 rounded-2xl flex justify-center items-center overflow-hidden"
              >
                {card.thumbnail}
              </motion.div>
              <div className="flex flex-col flex-1 p-2">
                <motion.h3
                  layoutId={`title-${card.title}-${id}`}
                  className="font-bold text-neutral-800 dark:text-neutral-200 text-lg group-hover:text-primary transition-colors"
                >
                  {card.title}
                </motion.h3>
                <motion.p
                  layoutId={`description-${card.description}-${id}`}
                  className="text-neutral-600 dark:text-neutral-400 text-sm"
                >
                  {card.description}
                </motion.p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}
