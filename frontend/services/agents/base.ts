import { askAI } from "../ai/router";
import type { AIRequest, AIResponse } from "../ai/types";
import type { MemoryContext } from "../memory/types";
import type {
  Agent,
  AgentCapability,
  AgentContext,
  AgentData,
  AgentMetadata,
  AgentRequest,
  AgentResponse,
} from "./types";
import type { AgentPrompt } from "./prompts";

export type AIRouter = (request: AIRequest) => Promise<AIResponse>;
export type MemoryContextLoader = (request: AgentRequest) => Promise<MemoryContext | undefined>;

export interface BaseAgentDependencies {
  router?: AIRouter;
  loadMemoryContext?: MemoryContextLoader;
  createExecutionId?: () => string;
  now?: () => Date;
}

const defaultExecutionId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `agent-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export abstract class BaseAgent implements Agent {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly capabilities: readonly AgentCapability[];
  protected abstract readonly promptDefinition: AgentPrompt;

  private readonly router: AIRouter;
  private readonly loadContext: MemoryContextLoader;
  private readonly createExecutionId: () => string;
  private readonly now: () => Date;

  constructor(dependencies: BaseAgentDependencies = {}) {
    this.router = dependencies.router ?? askAI;
    this.loadContext = dependencies.loadMemoryContext ?? (async (request) => request.context?.memory);
    this.createExecutionId = dependencies.createExecutionId ?? defaultExecutionId;
    this.now = dependencies.now ?? (() => new Date());
  }

  async execute(request: AgentRequest): Promise<AgentResponse> {
    const startedAt = this.now();
    const executionId = this.createExecutionId();

    try {
      const memory = await this.loadContext(request);
      const systemPrompt = this.buildSystemPrompt(memory);
      const result = await this.router({
        provider: request.provider,
        model: request.model,
        systemPrompt,
        prompt: this.buildUserPrompt(request, memory),
        temperature: request.temperature,
        maxTokens: request.maxTokens,
      });
      const metadata = this.buildMetadata(executionId, startedAt, result.provider, result.model);

      if (!result.success) {
        return { success: false, content: "", error: result.error ?? "AI Router request failed.", metadata };
      }

      return { success: true, content: result.text, data: this.parseData(result.text), metadata };
    } catch (error: unknown) {
      return {
        success: false,
        content: "",
        error: error instanceof Error ? error.message : "Agent execution failed.",
        metadata: this.buildMetadata(executionId, startedAt),
      };
    }
  }

  protected buildSystemPrompt(memory: MemoryContext | undefined): string {
    const prompt = this.promptDefinition;
    const sections = [
      `Role: ${prompt.role}`,
      `Objective: ${prompt.objective}`,
      `Tone: ${prompt.tone}`,
      `Response format: ${prompt.responseFormat}`,
      `Constraints:\n${prompt.constraints.map((constraint) => `- ${constraint}`).join("\n")}`,
    ];
    if (memory) sections.push(`Founder context:\n${JSON.stringify(memory)}`);
    return sections.join("\n\n");
  }

  protected buildUserPrompt(request: AgentRequest, context: MemoryContext | undefined): string {
    const additionalContext: AgentContext["data"] = request.context?.data;
    return [request.prompt, additionalContext ? `Additional context:\n${JSON.stringify(additionalContext)}` : "", context ? "Use the founder context supplied in the system prompt." : ""].filter(Boolean).join("\n\n");
  }

  protected parseData(content: string): AgentData | undefined {
    try {
      const normalized = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      const parsed: unknown = JSON.parse(normalized);
      return this.isAgentData(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  private buildMetadata(executionId: string, startedAt: Date, provider?: AgentMetadata["provider"], model?: string): AgentMetadata {
    const completedAt = this.now();
    return { executionId, agent: this.name, startedAt: startedAt.toISOString(), completedAt: completedAt.toISOString(), durationMs: completedAt.getTime() - startedAt.getTime(), ...(provider ? { provider } : {}), ...(model ? { model } : {}) };
  }

  private isAgentData(value: unknown): value is AgentData {
    if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return true;
    if (Array.isArray(value)) return value.every((item) => this.isAgentData(item));
    return typeof value === "object" && Object.values(value).every((item) => this.isAgentData(item));
  }
}
