'use client'

import { useState } from 'react';
import { X, Sparkles, Trophy, ShieldCheck, BadgePercent, ArrowRight } from 'lucide-react';

export function WinningPitchesDialog({ vehicle, financing, budget }: { vehicle: string, financing: string, budget: string }) {
  const [open, setOpen] = useState(false);

  const isCreta = vehicle.toLowerCase().includes('creta') || vehicle.toLowerCase().includes('suv') || vehicle.toLowerCase().includes('tucson');

  const pitches = [
    {
      title: "Category Dominance & Safety Pitch",
      icon: ShieldCheck,
      color: "text-emerald-500 bg-emerald-50 border-emerald-100",
      content: isCreta 
        ? "Focus heavily on the SmartSense Level 2 ADAS suite (17 autonomous features). Remind the buyer that it's the highest-rated safety platform in the mid-size SUV class. Highlight the panoramic sunroof and dual-zone climate control to capture family members' interest."
        : "Highlight the premium build quality of the i20 Asta. Contrast its advanced Electronic Stability Control (ESC) and 6-airbags standard configuration against competitors like Baleno. Mention the sleek digital cluster and Bose audio system."
    },
    {
      title: "Financing & Value Prop Pitch",
      icon: BadgePercent,
      color: "text-blue-500 bg-blue-50 border-blue-100",
      content: financing.toLowerCase().includes('assistance') || financing.toLowerCase().includes('need')
        ? "Leverage HSR Motors' exclusive banking partner tie-ups (HDFC & ICICI). Offer the competitive 8.45% ROI with a 100% processing fee waiver, highlighting immediate 2-hour digital approval to simplify their buying process."
        : "Leverage their pre-approved finance status. Pivot immediately to upselling high-value accessories or the extended 5-year shield warranty, showing they can easily amortize it into their existing approval bracket."
    },
    {
      title: "Competitor Comparison & Exchange Pitch",
      icon: Trophy,
      color: "text-amber-500 bg-amber-50 border-amber-100",
      content: `Present HSR Motors' guaranteed trade-in program. If they have an existing car, offer a ₹25,000 exchange top-up bonus. Remind them that Hyundai provides a 3-Year Unlimited KM warranty, outclassing competitors' standard packages.`
    }
  ];

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="mt-3 text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
      >
        View winning pitches <ArrowRight className="size-3" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" /> Tailored Conversion Pitches
              </h2>
              <button type="button" onClick={() => setOpen(false)} className="p-2 hover:bg-muted rounded-full">
                <X className="size-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 leading-snug">
                Based on interest in <span className="font-bold">{vehicle}</span> with a budget of <span className="font-bold">{budget}</span> and financing status "<span className="font-bold">{financing}</span>".
              </div>

              <div className="space-y-4">
                {pitches.map((pitch, i) => {
                  const Icon = pitch.icon;
                  return (
                    <div key={i} className="border border-slate-100 rounded-xl p-4 space-y-2 hover:shadow-sm transition-all bg-white">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${pitch.color}`}>
                          <Icon className="size-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{pitch.title}</h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{pitch.content}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-border flex justify-end">
              <button 
                onClick={() => setOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                Close pitches
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
