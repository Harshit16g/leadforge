"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { Button } from "@/components/ui/button";
import type { AgentLayer } from "@/lib/ai/llm";

interface ModelOption {
  layer: AgentLayer;
  label: string;
  description: string;
  model: string;
  provider: "nvidia" | "mistral" | "alibaba" | "minimaxai/minimax-m2.5";
  badge?: string;
  badgeColor?: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    layer: "normal",
    label: "Fast Mode",
    description: "Optimised for speed — bookings, lookups, quick answers",
    model: "Qwen3 30B",
    provider: "alibaba",
    badge: "~3s",
    badgeColor: "text-emerald-500 bg-emerald-500/10",
  },
  {
    layer: "reasoning",
    label: "Reasoning Mode",
    description: "Complex analysis, strategy, scheduling conflicts",
    model: "Qwen3 Next 80B",
    provider: "alibaba",
    badge: "Deep",
    badgeColor: "text-purple-500 bg-purple-500/10",
  },
  {
    layer: "ultra",
    label: "Ultra Mode",
    description: "Highest fidelity — reports, campaigns, multi-step operations",
    model: "MiniMax M2.5",
    provider: "nvidia",
    badge: "Best",
    badgeColor: "text-amber-500 bg-amber-500/10",
  },
  {
    layer: "design",
    label: "Strategy Mode",
    description: "Marketing campaigns, automation workflows, growth strategy",
    model: "Nemotron Super 49B",
    provider: "nvidia",
    badge: "Strategy",
    badgeColor: "text-blue-500 bg-blue-500/10",
  },
];

interface AIModelPickerProps {
  selected: AgentLayer;
  onSelect: (layer: AgentLayer) => void;
}

export function AIModelPicker({ selected, onSelect }: AIModelPickerProps) {
  const [open, setOpen] = useState(false);
  const current = MODEL_OPTIONS.find((m) => m.layer === selected) ?? MODEL_OPTIONS[0];

  return (
    <ModelSelector open={open} onOpenChange={setOpen}>
      <ModelSelectorTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] bg-card border-border hover:bg-muted/50 transition-all active:scale-95 flex items-center gap-2"
        >
          <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-black", current.badgeColor)}>
            {current.badge}
          </span>
          {current.label}
          <span className="icon-[solar--alt-arrow-down-bold-duotone] size-3 text-muted-foreground" />
        </Button>
      </ModelSelectorTrigger>

      <ModelSelectorContent title="Select AI Model">
        <ModelSelectorInput placeholder="Search models…" />
        <ModelSelectorList>
          <ModelSelectorGroup heading="Available Models">
            {MODEL_OPTIONS.map((opt) => (
              <ModelSelectorItem
                key={opt.layer}
                value={opt.layer}
                onSelect={() => {
                  onSelect(opt.layer);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer rounded-lg",
                  selected === opt.layer && "bg-primary/5"
                )}
              >
                <div className="mt-0.5 shrink-0">
                  <ModelSelectorLogo
                    provider={opt.provider}
                    className="size-4"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <ModelSelectorName className="text-xs font-black uppercase tracking-widest">
                      {opt.label}
                    </ModelSelectorName>
                    {opt.badge && (
                      <span className={cn("px-1.5 py-0.5 rounded-full text-[8px] font-black", opt.badgeColor)}>
                        {opt.badge}
                      </span>
                    )}
                    {selected === opt.layer && (
                      <span className="icon-[solar--check-circle-bold-duotone] size-3.5 text-primary ml-auto" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{opt.description}</p>
                  <p className="text-[9px] text-muted-foreground/60 mt-0.5 font-mono">{opt.model}</p>
                </div>
              </ModelSelectorItem>
            ))}
          </ModelSelectorGroup>
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}
