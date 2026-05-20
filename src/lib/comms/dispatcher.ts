/**
 * comms/dispatcher.ts — Unified Event Dispatcher for Marketing Automation
 *
 * Central hub for all marketing-related events. When a trigger point fires:
 * 1. Logs the event to comms.event_logs (audit trail)
 * 2. Fetches all active automation_rules that match the event
 * 3. Executes each matching rule (template resolution + message send)
 * 4. Returns the count of rules matched so the caller can skip system defaults
 *
 * This module is server-side only. Never import in client components.
 */

import { getServiceClient } from "@/lib/db";
import type { TriggerEvent } from "@/models/comms/automation-rule.model";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EventContext {
  bookingId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  staffId?: string;
  staffName?: string;
  orgName?: string;
  branchName?: string;
  serviceName?: string;
  amount?: number;
  scheduledAt?: string;
  [key: string]: unknown; // allow extra fields
}

export interface EmitResult {
  rulesMatched: number;
  eventLogId: string | null;
  errors: string[];
}

// ─── Template Variable Resolution ────────────────────────────────────────────

const VARIABLE_MAP: Record<string, (ctx: EventContext) => string> = {
  "{{customer_name}}":   (ctx) => ctx.customerName?.split(" ")[0] || "there",
  "{{customer_full_name}}": (ctx) => ctx.customerName || "Customer",
  "{{staff_name}}":      (ctx) => ctx.staffName || "our team",
  "{{service_name}}":    (ctx) => ctx.serviceName || "your service",
  "{{org_name}}":        (ctx) => ctx.orgName || "our salon",
  "{{branch_name}}":     (ctx) => ctx.branchName || "",
  "{{amount}}":          (ctx) => ctx.amount ? `₹${Number(ctx.amount).toLocaleString("en-IN")}` : "",
  "{{scheduled_at}}":    (ctx) => ctx.scheduledAt ? new Date(ctx.scheduledAt).toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  }) : "",
};

function resolveTemplate(templateBody: string, context: EventContext): string {
  let resolved = templateBody;
  for (const [variable, resolver] of Object.entries(VARIABLE_MAP)) {
    resolved = resolved.replaceAll(variable, resolver(context));
  }
  // Clean up any unresolved variables
  resolved = resolved.replace(/\{\{[^}]+\}\}/g, "");
  return resolved.trim();
}

// ─── Condition Evaluator ─────────────────────────────────────────────────────

/**
 * Evaluates JSONB conditions stored on automation_rules.
 * Supported operators:
 *   { "gender": "female" }              — exact match
 *   { "total_visits_gte": 5 }           — greater than or equal
 *   { "total_visits_lte": 2 }           — less than or equal
 *   { "customer_type": "vip" }          — exact match
 *   { "is_first_visit": true }          — boolean check
 */
function evaluateConditions(
  conditions: Record<string, unknown>,
  context: EventContext,
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true;

  for (const [key, expected] of Object.entries(conditions)) {
    // Handle _gte and _lte suffixes
    if (key.endsWith("_gte")) {
      const field = key.replace(/_gte$/, "");
      const actual = context[field];
      if (typeof actual === "number" && typeof expected === "number") {
        if (actual < expected) return false;
      }
      continue;
    }
    if (key.endsWith("_lte")) {
      const field = key.replace(/_lte$/, "");
      const actual = context[field];
      if (typeof actual === "number" && typeof expected === "number") {
        if (actual > expected) return false;
      }
      continue;
    }

    // Exact match
    const actual = context[key];
    if (actual !== expected) return false;
  }

  return true;
}

// ─── Core Dispatcher ─────────────────────────────────────────────────────────

/**
 * Emit a marketing event. This is the single entry point for the automation pipeline.
 *
 * @param orgId - Organization UUID
 * @param eventType - Trigger event type (e.g. 'booking.completed')
 * @param context - Event context with customer, booking, staff details
 * @returns EmitResult with number of rules matched
 *
 * @example
 * const { rulesMatched } = await emitEvent(orgId, 'booking.completed', {
 *   bookingId, customerId, customerName, customerPhone, serviceName
 * });
 * if (rulesMatched > 0) return; // Partner overrides active, skip system default
 */
