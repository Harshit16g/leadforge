"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

export function CustomerSearch({
  onSelect,
  initialValue = ""
}: {
  onSelect: (c: { name: string; phone: string }) => void;
  initialValue?: string;
}) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => { if (initialValue) setQuery(initialValue); }, [initialValue]);

  useEffect(() => {
    if (query.length < 3) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/partner/customers?search=${encodeURIComponent(query)}&limit=5&has_phone=true`);
        const data = await res.json();
        setResults(data.data ?? []);
      } catch (e) { console.error(e); } finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => {
          const val = e.target.value;
          setQuery(val);
          if (val.replace(/\D/g, "").length >= 10) {
             onSelect({ name: "", phone: val });
             setQuery("");
          }
        }}
        placeholder="Search directory or enter +91…"
        className="h-11 pl-10 pr-4 rounded-xl"
      />
      <span className="icon-[solar--magnifer-linear] absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
      {searching && <span className="icon-[solar--refresh-circle-bold-duotone] absolute right-3 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin" />}

      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
          {results.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onSelect(c);
                setQuery("");
                setResults([]);
              }}
              className="w-full px-4 py-3 text-left hover:bg-muted/50 flex flex-col group border-b border-border last:border-0"
            >
              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{c.name}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{c.phone}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
