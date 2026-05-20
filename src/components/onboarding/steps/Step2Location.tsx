"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, type Variants } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const DraggablePinMap = dynamic(
  () => import("@/components/common/DraggablePinMap").then((m) => m.DraggablePinMap),
  { ssr: false, loading: () => <div className="h-[260px] rounded-2xl bg-muted animate-pulse" /> }
);

interface OperatingHours { open: string; close: string; closed: boolean }

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const DEFAULT_HOURS: OperatingHours = { open: "09:00", close: "20:00", closed: false };
const INITIAL_HOURS: Record<string, OperatingHours> = DAYS.reduce((a, d) => ({ ...a, [d]: { ...DEFAULT_HOURS } }), {});

const DAY_SHORT: Record<string, string> = {
  Monday:"Mon", Tuesday:"Tue", Wednesday:"Wed", Thursday:"Thu",
  Friday:"Fri", Saturday:"Sat", Sunday:"Sun",
};

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { ease: [0.22,1,0.36,1] as any, duration: 0.4 } },
};

interface Props {
  data: Record<string, any>;
  updateData: (d: Record<string, any>) => void;
}

export function Step2Location({ data, updateData }: Props) {
  const loc = (data.location as Record<string, any>) || {
    address: "", city: "", state: "", pincode: "",
    operatingHours: INITIAL_HOURS,
  };
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const upd = (k: string, v: any) => updateData({ location: { ...loc, [k]: v } });

  const updateHour = (day: string, field: keyof OperatingHours, value: string | boolean) => {
    const hours = { ...(loc.operatingHours || INITIAL_HOURS) };
    hours[day] = { ...hours[day], [field]: value };
    upd("operatingHours", hours);
  };

  const handlePinMove = useCallback((la: number, lo: number) => {
    updateData({
      location: {
        ...loc,
        latitude: la,
        longitude: lo,
        maps_url: `https://maps.google.com/?q=${la},${lo}`
      }
    });
  }, [loc, updateData]);

  const syncWeekdays = () => {
    const mon = loc.operatingHours?.["Monday"] || DEFAULT_HOURS;
    const hours = { ...loc.operatingHours };
    ["Tuesday","Wednesday","Thursday","Friday"].forEach((d) => { hours[d] = { ...mon }; });
    upd("operatingHours", hours);
  };

  const geocodeAddress = async () => {
    if (!loc.city) {
      setGeoError("Fill in City first.");
      return;
    }
    setGeocoding(true);
    setGeoError(null);

    const attempts = [
      [loc.address, loc.landmark, loc.city, loc.state, loc.pincode, "India"],
      [loc.address, loc.city, loc.state, "India"],
      [loc.landmark, loc.city, loc.state, "India"],
      [loc.city, loc.state, "India"],
    ];

    try {
      for (const parts of attempts) {
        const query = parts.filter(Boolean).join(", ");
        if (!query.trim()) continue;

        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
        const res  = await fetch(url, { headers: { "Accept-Language": "en" } });
        const hits = await res.json();

        if (hits.length) {
          const { lat, lon, display_name } = hits[0];
          const latitude  = parseFloat(lat);
          const longitude = parseFloat(lon);
          const maps_url  = loc.maps_url || `https://maps.google.com/?q=${latitude},${longitude}`;

          updateData({
            location: { ...loc, latitude, longitude, maps_url },
          });
          setGeoError(`📍 Pinned: ${display_name.split(",").slice(0, 3).join(", ")}`);
          return;
        }
      }
      setGeoError("Could not auto-locate — pin manually on the map below or paste a link.");
    } catch {
      setGeoError("Geocoding failed — check your internet connection.");
    } finally {
      setGeocoding(false);
    }
  };

  const hasPinned = !!(loc.latitude && loc.longitude);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

      {/* Address */}
      <motion.div variants={itemVariants} className="space-y-1.5">
        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Street Address</Label>
        <Input
          placeholder="Shop 12, MG Road, Near City Mall"
          value={loc.address || ""}
          onChange={(e) => upd("address", e.target.value)}
          className="h-14 px-5 rounded-2xl border-2 border-border bg-muted/30 font-semibold placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
        />
      </motion.div>

      {/* Address Line 2 + Landmark */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Floor / Suite <span className="text-muted-foreground/40 normal-case font-medium">(optional)</span>
          </Label>
          <Input
            placeholder="2nd Floor, Tower B"
            value={loc.address_line2 || ""}
            onChange={(e) => upd("address_line2", e.target.value)}
            className="h-12 px-4 rounded-xl border-2 border-border bg-muted/30 font-semibold placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Landmark <span className="text-muted-foreground/40 normal-case font-medium">(optional)</span>
          </Label>
          <Input
            placeholder="Near City Mall"
            value={loc.landmark || ""}
            onChange={(e) => upd("landmark", e.target.value)}
            className="h-12 px-4 rounded-xl border-2 border-border bg-muted/30 font-semibold placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
          />
        </div>
      </motion.div>

      {/* City / State / Pin */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
        {[
          { key: "city",    label: "City",     placeholder: "Bhopal",         type: "text" },
          { key: "state",   label: "State",    placeholder: "Madhya Pradesh",  type: "text" },
          { key: "pincode", label: "Pin Code", placeholder: "462001",          type: "text", maxLen: 6 },
        ].map(({ key, label, placeholder, type, maxLen }) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</Label>
            <Input
              type={type}
              placeholder={placeholder}
              maxLength={maxLen}
              value={loc[key] || ""}
              onChange={(e) => upd(key, key === "pincode" ? e.target.value.replace(/\D/g, "") : e.target.value)}
              className="h-12 px-4 rounded-xl border-2 border-border bg-muted/30 font-semibold placeholder:text-muted-foreground/30 focus:border-primary focus:bg-card transition-all focus:ring-4 focus:ring-primary/8"
            />
          </div>
        ))}
      </motion.div>

      {/* Geo-pin */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className={cn(
          "flex items-center justify-between rounded-2xl border-2 px-5 py-4 transition-all",
          hasPinned ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-muted/20"
        )}>
          <div className="flex items-center gap-3">
            <span className={cn("size-9 rounded-xl flex items-center justify-center shrink-0",
              hasPinned ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
            )}>
              <span className="icon-[solar--map-point-bold-duotone] size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">
                {hasPinned ? "Location Pinned ✓" : "Pin on Map"}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">
                {hasPinned
                  ? `${loc.latitude?.toFixed(4)}, ${loc.longitude?.toFixed(4)}`
                  : "Needed for directions & search ranking"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={geocodeAddress}
            disabled={geocoding}
            className="rounded-xl font-bold shrink-0"
          >
            {geocoding ? (
              <span className="icon-[solar--refresh-circle-bold-duotone] animate-spin size-4" />
            ) : hasPinned ? "Re-detect" : "Auto-locate"}
          </Button>
        </div>
        {geoError && (
          <p className={cn("text-[10px] font-semibold px-1",
            geoError.startsWith("📍") ? "text-emerald-600" : "text-destructive"
          )}>
            {geoError}
          </p>
        )}

        {/* Draggable map */}
        {hasPinned && loc.latitude && loc.longitude && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden border-2 border-emerald-500/30 relative"
          >
            <div className="bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="icon-[solar--map-point-bold-duotone] size-3.5" />
                Drag the pin to your door
              </span>
              <a href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`} target="_blank" rel="noopener noreferrer"
                className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 hover:underline">
                Open Maps ↗
              </a>
            </div>
            <DraggablePinMap
              lat={loc.latitude}
              lng={loc.longitude}
              onChange={handlePinMove}
            />
            <div className="bg-muted/80 px-4 py-2 text-[10px] text-muted-foreground font-medium">
              Click anywhere on the map to move pin
            </div>
          </motion.div>
        )}

        {/* Manual Google Maps URL fallback */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Or paste Google Maps link manually
          </Label>
          <div className="flex gap-2">
            <Input
              value={loc.maps_url || ""}
              onChange={(e) => upd("maps_url", e.target.value)}
              placeholder="https://maps.google.com/... or https://goo.gl/maps/..."
              className="h-11 rounded-xl font-medium text-xs border-2 border-border bg-muted/30 focus:bg-card transition-all"
            />
            {loc.maps_url && (
              <a href={loc.maps_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="h-11 rounded-xl px-3 shrink-0 border-2">
                  <span className="icon-[solar--map-arrow-right-bold-duotone] size-4" />
                </Button>
              </a>
            )}
          </div>
          <p className="text-[9px] text-muted-foreground/60 px-1">
            Search your salon → tap Share → copy link. This link is sent to customers for directions.
          </p>
        </div>

        {/* WhatsApp Preview */}
        {loc.maps_url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3"
          >
            <span className="icon-[solar--chat-round-like-bold-duotone] size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">WhatsApp Preview:</p>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mt-1 truncate">📍 Find us: {loc.maps_url}</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Operating Hours */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Operating Hours</Label>
          <motion.button
            type="button"
            onClick={syncWeekdays}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-[9px] font-black text-primary uppercase tracking-widest px-3 py-1.5 rounded-full bg-primary/8 border border-primary/20 hover:bg-primary/15 transition-colors"
          >
            Copy Mon → Weekdays
          </motion.button>
        </div>

        <div className="space-y-1.5">
          {DAYS.map((day, i) => {
            const h = (loc.operatingHours || INITIAL_HOURS)[day] || DEFAULT_HOURS;
            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + i * 0.04, ease: [0.22,1,0.36,1] }}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200",
                  h.closed
                    ? "bg-muted/20 border-border/40 opacity-50"
                    : "bg-card border-border hover:border-primary/30 shadow-sm"
                )}
              >
                <span className="w-8 text-xs font-black text-foreground">{DAY_SHORT[day]}</span>

                <div className="flex-1 flex items-center justify-center gap-2 mx-2">
                  {!h.closed ? (
                    <>
                      <input
                        type="time"
                        value={h.open}
                        onChange={(e) => updateHour(day, "open", e.target.value)}
                        className="bg-transparent text-xs font-bold text-foreground border-none outline-none focus:ring-0 w-20 tabular-nums"
                      />
                      <span className="text-muted-foreground/40 text-xs font-black">—</span>
                      <input
                        type="time"
                        value={h.close}
                        onChange={(e) => updateHour(day, "close", e.target.value)}
                        className="bg-transparent text-xs font-bold text-foreground border-none outline-none focus:ring-0 w-20 tabular-nums"
                      />
                    </>
                  ) : (
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Closed</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-muted-foreground font-bold hidden sm:block">Off</span>
                  <Switch
                    checked={h.closed === true}
                    onCheckedChange={(v) => updateHour(day, "closed", v)}
                    className="scale-75"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
