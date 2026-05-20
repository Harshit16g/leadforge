import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ServiceCardProps {
  id: string;
  name: string;
  description?: string;
  category: string;
  duration: number;
  price: number;
  discountedPrice?: number;
  /** Tailwind gradient: "from-violet-600 to-indigo-600" */
  gradientClasses?: string;
  /** Iconify icon name e.g. "solar--scissors-bold-duotone" */
  icon?: string;
  bookingHref?: string;
  className?: string;
}

export function ServiceCard({
  name,
  description,
  category,
  duration,
  price,
  discountedPrice,
  gradientClasses = "from-primary to-primary/60",
  icon = "solar--star-bold-duotone",
  bookingHref = "/search",
  className,
}: ServiceCardProps) {
  return (
    <div className={cn("group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/20", className)}>
      {/* Header gradient */}
      <div className={cn("flex h-28 items-center justify-center bg-gradient-to-br", gradientClasses)}>
        <span className={cn(`icon-[${icon}] size-10 text-white/90 drop-shadow-lg transition-transform group-hover:scale-110`)} />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-foreground leading-tight">{name}</h3>
            <Badge
              variant="secondary"
              className="mt-1 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-muted-foreground/70"
            >
              {category}
            </Badge>
          </div>
        </div>

        {description && (
          <p className="mb-3 line-clamp-2 text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}

        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="icon-[solar--clock-circle-bold-duotone] size-3.5" />
              {duration} min
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-baseline gap-1.5">
              {discountedPrice ? (
                <>
                  <p className="text-base font-black text-primary tabular-nums">₹{discountedPrice}</p>
                  <p className="text-xs font-medium text-muted-foreground line-through tabular-nums">₹{price}</p>
                </>
              ) : (
                <p className="text-base font-black text-primary tabular-nums">₹{price}</p>
              )}
            </div>
            <Button
              size="sm"
              className="h-8 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest shadow-sm shadow-primary/10"
              asChild
            >
              <Link href={bookingHref}>Book</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
