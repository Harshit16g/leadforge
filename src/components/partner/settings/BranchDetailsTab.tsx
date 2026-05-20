"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DraggablePinMap = dynamic(
  () => import("@/components/common/DraggablePinMap").then((m) => m.DraggablePinMap),
  { ssr: false, loading: () => <div className="h-[260px] rounded-2xl bg-muted animate-pulse" /> }
);

interface Props {
  initial: {
    name?: string;
    address?: string;
    address_line2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    contact_phone?: string;
    contact_email?: string;
    latitude?: number | null;
    longitude?: number | null;
    maps_url?: string | null;
  };
  highlight?: string | null;
}

export function BranchDetailsTab({ initial, highlight }: Props) {
  const [form, setForm] = useState({
    name:          initial.name          ?? "",
    address:       initial.address       ?? "",
    address_line2: initial.address_line2 ?? "",
    landmark:      initial.landmark      ?? "",
    city:          initial.city          ?? "",
    state:         initial.state         ?? "",
    pincode:       initial.pincode       ?? "",
    contact_phone: initial.contact_phone ?? "",
    contact_email: initial.contact_email ?? "",
  });
  const [lat, setLat]       = useState<number | null>(initial.latitude ?? null);
  const [lng, setLng]       = useState<number | null>(initial.longitude ?? null);
  const [mapsUrl, setMapsUrl] = useState(initial.maps_url ?? "");

  const handlePinMove = useCallback((la: number, lo: number) => {
    setLat(la);
    setLng(lo);
    setMapsUrl(`https://maps.google.com/?q=${la},${lo}`);
  }, []);
  const [geocoding, setGeocoding] = useState(false);
  const [geoMsg, setGeoMsg]   = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);

  function upd(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function geocode() {
    if (!form.city) { setGeoMsg("Fill in City first."); return; }
    setGeocoding(true); setGeoMsg(null);
    // Try progressively simpler queries until we get a hit
    const attempts = [
      [form.address, form.landmark, form.city, form.state, form.pincode, "India"],
      [form.address, form.city, form.state, "India"],
      [form.landmark, form.city, form.state, "India"],
      [form.city, form.state, "India"],
    ];
    try {
      for (const parts of attempts) {
        const q = parts.filter(Boolean).join(", ");
        if (!q) continue;
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
          { headers: { "Accept-Language": "en" } }
        );
        const hits = await res.json();
        if (hits.length) {
          const { lat: la, lon: lo, display_name } = hits[0];
          const latitude = parseFloat(la), longitude = parseFloat(lo);
          setLat(latitude); setLng(longitude);
          // Don't overwrite a manually pasted URL
          if (!mapsUrl) setMapsUrl(`https://maps.google.com/?q=${latitude},${longitude}`);
          setGeoMsg(`📍 ${display_name.split(",").slice(0, 4).join(", ")}`);
          return;
        }
      }
      setGeoMsg("Could not auto-locate — paste your Google Maps link manually below.");
    } catch { setGeoMsg("Auto-locate failed — paste your Google Maps link manually below."); }
    finally { setGeocoding(false); }
  }

  async function fetchCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    
    setGeocoding(true);
    setGeoMsg("Fetching current location...");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);
        setMapsUrl(`https://maps.google.com/?q=${latitude},${longitude}`);
        setGeoMsg(`📍 GPS detected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setGeocoding(false);
        toast.success("GPS Location detected!");
      },
      (error) => {
        setGeocoding(false);
        let msg = "Could not fetch current location";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied by user";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Location information is unavailable";
        } else if (error.code === error.TIMEOUT) {
          msg = "Location request timed out";
        }
        setGeoMsg(msg);
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/partner/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          latitude:  lat,
          longitude: lng,
          maps_url:  mapsUrl || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Branch details saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const hasPinned = !!(lat && lng);

  return (
    <div className="space-y-6">
      {/* Branch display name */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Branch Name</label>
        <Input value={form.name} onChange={(e) => upd("name", e.target.value)}
          placeholder="e.g. Main Branch / BG Mall Outlet"
          className="h-12 rounded-xl font-semibold" />
        <p className="text-[10px] text-muted-foreground/60 px-1">Location identifier shown to customers when you have multiple branches.</p>
      </div>

      {/* Street address */}
      <div className="space-y-2 relative">
        {highlight === "address" && (
          <span className="absolute -inset-2 rounded-2xl ring-2 ring-primary animate-pulse pointer-events-none z-10" />
        )}
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Street Address</label>
        <Input value={form.address} onChange={(e) => upd("address", e.target.value)}
          placeholder="Shop 12, MG Road"
          className="h-12 rounded-xl font-semibold" />
      </div>

      {/* Address line 2 + Landmark */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Floor / Suite <span className="text-muted-foreground/40 normal-case font-medium">(optional)</span>
          </label>
          <Input value={form.address_line2} onChange={(e) => upd("address_line2", e.target.value)}
            placeholder="2nd Floor, Tower B" className="h-12 rounded-xl font-semibold" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Landmark <span className="text-muted-foreground/40 normal-case font-medium">(optional)</span>
          </label>
          <Input value={form.landmark} onChange={(e) => upd("landmark", e.target.value)}
            placeholder="Near City Mall" className="h-12 rounded-xl font-semibold" />
        </div>
      </div>

      {/* City / State / Pin */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">City</label>
          <Input value={form.city} onChange={(e) => upd("city", e.target.value)}
            placeholder="Bhopal" className="h-12 rounded-xl font-semibold" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">State</label>
          <Input value={form.state} onChange={(e) => upd("state", e.target.value)}
            placeholder="Madhya Pradesh" className="h-12 rounded-xl font-semibold" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pin Code</label>
          <Input value={form.pincode}
            onChange={(e) => upd("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="462001" className="h-12 rounded-xl font-semibold" />
        </div>
      </div>

      {/* Contact phone — LOCKED */}
      <div className="space-y-2 relative">
        {highlight === "contact_phone" && (
          <span className="absolute -inset-2 rounded-2xl ring-2 ring-primary animate-pulse pointer-events-none z-10" />
        )}
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Branch Contact Phone</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 icon-[solar--phone-bold-duotone] size-4 text-muted-foreground/50" />
          <Input value={form.contact_phone} readOnly
            className="h-12 rounded-xl pl-10 font-semibold bg-muted/30 cursor-not-allowed text-muted-foreground" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 icon-[solar--lock-bold-duotone] size-4 text-amber-500" />
        </div>
        <div className="flex items-center gap-2 px-1">
          <span className="icon-[solar--shield-warning-bold-duotone] size-3.5 text-amber-500" />
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
            Contact phone is locked. Contact your Leaex admin to update.
          </p>
        </div>
      </div>

      {/* Contact email */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Branch Contact Email</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 icon-[solar--letter-bold-duotone] size-4 text-muted-foreground/50" />
          <Input type="email" value={form.contact_email} onChange={(e) => upd("contact_email", e.target.value)}
            placeholder="branch@yourstudio.com"
            className="h-12 rounded-xl pl-10 font-semibold" />
        </div>
      </div>

      {/* Map Pin */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Location Pin <span className="text-destructive">*</span>
        </label>
        <p className="text-[10px] text-muted-foreground/70 -mt-1">
          This link is sent to customers via WhatsApp after every session. Pin it precisely.
        </p>

        {/* Auto-locate row */}
        <div className={cn(
          "flex flex-col md:flex-row md:items-center justify-between rounded-2xl border-2 px-5 py-4 gap-4 transition-all",
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
                {hasPinned ? "Location Pinned ✓" : "Autofetch / Locate GPS"}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">
                {hasPinned
                  ? `${lat?.toFixed(5)}, ${lng?.toFixed(5)}`
                  : "Autofetch your GPS coordinates or geocode from address"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={geocode} disabled={geocoding} className="rounded-xl font-bold gap-1.5 h-9 text-xs">
              {geocoding && !geoMsg?.includes("GPS")
                ? <span className="icon-[solar--refresh-circle-bold-duotone] animate-spin size-4" />
                : <span className="icon-[solar--map-arrow-square-bold-duotone] size-4 text-primary" />}
              {hasPinned ? "Re-detect Address" : "Locate from Address"}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchCurrentLocation} disabled={geocoding} className="rounded-xl font-bold gap-1.5 h-9 text-xs border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-600 dark:hover:bg-emerald-950/20">
              {geocoding && geoMsg?.includes("GPS")
                ? <span className="icon-[solar--refresh-circle-bold-duotone] animate-spin size-4 text-emerald-600" />
                : <span className="icon-[solar--gps-bold-duotone] size-4 text-emerald-600" />}
              Autofetch GPS
            </Button>
          </div>
        </div>

        {geoMsg && (
          <p className={cn("text-[10px] font-semibold px-1",
            geoMsg.startsWith("📍") ? "text-emerald-600" : "text-destructive"
          )}>{geoMsg}</p>
        )}

        {/* Draggable map */}
        {hasPinned && lat && lng && (
          <div className="rounded-2xl overflow-hidden border-2 border-emerald-500/30 relative">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="icon-[solar--map-point-bold-duotone] size-3.5" />
                Drag the pin to your exact door
              </span>
              <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer"
                className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 hover:underline">
                Open Google Maps ↗
              </a>
            </div>
            <DraggablePinMap
              lat={lat}
              lng={lng}
              onChange={handlePinMove}
            />
            <div className="bg-muted/80 px-4 py-2 text-[10px] text-muted-foreground font-medium">
              {lat.toFixed(6)}, {lng.toFixed(6)} · Click anywhere on the map to move pin
            </div>
          </div>
        )}

        {/* Manual Google Maps URL fallback */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Or paste Google Maps link manually
          </label>
          <div className="flex gap-2">
            <Input
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/... or https://goo.gl/maps/..."
              className="h-11 rounded-xl font-medium text-xs"
            />
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="h-11 rounded-xl px-3 shrink-0">
                  <span className="icon-[solar--map-arrow-right-bold-duotone] size-4" />
                </Button>
              </a>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground/60 px-1">
            Open Google Maps → search your salon → tap Share → copy link. This exact link is sent to customers.
          </p>
        </div>

        {/* Preview of what gets shared */}
        {mapsUrl && (
          <div className="flex items-start gap-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-3">
            <span className="icon-[solar--chat-round-like-bold-duotone] size-4 text-green-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest">WhatsApp customers will receive:</p>
              <p className="text-xs font-semibold text-green-800 dark:text-green-300 mt-1 truncate">📍 Find us again: {mapsUrl}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button onClick={save} disabled={saving} className="rounded-xl px-8 font-bold">
          {saving ? "Saving…" : "Save Branch Details"}
        </Button>
      </div>
    </div>
  );
}
