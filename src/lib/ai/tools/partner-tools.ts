import type OpenAI from "openai";

type Tool = OpenAI.Chat.ChatCompletionTool;

export const partnerTools: Tool[] = [
  // ── Bookings & CRM ────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "get_bookings",
      description: "Fetch bookings for this organisation. Use to answer questions about today's schedule, upcoming appointments, or booking counts.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "ISO date string (YYYY-MM-DD). Defaults to today if not provided." },
          status: { type: "string", description: "Filter by booking status. E.g. 'confirmed', 'completed', 'in_progress', 'cancelled', 'pending'." },
          source: { type: "string", description: "Filter by booking source. 'walkin' or 'online'." },
          staff_id: { type: "string", description: "UUID of a specific staff member to filter by." },
          limit: { type: "string", description: "Max number of bookings to return. Default 20." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "stage_booking",
      description: "Stage a new booking or walk-in request. This does NOT create the booking immediately — it creates a pending request that the owner must approve. Use only when the owner has clearly asked to book a specific customer for a specific service.",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Customer's full name." },
          phone: { type: "string", description: "Customer's phone number (10 digits, no country code)." },
          service_name: { type: "string", description: "Name of the service requested (used for display in the confirmation card)." },
          service_id: { type: "string", description: "UUID of the service from the services list." },
          staff_name: { type: "string", description: "Name of the assigned staff member." },
          staff_id: { type: "string", description: "UUID of the assigned staff member." },
          slot_time: { type: "string", description: "ISO 8601 datetime for the appointment (e.g. 2026-05-01T14:30:00)." },
          notes: { type: "string", description: "Optional special instructions." },
        },
        required: ["customer_name", "phone", "service_name", "service_id", "staff_name", "staff_id", "slot_time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_customer_insights",
      description: "Fetch customer analytics and detailed records. Use to find top spenders, at-risk customers, new acquisitions, or recent visitors for targeted marketing.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "Type of customer insight to retrieve. Options: 'top' (highest spend), 'churn_risk' (not visited recently), 'new' (recently added), 'recent' (visited recently).",
          },
          limit: {
            type: "string",
            description: "Number of customers to return. Default 10.",
          },
        },
        required: ["type"],
      },
    },
  },
  // ── Business & Analytics ──────────────────────────────────────
  {
    type: "function",
    function: {
      name: "get_revenue",
      description: "Fetch revenue and financial metrics. Use to answer questions about earnings, top services, or business performance.",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", description: "Time period for the revenue data. E.g. 'today', 'week', 'month', 'last_week', 'last_month'." },
        },
        required: [],
      },
    },
  },
  // ── Staff & Inventory ─────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "get_staff_performance",
      description: "Fetch staff performance metrics including booking count, revenue contribution, and utilisation percentage.",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", description: "Time period for performance data. E.g. 'today', 'week', 'month'. Defaults to week." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_inventory_alerts",
      description: "Fetch inventory items that are at or below their reorder level. Use when asked about low stock or reorder needs.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "string", description: "Max number of alerts to return. Default 10." },
        },
        required: [],
      },
    },
  },
  // ── Communications & Marketing ────────────────────────────────
  {
    type: "function",
    function: {
      name: "get_contact_requests",
      description: "Fetch customer inquiries and contact requests. Use when asked about new messages, leads, or people wanting to connect.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status. E.g. 'unread', 'replied', 'ignored'." },
          limit: { type: "string", description: "Max number of requests to return. Default 10." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_notifications",
      description: "Fetch a summary of all important items requiring attention: pending bookings, unread contact requests, and low inventory. Use for general 'what's new' or 'summary' queries.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];
