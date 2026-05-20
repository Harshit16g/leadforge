"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolveRef, setResolveRef] = useState<((val: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts)
      setResolveRef(() => resolve)
      setOpen(true)
    })
  }, [])

  const handleClose = (value: boolean) => {
    setOpen(false)
    if (resolveRef) {
      resolveRef(value)
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(false); }}>
        <DialogContent className="max-w-md rounded-3xl border border-border bg-card shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${options?.variant === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                <span className={`size-6 block ${options?.variant === "destructive" ? "icon-[solar--danger-triangle-bold-duotone]" : "icon-[solar--info-circle-bold-duotone]"}`} />
              </div>
              <DialogTitle className="text-lg font-black text-foreground">{options?.title}</DialogTitle>
            </div>
            <DialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed pl-1">
              {options?.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              className="rounded-xl font-bold h-11 px-6 hover:bg-muted text-xs uppercase tracking-wider cursor-pointer"
            >
              {options?.cancelText || "Cancel"}
            </Button>
            <Button
              variant={options?.variant === "destructive" ? "destructive" : "default"}
              onClick={() => handleClose(true)}
              className="rounded-xl font-bold h-11 px-6 text-xs uppercase tracking-wider cursor-pointer"
            >
              {options?.confirmText || "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider")
  }
  return context.confirm
}