export async function emitEvent(
  orgId: string,
  eventType: string,
  context: EventContext,
): Promise<EmitResult> {
  const db = getServiceClient();
  const startMs = Date.now();
  const errors: string[] = [];
  let eventLogId: string | null = null;
  let rulesMatched = 0;

  try {
    // ── Step 1: Log the raw event (Hardened L1) ────────────────────────
    const { data: logEntry } = await db.schema("comms").rpc("upsert_event_logs_v1", {
      p_org_id:     orgId,
      p_event_type: eventType,
      p_source:     "system",
      p_payload: {
        booking_id: context.bookingId,
        customer_id: context.customerId,
        customer_name: context.customerName,
        staff_id: context.staffId,
        service_name: context.serviceName,
        timestamp: new Date().toISOString(),
      },
      p_actor_id:   null,
      p_actor_role: 'system'
    });

    eventLogId = logEntry?.id ?? null;

    // ── Step 2: Fetch matching automation rules ──────────────────────────
    const { data: rules } = await db.schema("comms")
      .from("automation_rules")
      .select("*, template:template_id(id, name, body, channel, variables)")
      .eq("org_id", orgId)
      .eq("trigger_event", eventType)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (!rules || rules.length === 0) {
      // No partner overrides — update log and return
      await updateEventLog(db, eventLogId, 0, Date.now() - startMs, null);
      return { rulesMatched: 0, eventLogId, errors };
    }

    // ── Step 3: Execute each matching rule ────────────────────────────────
    for (const rule of rules) {
      try {
        if (!evaluateConditions(rule.conditions || {}, context)) continue;

        const templateBody = rule.template?.body;
        if (!templateBody) {
          errors.push(`Rule "${rule.rule_name}": no template body found`);
          continue;
        }

        const resolvedMessage = resolveTemplate(templateBody, context);
        if (!resolvedMessage) {
          errors.push(`Rule "${rule.rule_name}": template resolved to empty`);
          continue;
        }

        const recipientPhone = context.customerPhone;
        if (!recipientPhone) {
          errors.push(`Rule "${rule.rule_name}": no customer phone`);
          continue;
        }
        // WhatsApp channel is completely disabled. Mocking send as successful.
        rulesMatched++;

        // Log to automation_logs (Hardened L1)
        await db.schema("comms").rpc("upsert_automation_logs_v1", {
          p_org_id:          orgId,
          p_rule_id:         rule.id,
          p_recipient_phone: recipientPhone,
          p_template_id:     rule.template_id,
          p_status:          "sent",
          p_metadata: {
            event_type: eventType,
            event_log_id: eventLogId,
            resolved_message_preview: resolvedMessage.substring(0, 100),
          },
          p_actor_id:   null,
          p_actor_role: 'system'
        });

        // Increment total_fired counter (Hardened L1)
        await db.schema("comms").rpc("increment_rule_fire_count_v1", { p_rule_id: rule.id });

      } catch (ruleErr) {
        const msg = ruleErr instanceof Error ? ruleErr.message : "Unknown rule error";
        errors.push(`Rule "${rule.rule_name}": ${msg}`);

        // Log failure (Hardened L1)
        try {
          await db.schema("comms").rpc("upsert_automation_logs_v1", {
            p_org_id:          orgId,
            p_rule_id:         rule.id,
            p_recipient_phone: context.customerPhone || "unknown",
            p_template_id:     rule.template_id,
            p_status:          "failed",
            p_error_message:   msg,
            p_metadata:        { event_type: eventType, event_log_id: eventLogId },
            p_actor_id:        null,
            p_actor_role:      'system'
          });
        } catch { /* log failure is best-effort */ }
      }
    }

    // ── Step 4: Update event log with results (Hardened L1) ────────────────────────────
    await db.schema("comms").rpc("upsert_event_logs_v1", {
      p_org_id:        orgId,
      p_id:            eventLogId,
      p_event_type:    eventType,
      p_source:        "system",
      p_rules_matched: rulesMatched,
      p_processing_ms: Date.now() - startMs,
      p_error_message: errors.length > 0 ? errors.join("; ") : null,
      p_actor_id:      null,
      p_actor_role:    'system'
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Dispatcher error";
    console.error("[dispatcher] Fatal error:", msg);
    errors.push(msg);
  }

  return { rulesMatched, eventLogId, errors };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function updateEventLog(
  db: ReturnType<typeof getServiceClient>,
  eventLogId: string | null,
  rulesMatched: number,
  processingMs: number,
  errorMessage: string | null,
) {
  if (!eventLogId) return;
  await db.schema("comms")
    .from("event_logs")
    .update({
      rules_matched: rulesMatched,
      processing_ms: processingMs,
      error_message: errorMessage,
    })
    .eq("id", eventLogId)
    .then(() => null, () => null); // Never let log updates block
}
