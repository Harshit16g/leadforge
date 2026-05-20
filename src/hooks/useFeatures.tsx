"use client";

import { useState, useEffect, createContext, useContext } from "react";

type FeatureState = {
  enabled: boolean;
  limit?: number;
};

type FeaturesContextType = {
  features: Record<string, FeatureState>;
  loading: boolean;
  hasFeature: (key: string) => boolean;
  getLimit: (key: string) => number;
};

const FeaturesContext = createContext<FeaturesContextType | undefined>(undefined);

export function FeaturesProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<Record<string, FeatureState>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/partner/features");
        const json = await res.json();
        if (res.ok) setFeatures(json.features);
      } catch (e) {
        console.error("Failed to load features", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const hasFeature = (key: string) => features[key]?.enabled ?? false;
  const getLimit = (key: string) => features[key]?.limit ?? Infinity;

  return (
    <FeaturesContext.Provider value={{ features, loading, hasFeature, getLimit }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures() {
  const context = useContext(FeaturesContext);
  if (context === undefined) {
    throw new Error("useFeatures must be used within a FeaturesProvider");
  }
  return context;
}
