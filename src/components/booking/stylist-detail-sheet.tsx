"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { StylistSummary } from "./stylist-card"

interface StylistDetailSheetProps {
  stylist: StylistSummary | null
  open: boolean
  onClose: () => void
  onBook: (stylist: StylistSummary) => void
}

export function StylistDetailSheet({ stylist, open, onClose, onBook }: StylistDetailSheetProps) {
  const [workIdx, setWorkIdx] = useState(0)
  const [imgIdx, setImgIdx] = useState(0)

  const s = stylist
  if (!s) return null

  const currentWork = s.works[workIdx]
  const images = currentWork?.media_urls ?? (s.photo_url ? [s.photo_url] : [])

  function prevWork() { setWorkIdx(i => Math.max(0, i - 1)); setImgIdx(0) }
  function nextWork() { setWorkIdx(i => Math.min(s!.works.length - 1, i + 1)); setImgIdx(0) }
  function prevImg()  { setImgIdx(i => Math.max(0, i - 1)) }
  function nextImg()  { setImgIdx(i => Math.min(images.length - 1, i + 1)) }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-y-auto">
        {/* Image hero / works gallery */}
        <div className="relative h-72 bg-muted overflow-hidden">
          {images[imgIdx] ? (
            <img
              src={images[imgIdx]}
              alt={currentWork?.title ?? s.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
              <span className="icon-[solar--user-bold-duotone] size-24 text-primary/20" />
            </div>
          )}

          {/* Image navigation */}
          {images.length > 1 && (
            <>
              <Button variant="ghost" size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8"
                onClick={prevImg}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8"
                onClick={nextImg}>
                <ChevronRight className="size-4" />
              </Button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={cn("w-1.5 h-1.5 rounded-full transition-all", i === imgIdx ? "bg-white" : "bg-white/40")} />
                ))}
              </div>
            </>
          )}

          {/* Work label overlay */}
          {currentWork && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="text-white text-xs font-black uppercase tracking-widest">{currentWork.title}</p>
              {currentWork.media_urls.length > 1 && (
                <p className="text-white/60 text-[9px] font-bold uppercase mt-0.5">{imgIdx + 1}/{images.length} photos</p>
              )}
            </div>
          )}
        </div>

        {/* Profile info */}
        <div className="p-6 space-y-6">
          <SheetHeader className="text-left space-y-1 p-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle className="text-2xl font-black uppercase tracking-tight">{s.name}</SheetTitle>
                {s.tagline && (
                  <p className="text-sm text-muted-foreground italic mt-1">&ldquo;{s.tagline}&rdquo;</p>
                )}
              </div>
              {s.years_experience > 0 && (
                <div className="shrink-0 text-center bg-primary/10 rounded-2xl p-3 border border-primary/10">
                  <p className="text-2xl font-black text-primary leading-none">{s.years_experience}</p>
                  <p className="text-[8px] font-black text-primary/70 uppercase tracking-widest mt-0.5">yrs</p>
                </div>
              )}
            </div>
          </SheetHeader>

          {/* Specialities */}
          {s.specialities.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Specialities</p>
              <div className="flex flex-wrap gap-2">
                {s.specialities.map((sp) => (
                  <span key={sp} className="px-3 py-1 bg-primary/5 border border-primary/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary">
                    {sp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Works carousel */}
          {s.works.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Portfolio</p>
                <div className="flex items-center gap-1">
                  <button onClick={prevWork} disabled={workIdx === 0}
                    className="w-6 h-6 rounded-lg border border-border flex items-center justify-center disabled:opacity-30">
                    <ChevronLeft className="size-3" />
                  </button>
                  <span className="text-[9px] font-black text-muted-foreground tabular-nums">{workIdx + 1}/{s.works.length}</span>
                  <button onClick={nextWork} disabled={workIdx === s.works.length - 1}
                    className="w-6 h-6 rounded-lg border border-border flex items-center justify-center disabled:opacity-30">
                    <ChevronRight className="size-3" />
                  </button>
                </div>
              </div>

              {/* Thumbnail strip */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {s.works.map((w, i) => (
                  <button key={w.id} onClick={() => { setWorkIdx(i); setImgIdx(0) }}
                    className={cn(
                      "shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                      i === workIdx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                    )}>
                    {w.media_urls[0] ? (
                      <img src={w.media_urls[0]} alt={w.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="icon-[solar--gallery-linear] size-5 text-muted-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {currentWork?.tags && currentWork.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {currentWork.tags.map((t) => (
                    <span key={t} className="text-[8px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md uppercase">#{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Instagram link */}
          {(s as any).instagram_url && (
            <a href={(s as any).instagram_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              <span className="icon-[solar--link-circle-linear] size-4" />
              View on Instagram
            </a>
          )}

          <Button
            className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 group"
            onClick={() => { onBook(s); onClose() }}
          >
            <span className="icon-[solar--calendar-bold-duotone] size-4 mr-2" />
            Book with {s.name.split(" ")[0]}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
