import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ProductCardProps {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  discountedPrice?: number;
  img: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  isNew?: boolean;
  priority?: boolean;
  onAddToCart?: (id: string) => void;
  className?: string;
}

export function ProductCard({
  id,
  name,
  brand,
  category,
  price,
  discountedPrice,
  img,
  rating,
  reviewCount,
  inStock = true,
  isNew = false,
  priority = false,
  onAddToCart,
  className,
}: ProductCardProps) {
  const discount = discountedPrice
    ? Math.round(((price - discountedPrice) / price) * 100)
    : null;

  return (
    <div className={cn("group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20", className)}>
      {/* Image */}
      <div className="relative h-52 w-full overflow-hidden bg-muted">
        <Image
          src={img}
          alt={name}
          fill
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isNew && (
            <Badge className="border-none bg-primary px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-widest shadow-md">
              New
            </Badge>
          )}
          {discount && (
            <Badge className="border-none bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-widest shadow-md">
              -{discount}%
            </Badge>
          )}
        </div>
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <span className="rounded-full bg-destructive/90 px-4 py-1.5 text-xs font-black text-white uppercase tracking-widest">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{brand}</p>
        <h3 className="mb-1 line-clamp-2 text-sm font-black text-foreground leading-snug">{name}</h3>

        <Badge
          variant="secondary"
          className="mb-3 w-fit rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-muted-foreground/70"
        >
          {category}
        </Badge>

        {rating !== undefined && (
          <div className="mb-3 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-3",
                  i < Math.floor(rating)
                    ? "icon-[solar--star-bold-duotone] text-yellow-500"
                    : "icon-[solar--star-outline] text-border"
                )}
              />
            ))}
            {reviewCount !== undefined && (
              <span className="ml-1 text-[10px] text-muted-foreground">({reviewCount})</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
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
            disabled={!inStock}
            onClick={() => onAddToCart?.(id)}
            className="h-8 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest shadow-sm shadow-primary/10 disabled:opacity-40"
          >
            <span className="icon-[solar--cart-large-2-bold-duotone] mr-1.5 size-3.5" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
