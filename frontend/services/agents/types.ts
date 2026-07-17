import type { AIProvider, AIResponse } from "../ai/types";
import type { MemoryContext, MemoryValue } from "../memory/types";

export type AgentData = MemoryValue;

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
}

export interface Agent {
  readonly name: string;
  readonly description: string;
  readonly capabilities: readonly AgentCapability[];
  execute(request: AgentRequest): Promise<AgentResponse>;
}

export interface AgentContext {
  memory?: MemoryContext;
  data?: Readonly<Record<string, AgentData>>;
}

export interface AgentRequest {
  agent: string;
  prompt: string;
  context?: AgentContext;
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Readonly<Record<string, AgentData>>;
}

export interface AgentMetadata {
  executionId: string;
  agent: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  provider?: AIProvider;
  model?: string;
}

export interface AgentResponse<TData extends AgentData = AgentData> {
  success: boolean;
  content: string;
  data?: TData;
  error?: string;
  metadata: AgentMetadata;
}

export interface AgentExecutionResult<TData extends AgentData = AgentData> {
  response: AgentResponse<TData>;
  routerResponse?: AIResponse;
}

export type AgentExecutionLogger = (metadata: AgentMetadata) => void | Promise<void>;
