"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const INDUSTRY_TYPES = [
  { value: "salon", label: "Salon", icon: "solar--magic-stick-3-bold-duotone", color: "from-pink-500/20 to-rose-500/10" },
  { value: "spa", label: "Spa", icon: "solar--leaf-bold-duotone", color: "from-emerald-500/20 to-teal-500/10" },
  { value: "barbershop", label: "Barbershop", icon: "solar--scissors-bold-duotone", color: "from-blue-500/20 to-indigo-500/10" },
  { value: "beauty", label: "Nail Studio", icon: "solar--star-bold-duotone", color: "from-purple-500/20 to-violet-500/10" },
  { value: "clinic", label: "Clinic", icon: "solar--heart-pulse-bold-duotone", color: "from-red-500/20 to-orange-500/10" },
  { value: "wellness", label: "Wellness", icon: "solar--meditation-round-bold-duotone", color: "from-amber-500/20 to-yellow-500/10" },
  { value: "fitness", label: "Fitness", icon: "solar--dumbbell-bold-duotone", color: "from-cyan-500/20 to-sky-500/10" },
  { value: "other", label: "Other", icon: "solar--widget-bold-duotone", color: "from-slate-500/20 to-zinc-500/10" },
];

const PRESET_AMENITIES = [
  "AC Studio", "Free Parking", "Female Staff Only", "Male Staff Only",
  "Unisex", "Bridal Packages", "Home Visits", "Online Booking",
  "Cash Only", "Cards Accepted", "UPI Accepted", "Hygienic Tools",
  "Appointment Only", "Walk-ins Welcome", "Private Rooms", "Wheelchair Accessible",
];

interface BranchProfile {
  cover_photo_url?: string | null;
  gallery_urls?: string[];
  amenity_tags?: string[];
  social_links?: { instagram?: string; facebook?: string; google_maps?: string };
  highlight_text?: string | null;
  description?: string | null;
  industry_type?: string | null;
}

interface Props {
  initial: BranchProfile;
  highlight?: string | null;
  onSaved: (updated: BranchProfile) => void;
}

function PulseRing({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="absolute -inset-2 rounded-2xl ring-2 ring-primary animate-pulse pointer-events-none z-10" />
  );
}

