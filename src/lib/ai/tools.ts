import { db } from "@/lib/db";
import { type AIRole } from "./llm";

export async function executeToolInternal(
  toolName: string,
  args: Record<string, unknown>,
  orgId: string,
  userId: string,
  role: AIRole
): Promise<unknown> {
  console.log(`[ai/tool] ${toolName} | org:${orgId} | role:${role}`, args);

  try {
    switch (toolName) {

      // ── Bookings ──────────────────────────────────────────────────
      // Table: crm.bookings
      // Key columns: scheduled_at (not slot_time), final_amount (not price),
      //              customer_id / staff_id (no denormalized name columns)
      case "get_bookings": {
        let q = db("crm").from("bookings")
          .select("id, customer_id, staff_id, services, scheduled_at, status, final_amount, payment_status, source, notes")
          .eq("org_id", orgId);

        if (args.date) {
          const d = String(args.date);
          q = q.gte("scheduled_at", d).lt("scheduled_at", nextDay(d));
        }
        if (args.status) q = q.eq("status", String(args.status));
        if (args.staff_id) q = q.eq("staff_id", String(args.staff_id));

        const { data: bookings } = await q
          .order("scheduled_at", { ascending: false })
          .limit(Number(args.limit) || 20);

        const rows = bookings ?? [];
        const customerIds = [...new Set(rows.map((b: any) => b.customer_id).filter(Boolean))];
        const { data: customers } = customerIds.length > 0
          ? await db("crm").from("customers").select("id, name, phone").in("id", customerIds)
          : { data: [] };

        const customerMap: Record<string, { name: string; phone: string }> = {};
        (customers ?? []).forEach((c: any) => { customerMap[c.id] = { name: c.name, phone: c.phone }; });

        return rows.map((b: any) => {
          const services = Array.isArray(b.services) ? b.services : [];
          const duration = services.reduce((s: number, sv: any) => s + (sv.duration_minutes || sv.duration || 0), 0);
          return {
            ...b,
            duration_minutes: duration,
            customer_name: customerMap[b.customer_id]?.name ?? null,
            customer_phone: customerMap[b.customer_id]?.phone ?? null,
          };
        });
      }

      // ── Revenue ───────────────────────────────────────────────────
      case "get_revenue": {
        let q = db("crm").from("bookings")
          .select("final_amount, scheduled_at")
          .eq("org_id", orgId)
          .eq("status", "completed");

        const period = String(args.period || "today");
        q = applyPeriodFilter(q, period, "scheduled_at");

        const { data } = await q;
        const rows = data ?? [];
        const total = rows.reduce((s: number, r: any) => s + (Number(r.final_amount) || 0), 0);

        const dailyMap: Record<string, number> = {};
        for (const r of rows) {
          const day = (r.scheduled_at as string)?.split("T")[0] ?? "unknown";
          dailyMap[day] = (dailyMap[day] ?? 0) + (Number(r.final_amount) || 0);
        }
        const daily = Object.entries(dailyMap)
          .map(([date, amount]) => ({ date, amount }))
          .sort((a, b) => a.date.localeCompare(b.date));

        return { total_revenue: total, period, daily, count: rows.length };
      }

      // ── Staff Performance ─────────────────────────────────────────
      // Uses crm.revenue_splits (has staff_id + amount per booking service)
      // joined with staff names from ops.staff_members
      case "get_staff_performance": {
        const period = String(args.period || "month");
        let q = db("crm").from("revenue_splits")
          .select("staff_id, amount, created_at")
          .eq("org_id", orgId)
          .not("staff_id", "is", null);

        q = applyPeriodFilter(q, period, "created_at");

        const [splitsRes, staffRes] = await Promise.all([
          q,
          db("ops").from("staff_members").select("id, name").eq("org_id", orgId),
        ]);

        const staffMap: Record<string, string> = {};
        (staffRes.data ?? []).forEach((s: any) => { staffMap[s.id] = s.name; });

        const map: Record<string, { name: string; revenue: number; count: number }> = {};
        for (const r of (splitsRes.data ?? [])) {
          if (!r.staff_id) continue;
          if (!map[r.staff_id]) map[r.staff_id] = { name: staffMap[r.staff_id] ?? "Unknown", revenue: 0, count: 0 };
          map[r.staff_id].revenue += Number(r.amount) || 0;
          map[r.staff_id].count += 1;
        }

        return Object.values(map)
          .sort((a, b) => b.revenue - a.revenue)
          .map((s) => ({ ...s, avg_per_booking: s.count > 0 ? Math.round(s.revenue / s.count) : 0 }));
      }

      // ── Inventory Alerts ──────────────────────────────────────────
      // Table: inventory.products — columns: current_stock, reorder_level
      case "get_inventory_alerts": {
        const { data } = await db("inventory").from("products")
          .select("id, name, current_stock, reorder_level, unit, category")
          .eq("org_id", orgId)
          .eq("is_active", true)
          .limit(Number(args.limit) || 50);

        const alerts = (data ?? []).filter((i: any) =>
          Number(i.current_stock) <= Number(i.reorder_level)
        );
        return alerts;
      }

      // ── Customer Insights ─────────────────────────────────────────
      // Table: crm.customers — name (not full_name), total_spend, total_visits, last_visit_at
      case "get_customer_insights": {
        let q = db("crm").from("customers")
          .select("id, name, phone, email, total_spend, total_visits, last_visit_at, created_at, customer_type, loyalty_points")
          .eq("org_id", orgId)
          .is("deleted_at", null);

        const type = String(args.type || "top");
        if (type === "top") q = q.order("total_spend", { ascending: false });
        else if (type === "churn_risk") q = q.not("last_visit_at", "is", null).order("last_visit_at", { ascending: true });
        else if (type === "new") q = q.order("created_at", { ascending: false });
        else if (type === "recent") q = q.not("last_visit_at", "is", null).order("last_visit_at", { ascending: false });

        const { data } = await q.limit(Number(args.limit) || 10);
        return data ?? [];
      }

      // ── Contact Requests ──────────────────────────────────────────
      // Table: crm.contact_requests — contact_name (not name)
      case "get_contact_requests": {
        let q = db("crm").from("contact_requests")
          .select("id, contact_name, phone, message, status, created_at, city, source")
          .eq("org_id", orgId);

        if (args.status) q = q.eq("status", String(args.status));

        const { data } = await q
          .order("created_at", { ascending: false })
          .limit(Number(args.limit) || 10);
        return data ?? [];
      }

      // ── Notifications summary ─────────────────────────────────────
      case "get_notifications": {
        const [pendingRes, productsRes] = await Promise.all([
          db("crm").from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("org_id", orgId)
            .eq("status", "pending"),
          db("inventory").from("products")
            .select("id, name, current_stock, reorder_level")
            .eq("org_id", orgId)
            .eq("is_active", true),
        ]);

        const lowStock = (productsRes.data ?? []).filter((i: any) =>
          Number(i.current_stock) <= Number(i.reorder_level)
        ).length;

        return {
          pending_bookings: pendingRes.count ?? 0,
          low_inventory_items: lowStock,
        };
      }

      // ── Employee: Schedule ────────────────────────────────────────
      // bookings.staff_id → ops.staff_members.id (not auth user id)
      case "get_schedule": {
        // Resolve auth user → staff_member id
        const { data: staffRecord } = await db("ops").from("staff_members")
          .select("id")
          .eq("user_id", userId)
          .eq("org_id", orgId)
          .single();

        const staffMemberId = staffRecord?.id ?? userId;
        const daysAhead = Number(args.days_ahead) || 7;
        const from = String(args.date ?? new Date().toISOString().split("T")[0]);
        const to = addDays(from, daysAhead);

        const { data } = await db("crm").from("bookings")
          .select("id, customer_id, services, scheduled_at, status, notes")
          .eq("staff_id", staffMemberId)
          .gte("scheduled_at", from)
          .lt("scheduled_at", to)
          .order("scheduled_at", { ascending: true });
        const rows = data ?? [];
        return rows.map((b: any) => {
          const services = Array.isArray(b.services) ? b.services : [];
          const duration = services.reduce((s: number, sv: any) => s + (sv.duration_minutes || sv.duration || 0), 0);
          return {
            ...b,
            duration_minutes: duration
          };
        });
      }

      // ── Employee: Performance ─────────────────────────────────────
      case "get_my_performance": {
        const { data: staffRecord } = await db("ops").from("staff_members")
          .select("id")
          .eq("user_id", userId)
          .eq("org_id", orgId)
          .single();

        const staffMemberId = staffRecord?.id ?? userId;
        const period = String(args.period || "month");
        let q = db("crm").from("revenue_splits")
          .select("amount, created_at")
          .eq("staff_id", staffMemberId)
          .eq("org_id", orgId);

        q = applyPeriodFilter(q, period, "created_at");
        const { data } = await q;

        const revenue = (data ?? []).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
        return {
          period,
          total_revenue: revenue,
          completed_bookings: (data ?? []).length,
          avg_per_booking: (data ?? []).length > 0 ? Math.round(revenue / (data ?? []).length) : 0,
        };
      }

      // ── Customer: Search Businesses ──────────────────────────────
      case "search_businesses": {
        const { data } = await db("public").rpc("search_branches", {
          p_city:          args.city          ? String(args.city)         : null,
          p_industry_type: args.service_type  ? String(args.service_type) : null,
          p_query:         args.query         ? String(args.query)        : null,
          p_limit:         20,
          p_offset:        0,
        });
        return (data ?? []).map((b: any) => ({
          id:            b.branch_id,
          name:          b.branch_name,
          slug:          b.org_slug,
          city:          b.city,
          category:      b.industry_type,
          description:   b.address,
          is_verified:   b.is_verified,
          open_now:      b.accepting_bookings,
        }));
      }

      // ── Customer: Services List ───────────────────────────────────
      // Table: ops.service_catalogue (not ops.services)
      case "get_services_list": {
        let q = db("ops").from("service_catalogue")
          .select("id, name, description, price, duration_minutes, category")
          .eq("org_id", String(args.org_id || orgId))
          .eq("is_active", true);

        if (args.category) q = q.eq("category", String(args.category));
        const { data } = await q.order("price", { ascending: true });
        return data ?? [];
      }

      // ── Customer: Available Slots ─────────────────────────────────
      // bookings.scheduled_at (not slot_time); no direct service_id column
      case "get_available_slots": {
        const { data } = await db("crm").from("bookings")
          .select("scheduled_at")
          .eq("org_id", orgId)
          .gte("scheduled_at", String(args.date))
          .lt("scheduled_at", nextDay(String(args.date)))
          .in("status", ["confirmed", "in_progress", "pending"]);

        // Build set of booked HH:MM strings for comparison
        const booked = new Set(
          (data ?? []).map((b: any) =>
            (b.scheduled_at as string)?.substring(0, 16)
          )
        );

        const slots = generateTimeSlots(String(args.date)).map((t) => ({
          time: t,
          available: !booked.has(t.substring(0, 16)),
        }));
        return slots;
      }

      // ── Staging ───────────────────────────────────────────────────
      case "stage_booking":
      case "stage_booking_request": {
        const { data, error } = await db("ai").from("requests")
          .insert({
            org_id: orgId,
            user_id: userId !== "anon" ? userId : null,
            role,
            intent: "create_booking",
            payload: args,
            status: "awaiting_confirmation",
          })
          .select("id")
          .single();

        if (error) throw new Error(error.message);
        return {
          success: true,
          staging_id: data?.id,
          booking_details: {
            customer_name: args.customer_name ?? null,
            phone: args.phone ?? null,
            service_name: args.service_name ?? null,
            staff_name: args.staff_name ?? null,
            slot_time: args.slot_time ?? null,
            notes: args.notes ?? null,
          },
        };
      }

      // ── Escalation ────────────────────────────────────────────────
      case "create_escalation_request": {
        const { data, error } = await db("ai").from("requests")
          .insert({
            org_id: orgId,
            user_id: userId !== "anon" ? userId : null,
            role,
            intent: "escalation",
            payload: args,
            status: "pending",
          })
          .select("id")
          .single();

        if (error) throw new Error(error.message);
        return { success: true, request_id: data?.id };
      }

      default:
        console.error(`[ai/tool] Unknown tool: ${toolName}`);
        return { error: `Tool "${toolName}" is not implemented.` };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ai/tool] FAILED: ${toolName}`, msg);
    return { error: msg };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function nextDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function applyPeriodFilter(query: any, period: string, column = "created_at"): any {
  const now = new Date();
  if (period === "today") {
    const today = now.toISOString().split("T")[0];
    return query.gte(column, today);
  }
  if (period === "week") {
    return query.gte(column, new Date(now.getTime() - 7 * 86400_000).toISOString());
  }
  if (period === "month") {
    return query.gte(column, new Date(now.getTime() - 30 * 86400_000).toISOString());
  }
  if (period === "year") {
    return query.gte(column, new Date(now.getTime() - 365 * 86400_000).toISOString());
  }
  return query;
}

function generateTimeSlots(date: string): string[] {
  const slots: string[] = [];
  for (let h = 9; h <= 19; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      slots.push(`${date}T${hh}:${mm}:00`);
    }
  }
  return slots;
}
