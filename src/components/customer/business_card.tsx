import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BusinessCardProps {
  id: string;
  name: string;
  type: string;
  location: string;
  distance?: string;
  rating: number;
  reviewCount?: number;
  price: number;
  img: string;
  tags?: string[];
  featured?: boolean;
  verified?: boolean;
  openNow?: boolean;
  priority?: boolean;
  branchName?: string;
  slug?: string;
  className?: string;
  /** "list" = horizontal row, "grid" = vertical stack */
  variant?: "list" | "grid";
}

export function BusinessCard({
  id,
  name,
  type,
  location,
  distance,
  rating,
  reviewCount,
  price,
  img,
  tags = [],
  featured = false,
  verified = false,
  openNow,
  priority = false,
  branchName,
  slug,
  className,
  variant = "list",
}: BusinessCardProps) {
  const href = slug ? `/book/${slug}` : `/search?q=${encodeURIComponent(name)}`;

  if (variant === "grid") {
    return (
      <div className={cn("group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20", className)}>
        {/* Image */}
        <div className="relative h-44 w-full overflow-hidden">
          <Image 
            src={img} 
            alt={name} 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority} 
            className="object-cover transition-transform duration-700 group-hover:scale-105" 
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {featured && (
            <div className="absolute left-3 top-3">
              <Badge className="border-none bg-primary px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
                Featured
              </Badge>
            </div>
          )}
          {openNow !== undefined && (
            <div className="absolute bottom-3 left-3">
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold",
                openNow ? "bg-emerald-500/90 text-white" : "bg-black/60 text-white/70"
              )}>
                <span className={cn("size-1.5 rounded-full", openNow ? "bg-white animate-pulse" : "bg-white/40")} />
                {openNow ? "Open Now" : "Closed"}
              </span>
            </div>
          )}
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 backdrop-blur-sm">
            <span className="icon-[solar--star-bold-duotone] size-3 text-yellow-400" />
            <span className="text-[11px] font-black text-white tabular-nums">{rating}</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-sm font-black text-foreground uppercase tracking-tight">{name}</h3>
                {verified && <span className="icon-[solar--verified-check-bold-duotone] size-3.5 shrink-0 text-primary" />}
              </div>
              {branchName && (
                <p className="mt-0.5 text-[10px] font-bold text-primary/80 uppercase tracking-wide">{branchName}</p>
              )}
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{type}</p>
            </div>
          </div>

          <p className="mb-3 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <span className="icon-[solar--map-point-bold-duotone] size-3 shrink-0" />
            <span className="truncate">{location}</span>
            {distance && <span className="shrink-0 text-muted-foreground/60">· {distance}</span>}
          </p>

          {tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-muted-foreground/70">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">From</p>
              <p className="text-base font-black text-primary tabular-nums">₹{price}</p>
            </div>
            <Button className="h-9 rounded-xl bg-primary px-5 text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/10" asChild>
              <Link href={href}>Book Now</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // List variant (default)
  return (
    <div className={cn("group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 sm:flex-row", className)}>
      {/* Image */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden sm:h-auto sm:w-44">
        <Image 
          src={img} 
          alt={name} 
          fill 
          sizes="(max-width: 640px) 100vw, 176px"
          priority={priority} 
          className="object-cover transition-transform duration-700 group-hover:scale-105" 
        />

        {featured && (
          <div className="absolute left-2 top-2">
            <Badge className="border-none bg-primary px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-widest shadow-lg">Featured</Badge>
          </div>
        )}
        {openNow !== undefined && (
          <div className="absolute bottom-2 left-2">
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm",
              openNow ? "bg-emerald-500/90 text-white" : "bg-black/60 text-white/70"
            )}>
              <span className={cn("size-1.5 rounded-full", openNow ? "bg-white animate-pulse" : "bg-white/40")} />
              {openNow ? "Open Now" : "Closed"}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="mb-1 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate font-black text-foreground uppercase tracking-tight">{name}</h3>
                {verified && <span className="icon-[solar--verified-check-bold-duotone] size-4 shrink-0 text-primary" />}
              </div>
              {branchName && (
                <p className="mt-0.5 text-[10px] font-bold text-primary/80 uppercase tracking-wide">{branchName}</p>
              )}
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{type}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-lg bg-muted px-2 py-1 border border-border">
              <span className="icon-[solar--star-bold-duotone] size-3 text-yellow-500" />
              <span className="text-[10px] font-black text-foreground tabular-nums">{rating}</span>
              {reviewCount && <span className="text-[10px] text-muted-foreground">({reviewCount})</span>}
            </div>
          </div>

          <p className="mb-2 flex items-center gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
            <span className="icon-[solar--map-point-bold-duotone] size-3" />
            {location}
            {distance && <span className="text-muted-foreground/60">· {distance}</span>}
          </p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-muted-foreground/70">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Starts from</p>
            <p className="text-lg font-black text-primary tabular-nums">₹{price}</p>
          </div>
          <Button className="h-10 rounded-xl bg-primary px-6 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10 transition-all active:scale-95" asChild>
            <Link href={href}>Book Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
