import { buildFounderGPTContext } from "../memory/foundergpt-context";
import { memoryManager } from "../memory/memory-manager";
import { AgentCommunicationBus } from "./communication";
import { ConsensusEngine } from "./consensus";
import { ExecutionGraphRunner } from "./execution-graph";
import { AgentMemoryStore } from "./agent-memory";
import { agentHistoryStore } from "./history";
import { TaskPlanner } from "./task-planner";
import { AgentToolRegistry } from "./tools";
import { AgentWorkspaceManager } from "./workspace";
import type { AgentRegistry } from "./registry";
import type { AgentExecutionRecord, AgentRequest, AgentResponse } from "./types";
import type { OrchestrationResponse, TaskPlan } from "./orchestration-types";

export interface AgentOrchestratorDependencies {
  planner?: TaskPlanner;
  runner?: ExecutionGraphRunner;
  communication?: AgentCommunicationBus;
  consensus?: ConsensusEngine;
  workspace?: AgentWorkspaceManager;
  tools?: AgentToolRegistry;
  memory?: AgentMemoryStore;
  history?: typeof agentHistoryStore;
}

export class AgentOrchestrator {
  private readonly planner: TaskPlanner;
  private readonly runner: ExecutionGraphRunner;
  private readonly communication: AgentCommunicationBus;
  private readonly consensus: ConsensusEngine;
  private readonly workspace: AgentWorkspaceManager;
  private readonly tools: AgentToolRegistry;
  private readonly memory: AgentMemoryStore;
  private readonly history: typeof agentHistoryStore;

  constructor(private readonly registry: AgentRegistry, dependencies: AgentOrchestratorDependencies = {}) {
    this.planner = dependencies.planner ?? new TaskPlanner(); this.runner = dependencies.runner ?? new ExecutionGraphRunner(); this.communication = dependencies.communication ?? new AgentCommunicationBus(); this.consensus = dependencies.consensus ?? new ConsensusEngine(); this.workspace = dependencies.workspace ?? new AgentWorkspaceManager(); this.tools = dependencies.tools ?? new AgentToolRegistry(); this.memory = dependencies.memory ?? new AgentMemoryStore(); this.history = dependencies.history ?? agentHistoryStore;
  }

  async execute(request: AgentRequest): Promise<OrchestrationResponse> {
    const started = new Date(); const executionId = createId("execution"); const plan = this.planner.plan(request, this.registry); const workspaceId = this.workspace.create(executionId);
    await this.communication.status(executionId, "orchestrator", `Execution started with ${plan.nodes.length} specialist(s).`);
    const sharedContext = request.sharedContext ?? (request.contextInput ? await buildFounderGPTContext(request.contextInput) : undefined);
    const execution = await this.runner.run({ nodes: plan.nodes }, async ({ node, dependencies }) => {
      await this.communication.request(executionId, plan.rootAgent, node.agent, node.task);
      const dependencyContext = Object.values(dependencies).filter((result) => result.response?.success).map((result) => `${result.agent}: ${result.response?.content.slice(0, 2400)}`).join("\n\n");
      const prompt = dependencyContext ? `${node.task}\n\nSpecialist handoffs:\n${dependencyContext}` : node.task;
      const agent = this.registry.get(node.agent);
      if (!agent) return failureResponse(executionId, node.agent, `Agent ${node.agent} is not registered.`);
      const response = await agent.execute({ ...request, agent: node.agent, prompt, sharedContext, metadata: { ...(request.metadata ?? {}), executionId, workspaceId, taskNodeId: node.id } });
      if (response.success) { this.workspace.output(workspaceId, node.id, response.content); this.memory.setWorking(executionId, node.agent, response.content); this.memory.addRecent(executionId, response.content); await this.memory.saveLongTerm(executionId, node.agent, request.contextInput?.projectId ?? "global", response.content); await this.communication.response(executionId, node.agent, plan.rootAgent, response.content.slice(0, 1200)); }
      else await this.communication.status(executionId, node.agent, `Agent failed: ${response.error ?? "unknown error"}`);
      return response;
    }, { timeoutMs: request.orchestration?.timeoutMs, retries: 1, onStatus: async (node, status) => { await this.communication.status(executionId, node.agent, `${node.agent} ${status}.`); } });
    const opinions = Object.values(execution.nodes).filter((result) => result.response).map((result) => ({ agent: result.agent, response: result.response! }));
    const consensus = this.consensus.resolve(opinions);
    const completed = new Date();
    const response: AgentResponse = { success: opinions.some((opinion) => opinion.response.success), content: consensus.recommendation, metadata: { executionId, agent: plan.rootAgent, startedAt: started.toISOString(), completedAt: completed.toISOString(), durationMs: completed.getTime() - started.getTime(), ...(opinions.find((opinion) => opinion.response.metadata.provider)?.response.metadata.provider ? { provider: opinions.find((opinion) => opinion.response.metadata.provider)?.response.metadata.provider } : {}), ...(opinions.find((opinion) => opinion.response.metadata.model)?.response.metadata.model ? { model: opinions.find((opinion) => opinion.response.metadata.model)?.response.metadata.model } : {}) }, ...(consensus.confidence ? { data: { confidence: consensus.confidence, rationale: consensus.rationale } } : {}) };
    const record = this.toHistoryRecord(executionId, request, plan, execution, started, completed);
    await this.history.save(record);
    await memoryManager.save({ id: `orchestration-${executionId}`, type: "DECISION", projectId: request.contextInput?.projectId ?? "global", title: `Collaborative execution: ${request.agent}`, summary: consensus.rationale, content: consensus.recommendation, tags: ["agent-orchestration", request.agent], importance: 0.75, source: "agent-orchestrator", metadata: { executionId, agents: plan.nodes.map((node) => node.agent) } });
    await this.communication.status(executionId, "orchestrator", `Execution ${execution.completed ? "completed" : "finished partially"}.`);
    return { response, plan, workspace: this.workspace.snapshot(workspaceId)!, execution, messages: this.communication.list(executionId) };
  }

  getTools(): AgentToolRegistry { return this.tools; }
  getHistory() { return this.history; }
  getMessages(executionId: string) { return this.communication.list(executionId); }
  private toHistoryRecord(executionId: string, request: AgentRequest, plan: TaskPlan, execution: OrchestrationResponse["execution"], started: Date, completed: Date): AgentExecutionRecord { const results: Record<string, string> = {}; for (const result of Object.values(execution.nodes)) if (result.response?.content) results[result.agent] = result.response.content; return { executionId, rootAgent: plan.rootAgent, prompt: request.prompt, startedAt: started.toISOString(), completedAt: completed.toISOString(), durationMs: completed.getTime() - started.getTime(), status: execution.completed ? "completed" : Object.values(execution.nodes).some((result) => result.status === "completed") ? "partial" : "failed", agents: plan.nodes.map((node) => node.agent), results, errors: Object.values(execution.nodes).filter((result) => result.status !== "completed").map((result) => ({ agent: result.agent, nodeId: result.nodeId, message: result.error ?? "Execution failed.", attempt: result.attempts, retryable: result.status !== "blocked", createdAt: result.completedAt })), toolUsage: [], messages: this.communication.list(executionId) }; }
}

function createId(prefix: string): string { return `${prefix}_${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`}`; }
function failureResponse(executionId: string, agent: string, error: string): AgentResponse { const now = new Date().toISOString(); return { success: false, content: "", error, metadata: { executionId, agent, startedAt: now, completedAt: now, durationMs: 0 } }; }

export const agentOrchestrator = (registry: AgentRegistry): AgentOrchestrator => new AgentOrchestrator(registry);
