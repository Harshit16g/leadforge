"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Tag, Check, X, Loader2, Sparkles, Plus, Lock, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updateLead } from "@/app/actions/leads";
import { toast } from "sonner";
import { getAvatarFallbackUrl } from "@/lib/utils/avatar";

interface LeadProfilePanelProps {
  lead: any;
  initialMeta: {
    vehicle: string;
    budget: string;
    fuel: string;
    financing: string;
    location: string;
    notesText: string;
    tags: string[];
  };
}

const VEHICLE_CATALOG = [
  "Hyundai i20 Asta",
  "Hyundai Creta SX (O) Turbo",
  "Hyundai Verna SX",
  "Hyundai Alcazar Signature",
  "Hyundai Tucson Signature",
  "Kia Seltos GTX+",
  "Kia Sonet HTX"
];

const BUDGET_OPTIONS = [
  "₹8L - ₹11L",
  "₹11L - ₹14L",
  "₹14L - ₹18L",
  "₹18L - ₹25L",
  "₹25L+"
];

const FINANCING_OPTIONS = [
  "Needs Assistance",
  "Pre-approved",
  "Self-Financed",
  "Financing Denied"
];

const FUEL_OPTIONS = [
  "Petrol",
  "Diesel",
  "Electric",
  "Hybrid"
];

const TAG_CATEGORIES = {
  "Vehicle Preferences": [
    "SUV Buyer",
    "Sedan Lover",
    "Hatchback Fan",
    "Premium Buyer",
    "Creta Fan",
    "Seltos Fan"
  ],
  "Customer Profile": [
    "VIP Customer",
    "First Time Buyer",
    "Fleet Account",
    "Individual Buyer",
    "Business Owner"
  ],
  "Deal Progression": [
    "High Urgency",
    "Low Urgency",
    "Hot Lead",
    "Cold Lead",
    "Active Prospect",
    "Direct Buyer"
  ],
  "Finance & Budget": [
    "Financing Likely",
    "Cash Buyer",
    "High Budget",
    "Value Conscious",
    "Pre-approved"
  ]
};

