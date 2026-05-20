"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ViewRange = 'TODAY' | 'WEEK' | 'MONTH' | 'QUARTER';
export type AnalysisWindow = '30D' | '90D' | '180D' | '1Y' | '2Y' | 'ALL';

export interface DashboardFilters {
  viewRange: ViewRange;
  analysisWindow: AnalysisWindow;
}

interface DashboardFiltersContextType {
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
  isWelcomeExpanded: boolean;
  setIsWelcomeExpanded: (expanded: boolean) => void;
}

const DashboardFiltersContext = createContext<DashboardFiltersContextType | undefined>(undefined);

export function DashboardFiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilters>({
    viewRange: 'WEEK',
    analysisWindow: '180D'
  });

  const [isWelcomeExpanded, setIsWelcomeExpanded] = useState(false);

  // Auto-set smart defaults when viewRange changes
  useEffect(() => {
    const defaults: Record<ViewRange, AnalysisWindow> = {
      TODAY: '90D',
      WEEK: '180D',
      MONTH: '1Y',
      QUARTER: '2Y'
    };
    setFilters(f => ({ ...f, analysisWindow: defaults[f.viewRange] }));
  }, [filters.viewRange]);

  // Handle welcome banner morphing / collapse logic
  useEffect(() => {
    const lastShown = localStorage.getItem('welcomeShown');
    const today = new Date().toDateString();

    if (lastShown !== today) {
      setIsWelcomeExpanded(true);
      const timer = setTimeout(() => {
        setIsWelcomeExpanded(false);
        localStorage.setItem('welcomeShown', today);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setIsWelcomeExpanded(false);
    }
  }, []);

  return (
    <DashboardFiltersContext.Provider value={{ filters, setFilters, isWelcomeExpanded, setIsWelcomeExpanded }}>
      {children}
    </DashboardFiltersContext.Provider>
  );
}

export function useDashboardFilters() {
  const context = useContext(DashboardFiltersContext);
  if (!context) {
    throw new Error("useDashboardFilters must be used within a DashboardFiltersProvider");
  }
  return context;
}
