/**
 * LEAEX Beacon Engine™ — High-Performance Favicon Mutation
 * Handles SVG generation and Data URI conversion for runtime operational telemetry.
 * Implements 'Celebratory' severity and Interaction Semantics.
 */

export type PersistentState = "idle" | "active" | "processing" | "offline";
export type AttentionEvent = "none" | "alert" | "completion" | "human" | "celebratory";
export type SemanticSymbol = "none" | "success" | "ai" | "welcome" | "live" | "warning" | "milestone";

export interface BeaconOverlay {
  symbol: SemanticSymbol;
  persistent?: boolean;
}

export interface BeaconOptions {
  persistent: PersistentState;
  event: AttentionEvent;
  overlay: BeaconOverlay;
  eventElapsedMs: number;
  badgeCount: number;
  isTabHidden: boolean;
  reducedMotion: boolean;
}

const COLORS = {
  idle: "#0EA5E9",      // Tactical Blue
  active: "#22D3EE",    // Cyan
  processing: "#22D3EE", // Cyan
  alert: "#EF4444",     // Crimson
  completion: "#22C55E", // Green
  celebratory: "#10B981", // Emerald
  offline: "#94A3B8",   // Steel
};

export class FaviconBeaconEngine {
  static render(options: BeaconOptions): string {
    const { 
      persistent, 
      event, 
      overlay,
      eventElapsedMs, 
      badgeCount, 
      isTabHidden, 
      reducedMotion 
    } = options;
    
    let activeColor = COLORS[persistent];
    if (event === "alert") activeColor = COLORS.alert;
    if (event === "celebratory") activeColor = COLORS.celebratory;
    if (event === "completion" || overlay.symbol === "success") activeColor = COLORS.active;

    const isHighSignal = event !== "none" || overlay.symbol !== "none" || isTabHidden;
    const signalScale = isHighSignal ? 1.4 : 1.0;
    
    let pulseIntensity = 1;
    let orbitRadius = 14;
    let glowOpacity = 0;
    let orbitAngle = 0;

    if (!reducedMotion) {
      if (persistent === "processing") {
        orbitAngle = (Date.now() / 125 * 15) % 360;
      } else if (persistent === "active") {
        glowOpacity = 0.15;
      }

      // --- Interaction Semantics Architecture ---

      if (event === "alert" || overlay.symbol === "warning") {
        // Pulse sequence based on elapsed MS (~120ms pauses vs ~100ms pulses)
        const cycle = eventElapsedMs % 500;
        pulseIntensity = cycle < 250 ? 1 : 0.2;
        glowOpacity = pulseIntensity * 0.5;
      } 
      else if (event === "celebratory") {
        // Soft Burst Sequence (Fade over 1000ms)
        glowOpacity = Math.max(0, 1 - (eventElapsedMs / 1000));
        pulseIntensity = 1;
        orbitRadius = 0;
      }
      else if (event === "completion" || overlay.symbol === "success") {
        if (eventElapsedMs < 160) {
          orbitRadius = 14 - (eventElapsedMs / 160 * 14);
          orbitAngle = (Date.now() / 125 * 25) % 360;
          pulseIntensity = 1;
        } else if (eventElapsedMs < 320) {
          orbitRadius = 0;
          glowOpacity = 1 - ((eventElapsedMs - 160) / 160);
          pulseIntensity = 1;
        } else {
          glowOpacity = 0.2;
          pulseIntensity = 1;
        }
      }
    }

    const glyphPaths = `
      <path d="M4 4L12 12M20 20L28 28M28 4L20 12M12 20L4 28" 
            stroke="${activeColor}" 
            stroke-width="5" 
            stroke-linecap="square" 
            opacity="${persistent === 'offline' ? 0.3 : pulseIntensity}" 
      />
    `;

    let overlays = "";

    // 1. Orbital Layer
    if (orbitRadius > 2 && (persistent === "processing" || (event === "completion" && eventElapsedMs < 160))) {
      overlays += `
        <circle cx="16" cy="16" r="${orbitRadius}" 
                stroke="${activeColor}" 
                stroke-width="1.5" 
                stroke-dasharray="8 24" 
                stroke-linecap="round" 
                transform="rotate(${orbitAngle} 16 16)" 
                opacity="${0.4 * signalScale}"
        />
      `;
    }

    // 2. Semantic Micro-Symbols
    if (overlay.symbol !== "none") {
      let symbolPath = "";
      if (overlay.symbol === "success") {
        symbolPath = `<path d="M11 16L14 19L21 12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
      } else if (overlay.symbol === "ai") {
        symbolPath = `<path d="M16 8L18 14L24 16L18 18L16 24L14 18L8 16L14 14L16 8Z" fill="white"/>`;
      } else if (overlay.symbol === "welcome") {
        symbolPath = `<circle cx="16" cy="16" r="4" stroke="white" stroke-width="2"/><path d="M16 6V8M16 24V26M6 16H8M24 16H26" stroke="white" stroke-width="2" stroke-linecap="round"/>`;
      } else if (overlay.symbol === "live") {
        symbolPath = `<circle cx="24" cy="24" r="4" fill="${activeColor}"/><circle cx="24" cy="24" r="2" fill="white"/>`;
      } else if (overlay.symbol === "warning") {
        symbolPath = `<path d="M16 8V18M16 22V24" stroke="white" stroke-width="3" stroke-linecap="round"/>`;
      } else if (overlay.symbol === "milestone") {
        symbolPath = `<path d="M12 10L16 6L20 10M16 6V22M10 22H22" stroke="white" stroke-width="2" stroke-linecap="round"/>`; // Arrow Up/↑
      }

      const symbolOpacity = event === "none" ? 0.8 : 1;
      overlays += `<g opacity="${symbolOpacity}">${symbolPath}</g>`;
    }

    if (badgeCount > 0) {
      const displayCount = badgeCount > 9 ? "9+" : badgeCount.toString();
      overlays += `
        <circle cx="24" cy="8" r="7" fill="#EF4444" />
        <text x="24" y="10.5" fill="white" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">${displayCount}</text>
      `;
    }

    if (glowOpacity > 0) {
      overlays += `
        <circle cx="16" cy="16" r="10" fill="${activeColor}" opacity="${glowOpacity * signalScale * 0.4}" />
      `;
    }

    const svg = `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" fill="#0F172A" rx="4" />
        ${glyphPaths}
        ${overlays}
      </svg>
    `.trim();

    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64}`;
  }
}
