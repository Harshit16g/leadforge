import type Groq from "groq-sdk";

type Tool = Groq.Chat.ChatCompletionTool;

export const customerTools: Tool[] = [
  {
    type: "function",
    function: {
      name: "search_businesses",
      description: "Search for wellness businesses (salons, spas, gyms, clinics, yoga studios, nail bars, etc.) by name, city, or service type. Use this when a customer wants to find a place to book with.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (e.g. 'best spa in Bangalore', 'yoga studio', 'hair salon')." },
          city: { type: "string", description: "City filter." },
          service_type: { type: "string", description: "Type of service (e.g. 'haircut', 'massage', 'yoga', 'facial')." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_services_list",
      description: "Fetch the list of available services at this wellness business including name, duration, and price.",
      parameters: {
        type: "object",
        properties: {
          org_id: { type: "string", description: "UUID of the organization/business." },
          category: {
            type: "string",
            description: "Optional service category to filter by (e.g. hair, nails, skin).",
          },
        },
        required: ["org_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_available_slots",
      description: "Fetch available appointment slots for a given service and date.",
      parameters: {
        type: "object",
        properties: {
          service_id: {
            type: "string",
            description: "UUID of the service.",
          },
          date: {
            type: "string",
            description: "ISO date (YYYY-MM-DD) for which to find slots.",
          },
          staff_id: {
            type: "string",
            description: "Optional UUID of a preferred staff member.",
          },
        },
        required: ["service_id", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "stage_booking_request",
      description: "Submit a booking request for the customer. The business staff will confirm it. Use only after collecting ALL of: customer name, phone, service name, and preferred date+time.",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Customer's name." },
          phone: { type: "string", description: "Customer's phone number." },
          service_name: { type: "string" },
          service_id: { type: "string" },
          slot_time: { type: "string", description: "ISO 8601 datetime." },
          staff_id: { type: "string", description: "Optional preferred staff UUID." },
          notes: { type: "string" },
        },
        required: ["customer_name", "phone", "service_name", "service_id", "slot_time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_escalation_request",
      description: "Escalate the issue to a human manager. Use when the query is complex, out of scope, or requires direct assistance.",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string" },
          phone: { type: "string" },
          issue_description: { type: "string", description: "Detailed summary of the customer's request or problem." },
          urgency: { type: "string", enum: ["normal", "urgent"] }
        },
        required: ["customer_name", "phone", "issue_description"]
      },
    },
  },
];
