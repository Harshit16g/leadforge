import type Groq from "groq-sdk";

type Tool = Groq.Chat.ChatCompletionTool;

export const employeeTools: Tool[] = [
  {
    type: "function",
    function: {
      name: "get_schedule",
      description: "Fetch the employee's own upcoming schedule and appointments.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "ISO date (YYYY-MM-DD). Defaults to today.",
          },
          days_ahead: {
            type: "string",
            description: "Number of days ahead to fetch. Default 1 (today only).",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_performance",
      description: "Fetch the employee's own performance metrics — booking count, revenue contribution, attendance.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "Time period for performance data. E.g. 'today', 'week', 'month'.",
          },
        },
        required: ["period"],
      },
    },
  },
];
