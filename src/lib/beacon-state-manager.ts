/**
 * LEAEX Beacon State Manager™
 * Handles priority arbitration, deterministic timelines, and Interaction Semantics.
 */

import { 
  PersistentState, 
  AttentionEvent, 
  SemanticSymbol, 
  BeaconOverlay, 
  BeaconOptions 
} from "./favicon-beacon-engine";
import { createClient } from "./supabase-client/client";

const supabase = createClient();

export interface BeaconInternalState {
  persistent: PersistentState;
  event: AttentionEvent;
  overlay: BeaconOverlay;
  eventElapsedMs: number;
  badgeCount: number;
}

export interface BeaconPolicy {
  reducedMotion: boolean;
  batterySaver: boolean;
  isTabHidden: boolean;
}

// Analytics Callback Hook
export type BeaconAnalyticsHook = (type: "ignored_alert" | "interrupt" | "queue_congestion", data: any) => void;

// Priority Arbitration Stack
const SEVERITY_PRIORITY: Record<AttentionEvent, number> = {
  alert: 100,
  celebratory: 80,
  completion: 60,
  human: 40,
  none: 0,
};

// Timeline duration dictionary (MS)
const TIMELINES: Record<AttentionEvent, number> = {
  alert: 2400,
  celebratory: 2000,
  completion: 1600,
  human: 1200,
  none: 0,
};

export interface QueueEventOptions {
  type: AttentionEvent;
  priority?: number;
  interruptible?: boolean;
}

export class BeaconStateManager {
  private state: BeaconInternalState = {
    persistent: "idle",
    event: "none",
    overlay: { symbol: "none", persistent: false },
    eventElapsedMs: 0,
    badgeCount: 0,
  };

  private policies: BeaconPolicy = {
    reducedMotion: false,
    batterySaver: false,
    isTabHidden: false,
  };

  private eventQueue: QueueEventOptions[] = [];
  
  // Overlay Expiry Tracking
  private overlayExpiresAt: number = 0;

  // Cooldown Governance
  private lastAttentionPulseAt: number = 0;
  private COOLDOWN_MS = 500;

  private lastRenderedStateHash: string = "";
  private lastTickMs: number = Date.now();

  private onUpdate: (options: BeaconOptions) => void;
  private onLog?: BeaconAnalyticsHook;

  constructor(onUpdate: (options: BeaconOptions) => void, onLog?: BeaconAnalyticsHook) {
    this.onUpdate = onUpdate;
    this.onLog = onLog;
  }

  // --- LEAEX Interaction Semantics™ (High-Level API) ---
  
  ai = {
    start: () => this.setPersistent("processing"),
    completed: () => {
      this.setOverlay({ symbol: "ai", expiresAt: Date.now() + 3000 });
      this.queueEvent({ type: "completion", interruptible: true });
    },
    failed: () => {
      this.setOverlay({ symbol: "warning", expiresAt: Date.now() + 5000 });
      this.queueEvent({ type: "alert", interruptible: false });
    },
  };

  payment = {
    succeeded: () => {
      this.setOverlay({ symbol: "success", expiresAt: Date.now() + 3000 });
      this.queueEvent({ type: "celebratory", interruptible: true });
    },
    failed: () => {
      this.setOverlay({ symbol: "warning", expiresAt: Date.now() + 5000 });
      this.queueEvent({ type: "alert", interruptible: false });
    },
  };

  onboarding = {
    finished: () => {
      this.setOverlay({ symbol: "milestone", expiresAt: Date.now() + 4000 });
      this.queueEvent({ type: "celebratory", interruptible: true });
    },
  };

  booking = {
    confirmed: () => {
      this.setOverlay({ symbol: "success", expiresAt: Date.now() + 3000 });
      this.queueEvent({ type: "completion", interruptible: true });
    },
  };

  session = {
    start: () => this.setPersistent("active"),
    end: () => this.setPersistent("idle"),
  };

  human = {
    welcome: () => {
      this.setOverlay({ symbol: "welcome", expiresAt: Date.now() + 3000 });
      this.queueEvent({ type: "human", interruptible: true });
    },
    presence: (isActive: boolean) => {
      this.setOverlay({ symbol: isActive ? "live" : "none", persistent: isActive });
      this.notifyUpdate();
    },
  };

  notify = {
    set: (count: number) => {
      this.state.badgeCount = count;
      this.notifyUpdate();
    },
    clear: () => this.notify.set(0),
  };

  // --- Bootstrap Hooks ---