export function BranchProfileTab({ initial, highlight, onSaved }: Props) {
  const [industryType, setIndustryType] = useState(initial.industry_type ?? "");
  const [coverUrl, setCoverUrl] = useState(initial.cover_photo_url ?? "");
  const [gallery, setGallery] = useState<string[]>(initial.gallery_urls ?? []);
  const [tags, setTags] = useState<string[]>(initial.amenity_tags ?? []);
  const [social, setSocial] = useState(initial.social_links ?? {});
  const [highlightText, setHighlightText] = useState(initial.highlight_text ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const coverRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File, type: "cover" | "gallery"): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    const res = await fetch("/api/partner/media", { method: "POST", body: fd });
    if (!res.ok) { toast.error("Upload failed"); return null; }
    const { url } = await res.json();
    return url as string;
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const url = await uploadFile(file, "cover");
    if (url) setCoverUrl(url);
    setUploadingCover(false);
  }

  async function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 8 - gallery.length);
    if (!files.length) return;
    setUploadingGallery(true);
    const urls = await Promise.all(files.map((f) => uploadFile(f, "gallery")));
    setGallery((prev) => [...prev, ...(urls.filter(Boolean) as string[])]);
    setUploadingGallery(false);
    e.target.value = "";
  }

  function removeGallery(idx: number) {
    setGallery((prev) => prev.filter((_, i) => i !== idx));
  }

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/partner/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry_type: industryType || null,
          cover_photo_url: coverUrl || null,
          gallery_urls: gallery,
          amenity_tags: tags,
          social_links: social,
          highlight_text: highlightText.trim() || null,
          description: description.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const { data } = await res.json();
      const branch = data?.branches?.[0] ?? {};
      onSaved({
        industry_type: branch.industry_type,
        cover_photo_url: branch.cover_photo_url,
        gallery_urls: branch.gallery_urls,
        amenity_tags: branch.amenity_tags,
        social_links: branch.social_links,
        highlight_text: branch.highlight_text,
        description: branch.description,
      });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10">

      {/* Business Category */}
      <section className="relative space-y-4">
        <PulseRing active={highlight === "industry_type"} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Business Category</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            How your establishment appears in search filters and on the booking page.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {INDUSTRY_TYPES.map((t) => {
            const selected = industryType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setIndustryType(t.value)}
                className={cn(
                  "relative rounded-2xl border-2 p-3 text-left transition-all duration-200 overflow-hidden group",
                  selected
                    ? "border-primary bg-primary/8 shadow-md shadow-primary/15"
                    : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                {selected && (
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60 rounded-2xl", t.color)} />
                )}
                <div className="relative flex flex-col items-center gap-1.5 text-center">
                  <span className={cn(`icon-[${t.icon}] size-5 transition-colors`, selected ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className={cn("text-[9px] font-black uppercase tracking-tight leading-none", selected ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
                    {t.label}
                  </span>
                </div>
                {selected && (
                  <div className="absolute top-1.5 right-1.5 size-3.5 rounded-full bg-primary flex items-center justify-center">
                    <span className="icon-[solar--check-circle-bold-duotone] text-primary-foreground size-2" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Cover Photo */}
      <section className="relative space-y-4">
        <PulseRing active={highlight === "cover_photo_url"} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cover Photo</p>
          <p className="text-xs text-muted-foreground mt-0.5">Main image shown at the top of your booking page and search results.</p>
        </div>
        <div className="flex items-start gap-5">
          <div
            onClick={() => !uploadingCover && coverRef.current?.click()}
            className="relative h-36 w-64 shrink-0 rounded-2xl overflow-hidden border-2 border-dashed border-border cursor-pointer group hover:border-primary transition-colors"
          >
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <span className="icon-[solar--camera-add-bold-duotone] size-8" />
                <span className="text-xs font-bold">Add Cover Photo</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {uploadingCover ? "Uploading…" : "Change Photo"}
              </span>
            </div>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Tips for a great cover photo:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Show your studio space or best work</li>
              <li>Well-lit, high-resolution (min 1200×600)</li>
              <li>Avoid heavy text overlays</li>
            </ul>
            <Button size="sm" variant="outline" className="rounded-xl mt-2"
              onClick={() => coverRef.current?.click()} disabled={uploadingCover}>
              {uploadingCover ? "Uploading…" : "Upload Photo"}
            </Button>
          </div>
        </div>
        <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
      </section>

      {/* Gallery */}
      <section className="space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gallery ({gallery.length}/8)</p>
          <p className="text-xs text-muted-foreground mt-0.5">Showcase your work — shown as a scrollable gallery on your booking page.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {gallery.map((url, i) => (
            <div key={url + i} className="relative h-24 w-24 rounded-xl overflow-hidden group border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />
              <button
                onClick={() => removeGallery(i)}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="icon-[solar--close-circle-bold] size-3.5" />
              </button>
            </div>
          ))}
          {gallery.length < 8 && (
            <button
              onClick={() => galleryRef.current?.click()}
              disabled={uploadingGallery}
              className="h-24 w-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <span className="icon-[solar--add-circle-bold-duotone] size-6" />
              <span className="text-[10px] font-bold">{uploadingGallery ? "…" : "Add"}</span>
            </button>
          )}
        </div>
        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryChange} />
      </section>

      {/* Highlight text */}
      <section className="relative space-y-3">
        <PulseRing active={highlight === "highlight_text"} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tagline / Highlight</p>
          <p className="text-xs text-muted-foreground mt-0.5">Short line shown on your search card — max 80 characters.</p>
        </div>
        <Input
          value={highlightText}
          onChange={(e) => setHighlightText(e.target.value.slice(0, 80))}
          placeholder="e.g. Bhopal's #1 Rated Bridal Studio"
          className="h-11 rounded-xl"
        />
        <p className="text-[10px] text-muted-foreground text-right">{highlightText.length}/80</p>
      </section>

      {/* Description */}
      <section className="relative space-y-3">
        <PulseRing active={highlight === "description"} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">About Your Business</p>
          <p className="text-xs text-muted-foreground mt-0.5">Full description shown on your booking page. Sell yourself!</p>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 600))}
          placeholder="Tell customers what makes your business special — your expertise, specialty services, years of experience…"
          rows={5}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-[10px] text-muted-foreground text-right">{description.length}/600</p>
      </section>

      {/* Amenity Tags */}
      <section className="space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amenities & Features</p>
          <p className="text-xs text-muted-foreground mt-0.5">Select all that apply — shown as chips on your booking page.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_AMENITIES.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                tags.includes(tag)
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Social Links */}
      <section className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Social & Map Links</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["instagram", "facebook", "google_maps"] as const).map((platform) => {
            const icons: Record<string, string> = {
              instagram: "icon-[solar--camera-square-bold-duotone]",
              facebook: "icon-[solar--videocamera-add-bold-duotone]",
              google_maps: "icon-[solar--map-point-bold-duotone]",
            };
            const labels: Record<string, string> = {
              instagram: "Instagram URL",
              facebook: "Facebook URL",
              google_maps: "Google Maps URL",
            };
            return (
              <div key={platform} className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span className={cn(icons[platform], "size-3.5")} />
                  {labels[platform]}
                </label>
                <Input
                  value={(social as Record<string, string>)[platform] ?? ""}
                  onChange={(e) => setSocial((s) => ({ ...s, [platform]: e.target.value }))}
                  placeholder="https://..."
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end pt-2 border-t border-border">
        <Button onClick={handleSave} disabled={saving} className="rounded-xl px-8 font-bold">
          {saving ? "Saving…" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}
