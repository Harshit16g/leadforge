"use client"
import { cn } from "@/lib/utils"
import { BootstrapStage } from "@/lib/bootstrap"

const stages = [
  { key: 'session', label: 'Session verified' },
  { key: 'org', label: 'Workspace loaded' },
  { key: 'permissions', label: 'Permissions ready' },
]

const roleMessages = {
  partner: 'Loading command center',
  employee: 'Loading schedule',
  admin: 'Loading controls',
  customer: 'Restoring session',
}

export function BootstrapScreen({
  stage,
  role = 'partner'
}: {
  stage: BootstrapStage
  role?: keyof typeof roleMessages
}) {
  const activeIndex = stages.findIndex(s => s.key === stage)

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
      <div className="w-[320px] bg-card border border-border rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-black text-sm">L</span>
          </div>
          <span className="text-sm font-black tracking-widest text-foreground">LEAEX</span>
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          {stages.map((s, i) => {
            const isDone = i < activeIndex || stage === 'ready'
            const isActive = s.key === stage

            return (
              <div key={s.key} className="flex items-center gap-3">
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                  isDone ? "bg-primary border-primary" :
                  isActive ? "border-primary" :
                  "border-border"
                )}>
                  {isDone && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isActive && !isDone && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  isDone || isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Role message */}
        <p className="text-[10px] font-medium text-muted-foreground text-center mt-8 tracking-wide">
          {roleMessages[role]}…
        </p>
      </div>
    </div>
  )
}