  async validateSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("No session");
    return data.session;
  }

  async resolveOrg() {
    const { data, error } = await supabase.schema("orgs").from("organizations").select("*").single();
    if (error) console.warn('[BOOTSTRAP] Org resolution failed:', error.message);
    return data;
  }

  async loadPermissions() {
    try {
      const { data, error } = await supabase.rpc("get_user_permissions");
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('[BOOTSTRAP] RPC get_user_permissions not found, falling back to basic perms');
      return { role: 'partner' }; // Fallback
    }
  }

  // --- Core Configuration API ---

  setPolicies(policies: Partial<BeaconPolicy>) {
    this.policies = { ...this.policies, ...policies };
  }

  setPersistent(s: PersistentState) {
    if (this.state.persistent === s) return;
    this.state.persistent = s;
    this.notifyUpdate();
  }

  setOverlay(options: { symbol: SemanticSymbol; persistent?: boolean; expiresAt?: number }) {
    this.state.overlay = {
      symbol: options.symbol,
      persistent: options.persistent || false,
    };
    this.overlayExpiresAt = options.expiresAt || 0;
    this.notifyUpdate();
  }

  // --- Event Queueing Doctrine ---

  queueEvent(opts: QueueEventOptions) {
    const priority = opts.priority ?? SEVERITY_PRIORITY[opts.type];
    const currentPriority = SEVERITY_PRIORITY[this.state.event];

    const isCooldownActive = Date.now() - this.lastAttentionPulseAt < this.COOLDOWN_MS;

    if (this.state.event !== "none" && priority > currentPriority) {
      if (this.onLog) this.onLog("interrupt", { interrupted: this.state.event, priority });
      
      // Interrupt current event
      this.startEvent(opts.type);
    } 
    else if (this.state.event === "none" && !isCooldownActive) {
      // Start immediately
      this.startEvent(opts.type);
    } 
    else {
      // Queue it
      if (this.eventQueue.length > 5 && this.onLog) {
        this.onLog("queue_congestion", { queueLength: this.eventQueue.length });
      }
      this.eventQueue.push({ ...opts, priority });
      this.eventQueue.sort((a, b) => (b.priority || 0) - (a.priority || 0)); // Highest priority first
      
      if (this.onLog && priority < currentPriority) {
         this.onLog("ignored_alert", { ignored: opts.type, active: this.state.event });
      }
    }
  }

  private startEvent(type: AttentionEvent) {
    this.state.event = type;
    this.state.eventElapsedMs = 0;
    this.lastAttentionPulseAt = Date.now();
    this.notifyUpdate();
  }

  // --- Timeline Engine (Milliseconds) ---

  tick() {
    const now = Date.now();
    const deltaMs = now - this.lastTickMs;
    this.lastTickMs = now;
    
    let stateChanged = false;

    // Process Overlay Expiry
    if (!this.state.overlay.persistent && this.overlayExpiresAt > 0 && now > this.overlayExpiresAt) {
      this.state.overlay = { symbol: "none", persistent: false };
      this.overlayExpiresAt = 0;
      stateChanged = true;
    }

    if (this.state.event !== "none") {
      this.state.eventElapsedMs += deltaMs;
      
      const duration = TIMELINES[this.state.event];
      if (this.state.eventElapsedMs > duration) {
        // Event finished
        this.state.event = "none";
        this.state.eventElapsedMs = 0;
        stateChanged = true;
        
        // Dequeue next if any
        if (this.eventQueue.length > 0) {
           const next = this.eventQueue.shift();
           if (next) this.startEvent(next.type);
        }
      } else {
        stateChanged = true; // Animation is progressing
      }
    } else {
       // Idle state, try to consume queue if cooldown passed
       if (this.eventQueue.length > 0 && now - this.lastAttentionPulseAt >= this.COOLDOWN_MS) {
         const next = this.eventQueue.shift();
         if (next) this.startEvent(next.type);
       }
    }

    if (stateChanged) {
      this.notifyUpdate();
    }
  }

  // --- Render Deduplication ---

  private notifyUpdate() {
    const options: BeaconOptions = {
      persistent: this.state.persistent,
      event: this.state.event,
      overlay: { ...this.state.overlay },
      eventElapsedMs: this.state.eventElapsedMs,
      badgeCount: this.state.badgeCount,
      isTabHidden: this.policies.isTabHidden,
      reducedMotion: this.policies.reducedMotion,
    };

    const hash = JSON.stringify(options);
    if (this.lastRenderedStateHash !== hash) {
      this.lastRenderedStateHash = hash;
      this.onUpdate(options);
    }
  }

  getState() {
    return { ...this.state };
  }
}
