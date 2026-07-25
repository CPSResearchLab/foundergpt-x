import type { AgentData, AgentDefinition, AgentMessage, AgentRequest, AgentResponse } from "./types";

export type PlanNodeStatus = "pending" | "running" | "completed" | "failed" | "blocked";

export interface TaskNode {
  id: string;
  agent: string;
  task: string;
  dependencies: readonly string[];
  priority: number;
  status: PlanNodeStatus;
}

export interface TaskPlan {
  id: string;
  goal: string;
  rootAgent: string;
  nodes: readonly TaskNode[];
  createdAt: string;
}

export interface AgentWorkspace {
  id: string;
  executionId: string;
  notes: Readonly<Record<string, string>>;
  intermediateOutputs: Readonly<Record<string, string>>;
  temporaryFiles: readonly string[];
  references: readonly string[];
}

export interface ToolCallContext {
  executionId: string;
  agent: string;
  projectId?: string;
  userId?: string;
}

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
}

export interface ExecutionNodeResult {
  nodeId: string;
  agent: string;
  status: "completed" | "failed" | "blocked";
  response?: AgentResponse;
  error?: string;
  attempts: number;
  startedAt: string;
  completedAt: string;
}

export interface GraphExecutionResult {
  nodes: Readonly<Record<string, ExecutionNodeResult>>;
  completed: boolean;
}

export interface OrchestrationRequest extends AgentRequest {
  orchestration?: AgentRequest["orchestration"] & { enabled?: boolean };
}

export interface OrchestrationResponse {
  response: AgentResponse;
  plan: TaskPlan;
  workspace: AgentWorkspace;
  execution: GraphExecutionResult;
  messages: readonly AgentMessage[];
}

export interface ConsensusOpinion {
  agent: string;
  content: string;
  confidence: number;
  rationale: string;
}

export interface ConsensusResult {
  recommendation: string;
  confidence: number;
  rationale: string;
  opinions: readonly ConsensusOpinion[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  execute(input: string, context: ToolCallContext): Promise<ToolResult>;
}

export interface AgentHistoryStore {
  save(record: import("./types").AgentExecutionRecord): Promise<void>;
  get(executionId: string): Promise<import("./types").AgentExecutionRecord | null>;
  list(limit?: number): Promise<import("./types").AgentExecutionRecord[]>;
}

export interface AgentMemorySnapshot {
  working: Readonly<Record<string, string>>;
  recent: readonly string[];
  shared: readonly string[];
}

export type PlannerHint = AgentDefinition | AgentData;
