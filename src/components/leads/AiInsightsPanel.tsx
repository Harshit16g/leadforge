"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiInsightsPanel({ lead, interactions }: { lead: any, interactions: any[] }) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [probability, setProbability] = useState(45);
  const [suggestion, setSuggestion] = useState("Gathering data...");
  const [objection, setObjection] = useState("None detected yet.");

  useEffect(() => {
    // Re-run analysis when interactions change (simulated AI delay)
    setIsAnalyzing(true);
    
    const timer = setTimeout(() => {
      // Very basic simulated heuristics
      let newProb = 45;
      if (lead.score > 70) newProb += 20;
      if (interactions.length > 2) newProb += 15;
      if (lead.notes?.toLowerCase().includes('finance')) newProb += 5;
      if (lead.status === 'negotiation') newProb += 10;
      if (newProb > 98) newProb = 98;

      setProbability(newProb);

      if (lead.status === 'new') {
        setSuggestion("Customer is new. High priority to establish initial contact within 15 mins.");
        setObjection("Insufficient data.");
      } else if (interactions.some(i => i.content?.toLowerCase().includes('expensive') || i.content?.toLowerCase().includes('price'))) {
        setSuggestion("Highlight our ongoing festival discounts and pre-approved finance options.");
        setObjection("Pricing/Budget constraints.");
      } else if (lead.status === 'negotiation') {
        setSuggestion("Customer is likely comparing with competitors. Share comparative advantage sheet.");
        setObjection("Evaluating alternatives.");
      } else {
        setSuggestion("Customer engagement is steady. Recommend scheduling a physical test drive to solidify interest.");
        setObjection("None detected.");
      }

      setIsAnalyzing(false);
    }, 1500); // 1.5s simulated delay

    return () => clearTimeout(timer);
  }, [lead.status, interactions.length, lead.score, lead.notes]);

  return (
    <div className="bg-[#111827] text-white rounded-xl shadow-lg shadow-slate-900/10 overflow-hidden relative transition-all flex flex-col flex-1 min-h-[150px]">
      <div className="absolute top-0 right-0 p-4 opacity-10 flex-shrink-0">
        <Sparkles className={cn("size-24", isAnalyzing ? "animate-pulse" : "")} />
      </div>
      <div className="p-5 relative z-10 flex-1 flex flex-col justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-blue-400 flex-shrink-0">
          {isAnalyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} 
          AI Insights {isAnalyzing && <span className="text-[10px] text-blue-500/80 animate-pulse">Analyzing...</span>}
        </h3>
        
        <div className={cn("space-y-3 transition-opacity duration-500 flex-1 flex flex-col justify-between", isAnalyzing ? "opacity-50" : "opacity-100")}>
          <div>
            <div className="flex justify-between items-end mb-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Conversion Prob.</p>
              <p className="text-base font-black text-emerald-400 leading-none">{probability}%</p>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${probability}%` }}
              />
            </div>
          </div>

          <div className="h-px bg-slate-800/80" />

          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Suggested Action</p>
            <p className="text-xs font-semibold text-slate-200 leading-snug">{suggestion}</p>
          </div>
          
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Objection Detection</p>
            <p className="text-xs font-semibold text-orange-300 leading-snug">{objection}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
