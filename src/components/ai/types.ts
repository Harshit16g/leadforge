// Shared AI message types used across chat wrapper, renderer, and input

export interface AIToolTask {
  id: string;
  name: string;
  label: string;
  icon?: string;
  status: "pending" | "running" | "done" | "error";
  result?: unknown;
}

export interface BusinessResult {
  id: string;
  name: string;
  slug: string;
  city?: string;
  category?: string;
  description?: string;
}

export type AIMessagePart =
  | { type: "text"; content: string }
  | { type: "reasoning"; content: string; isStreaming: boolean }
  | { type: "queue"; tasks: AIToolTask[] }
  | { type: "businesses"; businesses: BusinessResult[] };

export interface AIMessage {
  id: string;
  role: "user" | "ai";
  parts: AIMessagePart[];
  isLoading?: boolean;
  requestId?: string;
  layer?: string;
  model?: string;
}