export function LeadProfilePanel({ lead, initialMeta }: LeadProfilePanelProps) {
  const { role } = useAuth();
  const isManager = role === "manager";

  // Active inline field being edited
  const [editingField, setEditingField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [phone, setPhone] = useState(lead.phone || "");
  const [email, setEmail] = useState(lead.email || "");
  const [location, setLocation] = useState(initialMeta.location);
  const [vehicle, setVehicle] = useState(initialMeta.vehicle);
  const [budget, setBudget] = useState(initialMeta.budget);
  const [fuel, setFuel] = useState(initialMeta.fuel);
  const [financing, setFinancing] = useState(initialMeta.financing);
  
  // Tag states
  const [tags, setTags] = useState<string[]>(initialMeta.tags);
  const [newTagText, setNewTagText] = useState("");
  const [showAddTagSheet, setShowAddTagSheet] = useState(false);

  // Display states
  const [currentMeta, setCurrentMeta] = useState(initialMeta);
  const [currentPhone, setCurrentPhone] = useState(lead.phone || "");
  const [currentEmail, setCurrentEmail] = useState(lead.email || "");

  // Tag helper
  function computeTagsForChange(newVehicle: string, newBudget: string, newFinancing: string, currentTags: string[]) {
    let updated = [...currentTags];
    
    // 1. SUV condition
    const isSUV = ["Creta", "Seltos", "Tucson", "Alcazar"].some(name => newVehicle.includes(name));
    if (isSUV && !updated.includes("SUV Buyer")) {
      updated.push("SUV Buyer");
    } else if (!isSUV && updated.includes("SUV Buyer")) {
      updated = updated.filter(t => t !== "SUV Buyer");
    }

    // 2. High Budget condition
    const isHighBudget = ["₹14L", "₹18L", "₹25L"].some(bg => newBudget.includes(bg));
    if (isHighBudget && !updated.includes("High Budget")) {
      updated.push("High Budget");
    } else if (!isHighBudget && updated.includes("High Budget")) {
      updated = updated.filter(t => t !== "High Budget");
    }

    // 3. Finance condition
    if (newFinancing === "Pre-approved" && !updated.includes("Financing Likely")) {
      updated.push("Financing Likely");
    } else if (newFinancing !== "Pre-approved" && updated.includes("Financing Likely")) {
      updated = updated.filter(t => t !== "Financing Likely");
    }

    return Array.from(new Set(updated));
  }

  // Central save helper for inline modifications
  async function updateProfileData({
    newPhone = phone,
    newEmail = email,
    newLocation = location,
    newVehicle = vehicle,
    newBudget = budget,
    newFuel = fuel,
    newFinancing = financing,
    newTags = tags
  }) {
    setLoading(true);
    try {
      const serializedNotes = JSON.stringify({
        notes: currentMeta.notesText,
        vehicle: newVehicle,
        budget: newBudget,
        fuel: newFuel,
        financing: newFinancing,
        location: newLocation,
        tags: newTags
      });

      const payload: any = {
        notes: serializedNotes
      };
      if (isManager) {
        payload.phone = newPhone;
        payload.email = newEmail;
      }

      await updateLead(lead.id, payload);

      setCurrentMeta({
        vehicle: newVehicle,
        budget: newBudget,
        fuel: newFuel,
        financing: newFinancing,
        location: newLocation,
        notesText: currentMeta.notesText,
        tags: newTags
      });
      
      if (isManager) {
        setCurrentPhone(newPhone);
        setCurrentEmail(newEmail);
      }
      
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error("Failed to save changes");
    } finally {
      setLoading(false);
      setEditingField(null);
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    const nextTags = tags.filter(t => t !== tagToRemove);
    setTags(nextTags);
    updateProfileData({ newTags: nextTags });
  }

  function handleToggleTagInSheet(tagOption: string) {
    const nextTags = tags.includes(tagOption)
      ? tags.filter(t => t !== tagOption)
      : [...tags, tagOption];
    setTags(nextTags);
    updateProfileData({ newTags: nextTags });
  }

  function handleAddNewCustomTagFromSheet() {
    const trimmed = newTagText.trim();
    if (trimmed && !tags.includes(trimmed)) {
      const nextTags = [...tags, trimmed];
      setTags(nextTags);
      setNewTagText("");
      updateProfileData({ newTags: nextTags });
      toast.success(`Custom tag "${trimmed}" created`);
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-5 flex-shrink-0 relative">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="relative group">
          <img
            src={getAvatarFallbackUrl(lead.id)}
            alt={lead.name}
            className="w-20 h-20 rounded-full object-cover border border-border shadow-sm"
          />
          {loading && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center z-20">
              <Loader2 className="size-5 animate-spin text-blue-500" />
            </div>
          )}
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5 justify-center">
            {lead.name}
          </h2>
          <p className="text-sm font-medium text-muted-foreground">{lead.business_name || "Individual Buyer"}</p>
        </div>
      </div>

      <div className="h-px bg-border/60" />

      {/* Row details with direct inline triggers */}
      <div className="space-y-4">
        {/* Phone */}
        <div className="flex items-start gap-3 group relative">
          <Phone className="size-4 text-muted-foreground/60 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</p>
              {!isManager && <span title="Manager only"><Lock className="size-3 text-orange-400/80" /></span>}
            </div>
            {editingField === "phone" && isManager ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => updateProfileData({})}
                  onKeyDown={(e) => e.key === "Enter" && updateProfileData({})}
                  className="px-2 py-0.5 bg-muted border border-border rounded text-xs outline-none focus:border-blue-500 text-foreground w-40 animate-in fade-in zoom-in-95 duration-100"
                  autoFocus
                />
              </div>
            ) : (
              <div 
                onClick={() => isManager && setEditingField("phone")}
                className={`text-sm font-medium ${isManager ? "cursor-pointer hover:bg-muted/40 rounded px-1 -ml-1 transition-all text-blue-500 hover:underline" : "text-foreground"}`}
              >
                {currentPhone || "No phone"}
              </div>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-3 group relative">
          <Mail className="size-4 text-muted-foreground/60 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</p>
              {!isManager && <span title="Manager only"><Lock className="size-3 text-orange-400/80" /></span>}
            </div>
            {editingField === "email" && isManager ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => updateProfileData({})}
                  onKeyDown={(e) => e.key === "Enter" && updateProfileData({})}
                  className="px-2 py-0.5 bg-muted border border-border rounded text-xs outline-none focus:border-blue-500 text-foreground w-48 animate-in fade-in zoom-in-95 duration-100"
                  autoFocus
                />
              </div>
            ) : (
              <div 
                onClick={() => isManager && setEditingField("email")}
                className={`text-sm font-medium ${isManager ? "cursor-pointer hover:bg-muted/40 rounded px-1 -ml-1 transition-all text-blue-500 hover:underline" : "text-foreground"}`}
              >
                {currentEmail || "No email"}
              </div>
            )}
          </div>
        </div>

        {/* Location / Address */}
        <div className="flex items-start gap-3 group relative">
          <MapPin className="size-4 text-muted-foreground/60 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</p>
              {!isManager && <span title="Manager only"><Lock className="size-3 text-orange-400/80" /></span>}
            </div>
            {editingField === "location" && isManager ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onBlur={() => updateProfileData({})}
                  onKeyDown={(e) => e.key === "Enter" && updateProfileData({})}
                  className="px-2 py-0.5 bg-muted border border-border rounded text-xs outline-none focus:border-blue-500 text-foreground w-48 animate-in fade-in zoom-in-95 duration-100"
                  autoFocus
                />
              </div>
            ) : (
              <div 
                onClick={() => isManager && setEditingField("location")}
                className={`text-sm font-medium ${isManager ? "cursor-pointer hover:bg-muted/40 rounded px-1 -ml-1 transition-all text-foreground" : "text-foreground"}`}
              >
                {currentMeta.location}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-border/60" />

      {/* Dynamic Metadata selectors directly inline */}
      <div className="space-y-4">
        {/* Interested Vehicle */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
            Interested In <ChevronDown className="size-3 text-muted-foreground" />
          </p>
          {editingField === "vehicle" ? (
            <select
              value={vehicle}
              onChange={(e) => {
                const val = e.target.value;
                const nextTags = computeTagsForChange(val, budget, financing, tags);
                setVehicle(val);
                setTags(nextTags);
                updateProfileData({ newVehicle: val, newTags: nextTags });
              }}
              onBlur={() => setEditingField(null)}
              className="px-2 py-1 bg-muted border border-border rounded text-xs outline-none focus:border-blue-500 text-foreground cursor-pointer w-full transition-all"
              autoFocus
            >
              {VEHICLE_CATALOG.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          ) : (
            <div 
              onClick={() => setEditingField("vehicle")}
              className="text-sm font-bold text-foreground cursor-pointer hover:bg-muted/40 rounded px-1.5 py-0.5 -ml-1 transition-all inline-block"
            >
              {currentMeta.vehicle}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Budget */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              Budget <ChevronDown className="size-3 text-muted-foreground" />
            </p>
            {editingField === "budget" ? (
              <select
                value={budget}
                onChange={(e) => {
                  const val = e.target.value;
                  const nextTags = computeTagsForChange(vehicle, val, financing, tags);
                  setBudget(val);
                  setTags(nextTags);
                  updateProfileData({ newBudget: val, newTags: nextTags });
                }}
                onBlur={() => setEditingField(null)}
                className="px-2 py-1 bg-muted border border-border rounded text-xs outline-none focus:border-blue-500 text-foreground cursor-pointer w-full"
                autoFocus
              >
                {BUDGET_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            ) : (
              <div 
                onClick={() => setEditingField("budget")}
                className="text-sm font-medium text-foreground cursor-pointer hover:bg-muted/40 rounded px-1.5 py-0.5 -ml-1 transition-all inline-block"
              >
                {currentMeta.budget}
              </div>
            )}
          </div>

          {/* Fuel */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              Fuel <ChevronDown className="size-3 text-muted-foreground" />
            </p>
            {editingField === "fuel" ? (
              <select
                value={fuel}
                onChange={(e) => {
                  const val = e.target.value;
                  setFuel(val);
                  updateProfileData({ newFuel: val });
                }}
                onBlur={() => setEditingField(null)}
                className="px-2 py-1 bg-muted border border-border rounded text-xs outline-none focus:border-blue-500 text-foreground cursor-pointer w-full"
                autoFocus
              >
                {FUEL_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            ) : (
              <div 
                onClick={() => setEditingField("fuel")}
                className="text-sm font-medium text-foreground cursor-pointer hover:bg-muted/40 rounded px-1.5 py-0.5 -ml-1 transition-all inline-block"
              >
                {currentMeta.fuel}
              </div>
            )}
          </div>

          {/* Financing */}
          <div className="col-span-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              Financing <ChevronDown className="size-3 text-muted-foreground" />
            </p>
            {editingField === "financing" ? (
              <select
                value={financing}
                onChange={(e) => {
                  const val = e.target.value;
                  const nextTags = computeTagsForChange(vehicle, budget, val, tags);
                  setFinancing(val);
                  setTags(nextTags);
                  updateProfileData({ newFinancing: val, newTags: nextTags });
                }}
                onBlur={() => setEditingField(null)}
                className="px-2 py-1 bg-muted border border-border rounded text-xs outline-none focus:border-blue-500 text-foreground cursor-pointer w-full"
                autoFocus
              >
                {FINANCING_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            ) : (
              <div 
                onClick={() => setEditingField("financing")}
                className="text-sm font-medium text-foreground cursor-pointer hover:bg-muted/40 rounded px-1.5 py-0.5 -ml-1 transition-all inline-block"
              >
                {currentMeta.financing}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-border/60" />

      {/* Quick Tags Symmetrical View with Add Tag Bottom Sheet */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="size-3" /> Quick Tags
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          {tags.map((tag) => (
            <span
              key={tag}
              className="pl-2 pr-1 py-0.5 text-[10px] font-bold rounded border bg-muted text-foreground border-border flex items-center gap-1 transition-all group"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="p-0.5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded transition-colors cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          
          <button
            type="button"
            onClick={() => setShowAddTagSheet(true)}
            className="px-2.5 py-0.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-[10px] font-bold rounded border border-blue-500/20 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="size-3" /> Add tag
          </button>
        </div>
      </div>

      {/* Sliding Tag Selector Bottom Sheet */}
      {showAddTagSheet && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setShowAddTagSheet(false)} 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity" 
          />
          
          {/* Bottom Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl p-6 transition-all transform duration-300 translate-y-0 animate-in slide-in-from-bottom max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4 border-b border-border/80 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Tag className="size-5 text-blue-500" />
                <div>
                  <h3 className="text-base font-bold text-foreground">Extensive Tag Selector</h3>
                  <p className="text-[11px] text-muted-foreground">Select multiple tags to enrich this customer profile</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddTagSheet(false)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Tags grouped beautifully by category */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin py-2 flex-1">
              {Object.entries(TAG_CATEGORIES).map(([category, list]) => (
                <div key={category} className="space-y-1.5">
                  <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">{category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {list.map((tagOption) => {
                      const isSelected = tags.includes(tagOption);
                      return (
                        <button
                          key={tagOption}
                          type="button"
                          onClick={() => handleToggleTagInSheet(tagOption)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/20"
                              : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/80 hover:border-border"
                          }`}
                        >
                          {tagOption}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Tag creator in sheet */}
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 flex-shrink-0">
              <input
                type="text"
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value)}
                placeholder="Create custom tag..."
                className="flex-1 px-3 py-1.5 bg-muted/50 border border-border rounded-lg text-xs outline-none focus:border-blue-500 text-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNewCustomTagFromSheet();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddNewCustomTagFromSheet}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus className="size-3.5" /> Create
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
