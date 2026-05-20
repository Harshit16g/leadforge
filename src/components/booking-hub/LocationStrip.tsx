"use client";

import { cn } from "@/lib/utils";

interface LocationStripProps {
  bookingId: string;
  hubToken?: string;
  branchName: string | null;
  branchAddress: string | null;
  className?: string;
}

export function LocationStrip({ bookingId, hubToken, branchName, branchAddress, className }: LocationStripProps) {
  if (!branchName && !branchAddress) return null;

  const mapsUrl = branchAddress
    ? `https://maps.google.com/?q=${encodeURIComponent(branchAddress)}`
    : null;

  const icsUrl = hubToken ? `/b/${bookingId}/cal.ics?t=${hubToken}` : null;

  return (
    <div className={cn("rounded-2xl bg-card border border-border p-5 space-y-3 shadow-sm", className)}>
      {branchName && (
        <div className="flex items-start gap-3">
          <span className="icon-[solar--map-point-linear] size-5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">{branchName}</p>
            {branchAddress && <p className="text-xs text-muted-foreground mt-0.5">{branchAddress}</p>}
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors"
          >
            <span className="icon-[solar--map-linear] size-3.5" />
            Get Directions
          </a>
        )}
        {icsUrl && (
          <a
            href={icsUrl}
            download
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors"
          >
            <span className="icon-[solar--calendar-add-linear] size-3.5" />
            Add to Calendar
          </a>
        )}
      </div>
    </div>
  );
}
