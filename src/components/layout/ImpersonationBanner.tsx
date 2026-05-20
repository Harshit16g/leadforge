"use client"

import { Button } from "@/components/ui/button"

export function ImpersonationBanner() {
  const isImpersonating = false

  if (!isImpersonating) return null

  return (
    <div className="bg-amber-500/100/10 border-b border-amber-500/20 p-2">
      <div className="container flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-amber-600">
          You are currently viewing this account as an administrator.
        </p>
        <Button variant="outline" size="sm" className="h-8 border-amber-500/20 hover:bg-amber-500/100/10">
          Exit Impersonation
        </Button>
      </div>
    </div>
  )
}
