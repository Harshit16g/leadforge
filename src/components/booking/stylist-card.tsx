"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ManagedAvatar } from "@/components/common"
import { getAvatarFallbackUrl } from "@/lib/utils/avatar"

export interface StylistSummary {
  id: string
  name: string
  photo_url: string | null
  tagline: string | null
  specialities: string[]
  years_experience: number
  works: { id: string; title: string; media_urls: string[]; tags: string[] }[]
}

interface StylistCardProps {
  stylist: StylistSummary
  selected?: boolean
  onSelect?: () => void
  onKnowMore?: () => void
}

export function StylistCard({ stylist, selected, onSelect, onKnowMore }: StylistCardProps) {
  const firstWorkImage = stylist.works[0]?.media_urls?.[0]

  return (
    <Card
      className={cn(
        "w-[200px] shrink-0 cursor-pointer border transition-all duration-300 overflow-hidden",
        selected
          ? "border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10"
          : "border-border hover:border-primary/40 hover:shadow-md"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-0">
        {/* Photo */}
        <div className="relative h-[220px] bg-muted overflow-hidden">
          <ManagedAvatar 
            userId={stylist.id} 
            name={stylist.name} 
            initialUrl={stylist.photo_url}
            fallbackUrl={getAvatarFallbackUrl(stylist.id, undefined)}
            className="w-full h-full rounded-none"
          />

          {/* Work preview strip */}
          {firstWorkImage && (
            <div className="absolute bottom-0 left-0 right-0 h-12 flex gap-0.5 overflow-hidden">
              {stylist.works.slice(0, 3).map((w) =>
                w.media_urls[0] ? (
                  <img
                    key={w.id}
                    src={w.media_urls[0]}
                    alt={w.title}
                    className="flex-1 h-full object-cover opacity-80"
                  />
                ) : null
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-1.5 left-2 text-[8px] font-black text-white/80 uppercase tracking-widest">
                {stylist.works.length} work{stylist.works.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {selected && (
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <span className="icon-[solar--check-circle-bold-duotone] size-4 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-3">
          <div>
            <p className="text-sm font-black text-foreground uppercase tracking-tight leading-none mb-1">
              {stylist.name}
            </p>
            {stylist.tagline && (
              <p className="text-[10px] text-muted-foreground italic leading-tight line-clamp-1">
                &ldquo;{stylist.tagline}&rdquo;
              </p>
            )}
          </div>

          {stylist.years_experience > 0 && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary uppercase tracking-widest">
              <span className="icon-[solar--star-bold-duotone] size-3" />
              {stylist.years_experience}yr exp
            </span>
          )}

          {stylist.specialities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {stylist.specialities.slice(0, 2).map((s) => (
                <span key={s} className="px-1.5 py-0.5 bg-muted rounded-md text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                  {s}
                </span>
              ))}
              {stylist.specialities.length > 2 && (
                <span className="px-1.5 py-0.5 bg-muted rounded-md text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                  +{stylist.specialities.length - 2}
                </span>
              )}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 rounded-lg text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5"
            onClick={(e) => { e.stopPropagation(); onKnowMore?.() }}
          >
            Know More
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
