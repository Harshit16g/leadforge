import OpenAI from "openai";

/**
 * [PILOT CONFIG] Multi-Agent Tiered LLM Orchestrator
 * Implements tiered model selection, custom timeouts per layer,
 * and automatic primary -> fallback failover with session-pinned pipes.
 */

export type AIRole = "partner" | "employee" | "customer";
export type AgentLayer = "guard" | "normal" | "reasoning" | "ultra" | "design";

interface LLMPipe {
  id: string;
  client: OpenAI;
  provider: string;
}

const LAYER_TIMEOUTS: Record<AgentLayer, number> = {
  guard: 1500,
  normal: 15000,
  reasoning: 30000,
  ultra: 45000,
  design: 45000,
};

class LLMManager {
  private pipes: LLMPipe[] = [];
  private currentPipeIndex = 0;

  public readonly MODELS: Record<string, { primary: string; fallback: string }> = {
    guard: {
      primary: "nvidia/nemotron-mini-4b-instruct",
      fallback: "minimaxai/minimax-m2.5"
    },
    normal: {
      primary: "qwen/qwen3-next-80b-a3b-thinking",
      fallback: "minimaxai/minimax-m2.5"
    },
    reasoning: {
      primary: "qwen/qwen3-next-80b-a3b-thinking",
      fallback: "minimaxai/minimax-m2.5"
    },
    ultra: {
      primary: "minimaxai/minimax-m2.5",
      fallback: "minimaxai/minimax-m2.5"
    },
    design: {
      primary: "nvidia/llama-3.3-nemotron-super-49b-v1",
      fallback: "minimaxai/minimax-m2.5"
    }
  };

  constructor() {
    this.initializePipes();
  }

  private initializePipes() {
    if (this.pipes.length > 0) return; // Prevent double init

    const providers = ['NV', 'TG', 'GR', 'AI'];
    providers.forEach(p => {
      let i = 1;
      while (i < 10) {
        const key = process.env[`${p}_API_K${i}`];
        const base = process.env[`${p}_BASE_K${i}`];
        if (key && base) {
          this.pipes.push({
            id: `${p}_${i}`,
            provider: p,
            client: new OpenAI({
              apiKey: key,
              baseURL: base,
              timeout: 15000,
              maxRetries: 1,
            }),
          });
        }
        i++;
      }
    });

    if (this.pipes.length === 0) {
      console.error("[LLM_ORCHESTRATOR] CRITICAL: No LLM pipes found.");
    } else {
      console.log(`[LLM_ORCHESTRATOR] Initialized with ${this.pipes.length} active pipes.`);
    }
  }

  /**
   * getPipe: Returns a pipe, optionally pinned by ID
   */
  private getPipe(pinnedPipeId?: string): LLMPipe {
    if (this.pipes.length === 0) throw new Error("No LLM pipes available");

    if (pinnedPipeId) {
      const pinned = this.pipes.find(p => p.id === pinnedPipeId);
      if (pinned) return pinned;
      console.warn(`[LLM_ORCHESTRATOR] Pinned pipe ${pinnedPipeId} not found, falling back to rotation.`);
    }

    const pipe = this.pipes[this.currentPipeIndex];
    this.currentPipeIndex = (this.currentPipeIndex + 1) % this.pipes.length;
    return pipe;
  }

  /**
   * getRandomPipeId: Used by callers to "pin" a session to a specific pipe
   */
  public getRandomPipeId(): string {
    if (this.pipes.length === 0) return "";
    const idx = Math.floor(Math.random() * this.pipes.length);
    return this.pipes[idx].id;
  }

  public isNVPipe(pipeId: string): boolean {
    return pipeId.startsWith("NV_");
  }

  public getModelForRole(role: AIRole): string {
    if (role === "customer" || role === "employee") return this.MODELS.ultra.primary;
    return this.MODELS.normal.primary;
  }

  public async chat(
    params: { model: string } & Partial<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming>,
    pinnedPipeId?: string
  ): Promise<OpenAI.Chat.ChatCompletion> {
    const { model, ...rest } = params;
    return this.callWithTimeout(model, rest, 60000, pinnedPipeId);
  }

  public async execute(layer: AgentLayer, params: Partial<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming>, pinnedPipeId?: string): Promise<OpenAI.Chat.ChatCompletion> {
    const model = this.MODELS[layer];
    const timeout = LAYER_TIMEOUTS[layer];

    try {
      return await this.callWithTimeout(model.primary, params, timeout, pinnedPipeId);
    } catch (error: any) {
      console.warn(`[LLM_ORCHESTRATOR] Layer ${layer} PRIMARY failed: ${error.message}. Trying fallback...`);
      return await this.callWithTimeout(model.fallback, params, timeout * 1.5, pinnedPipeId);
    }
  }

  public async stream(
    layer: AgentLayer,
    params: Partial<OpenAI.Chat.ChatCompletionCreateParamsStreaming>,
    pinnedPipeId?: string
  ): Promise<{ stream: any; pipeId: string; start: number }> { // Using any for stream to avoid deep complex union issues, but ensuring it's an iterator
    const model = this.MODELS[layer];
    const timeout = LAYER_TIMEOUTS[layer];

    try {
      return await this.callStreamWithTimeout(model.primary, params, timeout, pinnedPipeId);
    } catch (error: any) {
      console.warn(`[LLM_ORCHESTRATOR] Layer ${layer} STREAM PRIMARY failed: ${error.message}. Trying fallback...`);
      return await this.callStreamWithTimeout(model.fallback, params, timeout * 1.5, pinnedPipeId);
    }
  }

  private async callWithTimeout(model: string, params: any, timeout: number, pinnedPipeId?: string): Promise<OpenAI.Chat.ChatCompletion> {
    const pipe = this.getPipe(pinnedPipeId);
    const start = performance.now();

    try {
      const response = await pipe.client.chat.completions.create({
        ...params,
        model,
        stream: false
      } as any, { timeout });

      this.logSLA(pipe.id, performance.now() - start, true, model);
      return response as OpenAI.Chat.ChatCompletion;
    } catch (error: any) {
      this.logSLA(pipe.id, performance.now() - start, false, model, error.message);
      throw error;
    }
  }

  private async callStreamWithTimeout(model: string, params: any, timeout: number, pinnedPipeId?: string) {
    const pipe = this.getPipe(pinnedPipeId);
    const start = performance.now();

    try {
      const stream = await pipe.client.chat.completions.create({
        ...params,
        model,
        stream: true
      } as any, { timeout });

      return { stream: stream as any, pipeId: pipe.id, start };
    } catch (error: any) {
      this.logSLA(pipe.id, performance.now() - start, false, model, error.message);
      throw error;
    }
  }


  private logSLA(pipeId: string, ttft: number, success: boolean, model: string, error?: string) {
    console.log(`[LLM_SLA] Pipe: ${pipeId} | Model: ${model} | Success: ${success} | TTFT: ${ttft.toFixed(0)}ms ${error ? `| Error: ${error}` : ""}`);
  }
}

export const llm = new LLMManager();
