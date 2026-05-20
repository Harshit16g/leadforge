"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STEP_LABELS = ["Establishment", "Owner", "Services", "Team", "Plan"];

interface StepLayoutProps {
  step: number;
  title: string;
  subtitle: string;
  onNext: () => void;
  onBack: () => void;
  isNextLoading?: boolean;
  nextLabel?: string;
  direction?: 1 | -1;
  children: React.ReactNode;
}

export function StepLayout({
  step,
  title,
  subtitle,
  onNext,
  onBack,
  isNextLoading,
  nextLabel = "Continue",
  direction = 1,
  children,
}: StepLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <span className="text-2xl font-bold tracking-tight text-foreground">Leaex</span>
        </div>

        {/* Step Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const done    = num < step;
            const current = num === step;
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                    done    && "bg-primary text-primary-foreground",
                    current && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !done && !current && "bg-muted text-muted-foreground"
                  )}
                  title={label}
                >
                  {done ? <span className="icon-[solar--check-read-linear] size-4" /> : String(num).padStart(2, "0")}
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={cn("h-0.5 w-8 rounded-full transition-all", done ? "bg-primary" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <Card>
          <CardHeader className="pb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Step {String(step).padStart(2, "0")} / 05 — {STEP_LABELS[step - 1]}
            </p>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                initial={{ x: direction * 32, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction * -32, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={onBack}
                disabled={step === 1}
                className="gap-1.5"
              >
                <span className="icon-[solar--arrow-left-linear] size-3.5" /> Back
              </Button>

              <Button
                onClick={onNext}
                disabled={isNextLoading}
                className="gap-1.5"
              >
                {isNextLoading && <span className="icon-[solar--refresh-circle-bold-duotone] animate-spin size-3.5" />}
                {nextLabel}
                {!isNextLoading && <span className="icon-[solar--arrow-right-linear] size-3.5" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
