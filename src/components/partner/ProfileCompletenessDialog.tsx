"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Priority = "critical" | "high" | "medium";

interface Issue {
  field: string;
  label: string;
  priority: Priority;
  route?: string;
}

const PRIORITY_ORDER: Record<Priority, number> = { critical: 0, high: 1, medium: 2 };
const PRIORITY_STYLES: Record<Priority, { dot: string; badge: string }> = {
  critical: { dot: "bg-destructive",  badge: "text-destructive" },
  high:     { dot: "bg-amber-500",    badge: "text-amber-600 dark:text-amber-400" },
  medium:   { dot: "bg-blue-500",     badge: "text-blue-600 dark:text-blue-400" },
};

const SNOOZE_KEY   = "leaex_completeness_snoozed_until";
const SNOOZE_HOURS = 24;

export function ProfileCompletenessDialog() {
  const router = useRouter();
  const [issues, setIssues]   = useState<Issue[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [snoozed, setSnoozed]   = useState(false);
  const [fetched, setFetched]   = useState(false);

  const hasCritical = issues.some((i) => i.priority === "critical");
  const score = Math.max(0, Math.min(100, Math.round(((8 - issues.length) / 8) * 100)));

  // silent=true means update issue list but never re-expand the dialog
  const load = useCallback(async (silent = false) => {
    try {
      const res  = await fetch("/api/partner/completeness");
      const json = await res.json();
      const raw: Issue[] = json.issues ?? [];
      const sorted = [...raw].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
      setIssues(sorted);
      setFetched(true);

      if (sorted.length === 0) {
        setExpanded(false);
        setSnoozed(false);
        return;
      }

      if (!silent) {
        // Only on first load: expand unless snoozed (snooze applies to all issues)
        const snoozedUntil = localStorage.getItem(SNOOZE_KEY);
        const isSnoozed    = snoozedUntil ? Date.now() < Number(snoozedUntil) : false;
        setSnoozed(isSnoozed);
        if (!isSnoozed) setExpanded(true);
      }
    } catch {
      // fail silently
    }
  }, []);

  // Expand on mount only
  useEffect(() => { load(false); }, [load]);

  // Silently refresh issue list every 2 min (never re-expands)
  useEffect(() => {
    const interval = setInterval(() => load(true), 120_000);
    return () => clearInterval(interval);
  }, [load]);

  function snooze() {
    if (hasCritical) return; // can't snooze critical issues
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_HOURS * 60 * 60 * 1000));
    setSnoozed(true);
    setExpanded(false);
  }

  function goFix(route: string) {
    setExpanded(false);
    router.push(route);
    // Silent re-fetch after navigation — never re-expands
    setTimeout(() => load(true), 3000);
  }

  // Nothing to show
  if (!fetched || issues.length === 0) return null;

  const barColor = score < 50 ? "bg-destructive" : score < 80 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <>
      <AnimatePresence>
        {expanded && (
          <>
            {/* Backdrop (non-blocking — pointer-events only on dialog) */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] pointer-events-none"
            />

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-lg rounded-2xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:right-6 sm:left-auto sm:w-[440px]"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    hasCritical ? "bg-red-100 dark:bg-red-950" : "bg-amber-100 dark:bg-amber-950"
                  )}>
                    <span className={cn(
                      "icon-[solar--danger-triangle-bold-duotone] size-5",
                      hasCritical ? "text-destructive" : "text-amber-600 dark:text-amber-400"
                    )} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Profile {score}% complete</p>
                    <p className="text-xs text-muted-foreground">
                      {hasCritical
                        ? `${issues.filter((i) => i.priority === "critical").length} critical issue${issues.filter((i) => i.priority === "critical").length > 1 ? "s" : ""} blocking your listing`
                        : "Complete your profile to appear in search results"}
                    </p>
                  </div>
                </div>
                {!hasCritical && (
                  <button onClick={() => setExpanded(false)}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <span className="icon-[solar--minimize-bold-duotone] size-4" />
                  </button>
                )}
              </div>

              {/* Progress */}
              <div className="mx-5 mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
                    transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${barColor}`} />
                </div>
              </div>

              {/* Issues */}
              <ul className="mt-3 max-h-60 overflow-y-auto px-5 pb-1 space-y-1">
                {issues.map((issue) => {
                  const s = PRIORITY_STYLES[issue.priority];
                  return (
                    <li key={issue.field}>
                      <button
                        onClick={() => issue.route && goFix(issue.route)}
                        disabled={!issue.route}
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted disabled:cursor-default"
                      >
                        <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                        <span className="flex-1 text-sm text-foreground">{issue.label}</span>
                        {issue.route && (
                          <span className={`flex items-center gap-1 text-xs font-bold ${s.badge} opacity-0 group-hover:opacity-100 transition-opacity`}>
                            Fix <span className="icon-[solar--arrow-right-bold] size-3" />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border px-5 py-3">
                {hasCritical ? (
                  <p className="text-[10px] text-destructive font-semibold flex items-center gap-1.5">
                    <span className="icon-[solar--shield-warning-bold-duotone] size-3.5" />
                    Critical issues cannot be dismissed
                  </p>
                ) : (
                  <button onClick={snooze}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Remind me in 24h
                  </button>
                )}
                <button
                  onClick={() => issues[0]?.route && goFix(issues[0].route)}
                  disabled={!issues[0]?.route}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Fix top issue →
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sticky mini-widget when collapsed but issues remain */}
      <AnimatePresence>
        {!expanded && issues.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={() => setExpanded(true)}
            className={cn(
              "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-xl font-bold text-xs transition-all",
              hasCritical
                ? "bg-destructive text-white shadow-destructive/30 animate-pulse"
                : "bg-amber-500 text-white shadow-amber-500/30"
            )}
          >
            <span className="icon-[solar--danger-triangle-bold-duotone] size-4" />
            {score}% complete
            {hasCritical && (
              <span className="bg-white/20 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                {issues.filter((i) => i.priority === "critical").length} critical
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
