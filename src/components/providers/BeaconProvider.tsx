"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { FaviconBeaconEngine } from "@/lib/favicon-beacon-engine";
import { BeaconStateManager, BeaconInternalState } from "@/lib/beacon-state-manager";

interface BeaconContextType {
  beacon: BeaconStateManager;
  state: BeaconInternalState;
}

const BeaconContext = createContext<BeaconContextType | undefined>(undefined);

export function BeaconProvider({ children }: { children: React.ReactNode }) {
  const [internalState, setInternalState] = useState<BeaconInternalState>({
    persistent: "idle",
    event: "none",
    overlay: { symbol: "none", persistent: false },
    eventElapsedMs: 0,
    badgeCount: 0,
  });

  const [isTabHidden, setIsTabHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  const managerRef = useRef<BeaconStateManager | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  if (!managerRef.current) {
    managerRef.current = new BeaconStateManager((s) => {
      setInternalState({
        persistent: s.persistent,
        event: s.event,
        overlay: s.overlay,
        eventElapsedMs: s.eventElapsedMs,
        badgeCount: s.badgeCount,
      });
    });
  }

  const lastUriRef = useRef<string>("");
  
  // 1. Monitor Environmental Policies
  useEffect(() => {
    const handleVisibility = () => setIsTabHidden(document.hidden);
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotion = (e: MediaQueryListEvent | MediaQueryList) => {
      setReducedMotion(e.matches);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener("change", handleMotion);
    handleMotion(motionQuery);
    setIsTabHidden(document.hidden);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", handleMotion);
    };
  }, []);

  // 2. The Frame Mutation Loop (Governance Throttling)
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    // High FPS only for events or processing
    const needsHighFPS = internalState.event !== "none" || internalState.persistent === "processing";
    
    // Aerospace Standard: 8 FPS for events, 2 FPS for background breathe
    const interval = needsHighFPS ? 125 : 500; 
    
    intervalRef.current = setInterval(() => {
      // 12s Stillness Governance: Only trigger breathe at specific intervals
      const now = Date.now();
      const isBreathingCycle = (Math.floor(now / 1000) % 12) === 0;
      
      if (needsHighFPS || isBreathingCycle) {
        managerRef.current?.tick();
      }
      // Removed the redundant setInternalState heartbeat that caused app-wide re-renders
    }, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [internalState.event, internalState.persistent, reducedMotion]);

  // 3. The Renderer (Engine → DOM)
  useEffect(() => {
    // 3a. Generate the Frame
    const dataUri = FaviconBeaconEngine.render({
      ...internalState,
      isTabHidden,
      reducedMotion,
    });

    // 3b. Stillness Check: Don't touch the DOM if URI hasn't changed
    if (dataUri === lastUriRef.current) return;
    lastUriRef.current = dataUri;

    // 3c. Force Browser Update (The "Swap" Technique)
    let link = document.getElementById("leaex-beacon-link") as HTMLLinkElement;
    if (!link) {
      const existingIcon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (existingIcon) {
        link = existingIcon;
        link.id = "leaex-beacon-link";
      } else {
        link = document.createElement("link");
        link.id = "leaex-beacon-link";
        link.rel = "icon";
        link.type = "image/svg+xml";
        document.head.appendChild(link);
      }
    }

    const newLink = document.createElement("link");
    newLink.id = "leaex-beacon-link";
    newLink.rel = "icon";
    newLink.type = "image/svg+xml";
    newLink.href = dataUri;

    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    document.head.appendChild(newLink);

    // Logging only on events or every 12s breathe
    if (internalState.event !== "none" || (Math.floor(Date.now() / 1000) % 12 === 0)) {
       console.debug(`[BeaconEngine] ${internalState.persistent} | Event: ${internalState.event}`);
    }
  }, [internalState, isTabHidden, reducedMotion]);

  return (
    <BeaconContext.Provider value={{ beacon: managerRef.current, state: internalState }}>
      {children}
    </BeaconContext.Provider>
  );
}

export function useBeacon() {
  const context = useContext(BeaconContext);
  if (context === undefined) {
    throw new Error("useBeacon must be used within a BeaconProvider");
  }
  return context.beacon;
}

// Low-level state hook for testing/UI
export function useBeaconState() {
  const context = useContext(BeaconContext);
  if (context === undefined) {
    throw new Error("useBeaconState must be used within a BeaconProvider");
  }
  return context.state;
}
