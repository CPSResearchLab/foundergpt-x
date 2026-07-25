import type { AIProvider, AIResponse } from "../ai/types";
import type { MemoryContext, MemoryValue } from "../memory/types";
import type { FounderGPTContext, FounderGPTContextInput } from "../memory/foundergpt-context";

export type AgentData = MemoryValue;

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
}

export interface Agent {
  readonly name: string;
  /** Human-readable label shown in the UI. */
  readonly displayLabel: string;
  /** Short description shown in the agent selector. */
  readonly description: string;
  /** Emoji or icon identifier for the UI. */
  readonly icon: string;
  readonly capabilities: readonly AgentCapability[];
  execute(request: AgentRequest): Promise<AgentResponse>;
}

export interface AgentDefinition {
  name: string;
  role: string;
  skills: readonly string[];
  limitations: readonly string[];
  supportedTasks: readonly string[];
  priority: number;
  temperature: number;
  preferredModel: string;
  description: string;
}

export interface AgentContext {
  memory?: MemoryContext;
  data?: Readonly<Record<string, AgentData>>;
}

export interface AgentRequest {
  agent: string;
  prompt: string;
  context?: AgentContext;
  contextInput?: FounderGPTContextInput;
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Readonly<Record<string, AgentData>>;
  /** Shared context prepared once for a collaborative execution. */
  sharedContext?: FounderGPTContext;
  /** Enables orchestration for this request; direct execution remains the default. */
  orchestration?: {
    enabled?: boolean;
    maxAgents?: number;
    timeoutMs?: number;
  };
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

export type AgentCommunicationType = "request" | "response" | "broadcast" | "handoff" | "status";

export interface AgentMessage {
  id: string;
  executionId: string;
  from: string;
  to: string | "broadcast";
  type: AgentCommunicationType;
  content: string;
  createdAt: string;
  metadata?: Readonly<Record<string, AgentData>>;
}

export interface AgentExecutionError {
  agent: string;
  nodeId: string;
  message: string;
  attempt: number;
  retryable: boolean;
  createdAt: string;
}

export interface AgentExecutionRecord {
  executionId: string;
  rootAgent: string;
  prompt: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: "completed" | "partial" | "failed";
  agents: readonly string[];
  results: Readonly<Record<string, string>>;
  errors: readonly AgentExecutionError[];
  toolUsage: readonly string[];
  messages: readonly AgentMessage[];
}

export type AgentExecutionLogger = (metadata: AgentMetadata) => void | Promise<void>;
